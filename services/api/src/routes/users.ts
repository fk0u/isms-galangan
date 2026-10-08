import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { bumpTokenVersion, comparePassword, hashPassword, requireAuth } from "../auth.js";
import { requireManageUsers, roleRank, ROLES } from "../policy.js";
import { requestActor, requestIp, writeAudit, type AuditInput } from "../audit.js";
import { exec, q, withTx } from "../db.js";
import { fail, ok } from "../envelope.js";

// Kelola users: direktur/developer/manager/admin (rbac.ts requireManageUsers).
// Daftar di bawah untuk pesan/cek password — selaras dengan rbac (unik,
// case-insensitive agar "Manager"/"ADMIN" tidak lolos satu jalur tapi gagal
// di jalur lain).
const MANAGE_ROLES = ["direktur", "developer", "manager", "admin"];
const manageGuards = [requireAuth, requireManageUsers()];

function isPrivileged(role: unknown): boolean {
  return typeof role === "string" && MANAGE_ROLES.includes(role.toLowerCase());
}

interface UserRow {
  id: string;
  username: string;
  pass_hash: string;
  name: string;
  role: string;
  email: string;
  is_active: number | null;
  employee_id?: string | null;
  token_version?: number | null;
}

function toPublic(row: UserRow): {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string;
  isActive: boolean;
  employeeId: string | null;
} {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    email: row.email,
    isActive: (row.is_active ?? 1) !== 0,
    employeeId: typeof row.employee_id === "string" ? row.employee_id : null,
  };
}

async function assertEmployeeExists(employeeId: string): Promise<boolean> {
  if (employeeId === "") return true;
  const rows = await q("SELECT id FROM employees WHERE id = ?", [employeeId]);
  return rows.length > 0;
}

const CreateSchema = z.object({
  username: z.string().min(1).max(128),
  name: z.string().min(1).max(128),
  role: z.enum(ROLES),
  email: z.string().max(256).optional().default(""),
    /* 6 karakter terlalu lemah untuk akun yang bisa mengubah jurnal, CoA,
       dan struktur organisasi. Batas atas 72 tetap (bcrypt). */
    password: z.string().min(8, "Password minimal 8 karakter").max(72),
  employeeId: z.string().max(128).optional().default(""),
});

const PatchSchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
    role: z.enum(ROLES).optional(),
    email: z.string().max(256).optional(),
    isActive: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
    employeeId: z.string().max(128).nullable().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.role !== undefined ||
      v.email !== undefined ||
      v.isActive !== undefined ||
      v.employeeId !== undefined,
    { message: "Nothing to update" },
  );

const PasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password minimal 8 karakter").max(72),
});

const SELECT_COLS = "id, username, pass_hash, name, role, email, is_active, employee_id, token_version FROM users";

async function persistUserChange(mutate: () => Promise<unknown>, audit: AuditInput): Promise<void> {
  await withTx(async () => {
    await mutate();
    await writeAudit(audit, { required: true });
  });
}

