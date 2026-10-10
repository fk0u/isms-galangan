/* "Lihat sebagai peran" untuk presentasi (demo RBAC).
 *
 * Direktur/developer yang SUDAH login bisa berpindah ke akun seed peran lain
 * tanpa mengetik password, supaya klien melihat langsung apa yang boleh
 * dilihat/dikerjakan tiap peran (sidebar, tombol, dan 403 server).
 *
 * Pengaman:
 *   - mati kecuali DEMO_ROLE_SWITCH=true DAN ALLOW_SEED_LOGIN=true (env server);
 *   - hanya ke akun seed (SEED_ACCOUNTS), bukan akun nyata;
 *   - hanya pemanggil berperan direktur/developer (dibaca dari DB, bukan klaim token);
 *   - setiap perpindahan tercatat di audit_log (auth.demo_switch).
 * Kembali ke akun asal dilakukan klien dengan token asal yang disimpan di sesi. */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { branchOfUser, requireAuth, SEED_ACCOUNTS, signToken } from "../auth.js";
import { normalizeRole, permissionsFor } from "../policy.js";
import { q } from "../db.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";

const PRIVILEGED = new Set(["direktur", "developer"]);
const BodySchema = z.object({ role: z.string().min(1).max(32) });

function flagOn(name: string): boolean {
  const raw = (process.env[name] ?? "").toLowerCase().trim();
  return raw === "true" || raw === "1";
}
export function demoSwitchEnabled(): boolean {
  return flagOn("DEMO_ROLE_SWITCH") && flagOn("ALLOW_SEED_LOGIN");
}

interface UserRow {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string;
  is_active: number | null;
  employee_id: string | null;
  token_version: number | null;
}

export function registerDemoSwitchRoutes(app: FastifyInstance): void {
  // Daftar peran yang bisa dipilih — kosong bila fitur mati atau pemanggil bukan direktur/developer.
  app.get("/api/auth/demo-switch", { preHandler: [requireAuth] }, async (req) => {
    const allowed = demoSwitchEnabled() && PRIVILEGED.has(normalizeRole(req.user?.role));
    return ok({
      enabled: allowed,
      roles: allowed ? SEED_ACCOUNTS.map((a) => ({ role: a.role, name: a.name, username: a.username })) : [],
    });
  });

  app.post("/api/auth/demo-switch", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!demoSwitchEnabled()) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    if (!PRIVILEGED.has(normalizeRole(req.user?.role))) {
      return reply.status(403).send(fail("Hanya direktur/developer yang bisa berpindah peran demo", "FORBIDDEN"));
    }
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const account = SEED_ACCOUNTS.find((a) => a.role === parsed.data.role);
    if (!account) return reply.status(404).send(fail("Peran demo tidak dikenal", "NOT_FOUND"));
    const rows = await q<UserRow>(
      "SELECT id, username, name, role, email, is_active, employee_id, token_version FROM users WHERE username = ?",
      [account.username],
    );
    const user = rows[0];
    if (!user) return reply.status(404).send(fail("Akun demo belum dibuat — jalankan seed", "NOT_FOUND"));
    if ((user.is_active ?? 1) === 0) return reply.status(403).send(fail("Akun demo dinonaktifkan", "FORBIDDEN"));
    // Peran di DB harus sama dengan peran yang dipilih (akun seed bisa diubah lewat /api/users).
    if (normalizeRole(user.role) !== normalizeRole(account.role)) {
      return reply.status(409).send(fail(`Akun demo ${account.username} kini berperan ${user.role}, bukan ${account.role}`, "CONFLICT"));
    }

    const branch = await branchOfUser(user);
    const token = signToken({ id: user.id, username: user.username, role: user.role, branch, v: user.token_version ?? 0 });
    await writeAudit({
      actor: requestActor(req), action: "auth.demo_switch", table: "users", rowId: user.id,
      diff: { to: user.username, role: user.role }, ip: requestIp(req),
    }, { required: true });
    return ok({
      token,
      permissions: permissionsFor(user.role),
      user: { id: user.id, username: user.username, name: user.name, role: user.role, branch, email: user.email, employeeId: user.employee_id },
    });
  });
}