export function registerUserRoutes(app: FastifyInstance): void {
  app.get("/api/users", { preHandler: manageGuards }, async () => {
    const rows = await q<UserRow>(`SELECT ${SELECT_COLS} ORDER BY username ASC`);
    return ok({ users: rows.map(toPublic) });
  });

  app.post("/api/users", { preHandler: manageGuards }, async (req, reply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const actorRole = req.user?.role;
    const actorRank = roleRank(actorRole);
    const targetRoleRank = roleRank(parsed.data.role);

    // Tolak bila rank(target role) >= rank(actor) kecuali actor developer/direktur (rank >= 90)
    if (actorRank < 90 && targetRoleRank >= actorRank) {
      return reply.status(403).send(fail("Tidak memiliki izin membuat pengguna dengan peran setara atau lebih tinggi", "FORBIDDEN"));
    }
    if (targetRoleRank > actorRank) {
      return reply.status(403).send(fail("Tidak dapat membuat pengguna dengan peran melebihi peran sendiri", "FORBIDDEN"));
    }

    const dup = await q(`SELECT id FROM users WHERE username = ?`, [parsed.data.username]);
    if (dup.length > 0) return reply.status(409).send(fail("Username sudah dipakai", "CONFLICT"));
    if (parsed.data.employeeId && !(await assertEmployeeExists(parsed.data.employeeId))) {
      return reply.status(422).send(fail(`Karyawan ${parsed.data.employeeId} tidak ada`, "UNPROCESSABLE"));
    }
    const id = randomUUID();
    const passHash = await hashPassword(parsed.data.password);
    const created = {
      id,
      username: parsed.data.username,
      name: parsed.data.name,
      role: parsed.data.role,
      email: parsed.data.email,
      isActive: true,
      employeeId: parsed.data.employeeId || null,
    };
    /* Akun + peran adalah permukaan paling sensitif di aplikasi. Tanpa baris
       ini, pembuatan akun/eskalasi peran/reset password tidak pernah muncul
       di audit_log karena routes/users.ts sama sekali tidak memanggil
       writeAudit. Password SENGAJA tidak ikut dicatat. */
    await persistUserChange(
      () => exec(
        "INSERT INTO users (id, username, pass_hash, name, role, email, is_active, employee_id) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
        [id, parsed.data.username, passHash, parsed.data.name, parsed.data.role, parsed.data.email, parsed.data.employeeId || null],
      ),
      {
        actor: requestActor(req),
        action: "create",
        table: "users",
        rowId: id,
        diff: { username: created.username, name: created.name, role: created.role, email: created.email },
        ip: requestIp(req),
      },
    );
    return reply.status(201).send(ok(created));
  });

  app.patch("/api/users/:id", { preHandler: manageGuards }, async (req, reply) => {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    if ("password" in raw || "pass_hash" in raw || "newPassword" in raw) {
      return reply
        .status(400)
        .send(fail("Gunakan endpoint password khusus untuk ganti password", "VALIDATION_ERROR"));
    }
    const parsed = PatchSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    const rows = await q<UserRow>(`SELECT ${SELECT_COLS} WHERE id = ?`, [id]);
    if (rows.length === 0) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const current = rows[0] as UserRow;

    const actorRole = req.user?.role;
    const actorRank = roleRank(actorRole);
    const isSelf = req.user?.id === current.id;
    const currentTargetRank = roleRank(current.role);

    // Tolak ubah peran diri sendiri
    if (isSelf && parsed.data.role !== undefined && parsed.data.role !== current.role) {
      return reply.status(403).send(fail("Tidak dapat mengubah peran akun sendiri", "FORBIDDEN"));
    }

    // Bila bukan akun sendiri, periksa hak akses actor terhadap target
    if (!isSelf) {
      if (actorRank < 90 && currentTargetRank >= actorRank) {
        return reply.status(403).send(fail("Tidak memiliki izin mengubah pengguna dengan peran setara atau lebih tinggi", "FORBIDDEN"));
      }
      if (currentTargetRank > actorRank) {
        return reply.status(403).send(fail("Tidak memiliki izin mengubah pengguna dengan peran lebih tinggi", "FORBIDDEN"));
      }
    }

    // Bila mengubah peran target, pastikan peran baru tidak melampaui aturan hierarki
    if (parsed.data.role !== undefined && parsed.data.role !== current.role) {
      const nextRoleRank = roleRank(parsed.data.role);
      if (actorRank < 90 && nextRoleRank >= actorRank) {
        return reply.status(403).send(fail("Tidak memiliki izin memberikan peran setara atau lebih tinggi", "FORBIDDEN"));
      }
      if (nextRoleRank > actorRank) {
        return reply.status(403).send(fail("Tidak dapat memberikan peran melebihi peran sendiri", "FORBIDDEN"));
      }
    }

    const deactivating = parsed.data.isActive === false || parsed.data.isActive === 0;
    if (deactivating && req.user?.id === current.id) {
      return reply.status(400).send(fail("Tidak dapat menonaktifkan akun sendiri", "VALIDATION_ERROR"));
    }
    const nextEmployeeId =
      parsed.data.employeeId === undefined
        ? (typeof current.employee_id === "string" ? current.employee_id : null)
        : parsed.data.employeeId === null || parsed.data.employeeId === ""
          ? null
          : parsed.data.employeeId;
    if (nextEmployeeId && !(await assertEmployeeExists(nextEmployeeId))) {
      return reply.status(422).send(fail(`Karyawan ${nextEmployeeId} tidak ada`, "UNPROCESSABLE"));
    }
    const next = {
      name: parsed.data.name ?? current.name,
      role: parsed.data.role ?? current.role,
      email: parsed.data.email ?? current.email,
      isActive:
        parsed.data.isActive === undefined
          ? (current.is_active ?? 1) !== 0
          : parsed.data.isActive === true || parsed.data.isActive === 1,
    };
    const roleChanged = parsed.data.role !== undefined && parsed.data.role !== current.role;
    const activeChanged = parsed.data.isActive !== undefined && ((current.is_active ?? 1) !== 0) !== next.isActive;
    const employeeChanged = nextEmployeeId !== (current.employee_id ?? null);
    await persistUserChange(async () => {
      await exec("UPDATE users SET name = ?, role = ?, email = ?, is_active = ?, employee_id = ? WHERE id = ?", [
        next.name,
        next.role,
        next.email,
        next.isActive ? 1 : 0,
        nextEmployeeId,
        current.id,
      ]);
      if (roleChanged || activeChanged || employeeChanged) {
        await bumpTokenVersion(current.id);
      }
    }, {
      actor: requestActor(req),
      action: "update",
      table: "users",
      rowId: current.id,
      diff: {
        ...(current.name !== next.name ? { name: { before: current.name, after: next.name } } : {}),
        ...(current.role !== next.role ? { role: { before: current.role, after: next.role } } : {}),
        ...(current.email !== next.email ? { email: { before: current.email, after: next.email } } : {}),
        ...((current.is_active ?? 1) !== 0 !== next.isActive
          ? { isActive: { before: (current.is_active ?? 1) !== 0, after: next.isActive } }
          : {}),
      },
      ip: requestIp(req),
    });
    return ok({ id: current.id, username: current.username, employeeId: nextEmployeeId, ...next });
  });

  app.post("/api/users/:id/password", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const targetId = id === "me" ? req.user?.id : id;
    const parsed = PasswordSchema.safeParse(req.body);
    if (!parsed.success || !targetId) {
      return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    }
    const rows = await q<UserRow>(`SELECT ${SELECT_COLS} WHERE id = ?`, [targetId]);
    if (rows.length === 0) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const target = rows[0] as UserRow;
    const self = req.user?.id === target.id;
    const actorRank = roleRank(req.user?.role);
    const targetRank = roleRank(target.role);
    const privileged = isPrivileged(req.user?.role);

    if (!self) {
      if (!privileged) {
        return reply.status(403).send(fail("Butuh peran Direktur / Manager / Developer", "FORBIDDEN"));
      }
      // Reset password user lain: hanya bila rank(actor) > rank(target)
      if (actorRank <= targetRank) {
        return reply.status(403).send(fail("Tidak memiliki izin mereset password pengguna dengan peran setara atau lebih tinggi", "FORBIDDEN"));
      }
    }

    if (self && !privileged) {
      const oldOk =
        typeof parsed.data.oldPassword === "string" &&
        parsed.data.oldPassword.length > 0 &&
        (await comparePassword(parsed.data.oldPassword, target.pass_hash));
      if (!oldOk) return reply.status(401).send(fail("Password lama salah", "UNAUTHORIZED"));
    }
    const newHash = await hashPassword(parsed.data.newPassword);
    /* Reset password orang lain = Inbound break-glass: wajib tercatat,
       termasuk apakah pelakunya pemilik akun itu sendiri. */
    await persistUserChange(async () => {
      await exec("UPDATE users SET pass_hash = ? WHERE id = ?", [newHash, target.id]);
      await bumpTokenVersion(target.id);
    }, {
      actor: requestActor(req),
      action: "password_change",
      table: "users",
      rowId: target.id,
      diff: { username: target.username, self, verifiedOldPassword: self && !privileged },
      ip: requestIp(req),
    });
    return ok({ id: target.id, updated: true });
  });

  // Never hard delete — deactivate instead.
  app.delete("/api/users/:id", { preHandler: manageGuards }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const rows = await q<UserRow>(`SELECT ${SELECT_COLS} WHERE id = ?`, [id]);
    if (rows.length === 0) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const target = rows[0] as UserRow;
    if (req.user?.id === target.id) {
      return reply.status(400).send(fail("Tidak dapat menonaktifkan akun sendiri", "VALIDATION_ERROR"));
    }
    const actorRank = roleRank(req.user?.role);
    const targetRank = roleRank(target.role);
    if (actorRank < 90 && targetRank >= actorRank) {
      return reply.status(403).send(fail("Tidak memiliki izin menonaktifkan pengguna dengan peran setara atau lebih tinggi", "FORBIDDEN"));
    }
    if (targetRank > actorRank) {
      return reply.status(403).send(fail("Tidak memiliki izin menonaktifkan pengguna dengan peran lebih tinggi", "FORBIDDEN"));
    }

    await persistUserChange(async () => {
      await exec("UPDATE users SET is_active = 0 WHERE id = ?", [target.id]);
      await bumpTokenVersion(target.id);
    }, {
      actor: requestActor(req),
      action: "deactivate",
      table: "users",
      rowId: target.id,
      diff: { username: target.username, isActive: false },
      ip: requestIp(req),
    });
    return ok({ id: target.id, isActive: false });
  });
}
