import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes, randomUUID } from "node:crypto";
import { loadEnv } from "./env.js";
import { exec, q } from "./db.js";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  /** Cabang user, dari employees.branch lewat users.employee_id.
   *  "SEMUA" = tidak dibatasi. Ada di token supaya route PDF bisa menegakkan
   *  batas tanpa query ulang - dan karena token sudah ditandatangani, klien
   *  tidak bisa memperbesar haknya sendiri dengan mengubah claim. */
  branch: string;
  /** Versi token pengguna untuk mendukung pencabutan (F2-04). */
  v?: number;
  employeeId?: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

function getSecret(): string {
  // Single source of truth: the env module (throws at boot if JWT_SECRET is missing).
  return loadEnv().jwtSecret;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthUser): string {
  return jwt.sign(
    {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      branch: payload.branch,
      v: payload.v ?? 0,
      employeeId: payload.employeeId ?? null,
    },
    getSecret(),
    { expiresIn: "8h" },
  );
}

export function verifyToken(token: string): AuthUser {
  const raw = jwt.verify(token, getSecret()) as Partial<AuthUser>;
  /* Token yang dibuat sebelum claim `branch` ada tidak punya field itu.
     Default "SEMUA" (= tidak dibatasi) dipilih karena itu perilaku lama:
    Versi yang lebih ketat tiba-tiba lewat diam-diam. Batas yang lebih ketat
     harus datang dari perubahan claim, bukan dari nilai yang hilang. */
  return {
    id: String(raw.id ?? ""),
    username: String(raw.username ?? ""),
    role: String(raw.role ?? ""),
    branch: String(raw.branch ?? "SEMUA") || "SEMUA",
    v: typeof raw.v === "number" ? raw.v : 0,
    employeeId: typeof raw.employeeId === "string" ? raw.employeeId : null,
  };
}

/**
 * Cabang yang boleh diakses user. "SEMUA" berarti seluruh cabang.
 *
 * Spasi di kedua sisi dibersihkan tapi HURUF BESAR tetap ketat: spasi di
 * nilai `employees.branch` itu mungkin terjadi dan tidak pernah bermakna,
 * sedangkan perbedaan huruf besar menandakan data yang salah dan harus
 * terlihat - bukan lolos diam-diam.
 */
export function branchAllowed(user: AuthUser | undefined, asked: string): boolean {
  const norm = (v: unknown): string => String(v ?? "").trim();
  const own = norm(user?.branch);
  const want = norm(asked);
  if (own === "" || own === "SEMUA") return true;
  return own === want;
}

export async function branchOfUser(user: { employee_id?: string | null }): Promise<string> {
  const empId = String(user.employee_id ?? "").trim();
  if (empId === "") return "SEMUA";
  try {
    const rows = await q<{ branch: string }>("SELECT branch FROM employees WHERE id = ?", [empId]);
    const b = String(rows[0]?.branch ?? "").trim();
    return b === "" || b === "-" ? "SEMUA" : b;
  } catch {
    return "SEMUA";
  }
}

interface CachedUserRecord {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  tokenVersion: number;
  employeeId: string | null;
  branch: string;
  cachedAt: number;
}

const userCache = new Map<string, CachedUserRecord>();
const CACHE_TTL_MS = 30_000;

export function invalidateUserCache(userId?: string): void {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

export async function bumpTokenVersion(
  userId: string,
  options: { deferCacheInvalidation?: boolean } = {},
): Promise<void> {
  await exec("UPDATE users SET token_version = token_version + 1 WHERE id = ?", [userId]);
  if (!options.deferCacheInvalidation) invalidateUserCache(userId);
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
  }
  const token = header.slice("Bearer ".length);
  let payload: AuthUser;
  try {
    payload = verifyToken(token);
  } catch {
    return reply.status(401).send({ ok: false, error: { message: "Invalid token", code: "UNAUTHORIZED" } });
  }

  const userId = payload.id;
  if (!userId) {
    return reply.status(401).send({ ok: false, error: { message: "Invalid token payload", code: "UNAUTHORIZED" } });
  }

  const now = Date.now();
  let cached = userCache.get(userId);
  if (!cached || now - cached.cachedAt > CACHE_TTL_MS) {
    let rows: Array<{
      id: string;
      username: string;
      role: string;
      is_active: number | null;
      token_version: number | null;
      employee_id: string | null;
    }> = [];
    try {
      rows = await q<{
        id: string;
        username: string;
        role: string;
        is_active: number | null;
        token_version: number | null;
        employee_id: string | null;
      }>("SELECT id, username, role, is_active, token_version, employee_id FROM users WHERE id = ?", [userId]);
    } catch {
      return reply.status(401).send({ ok: false, error: { message: "Authentication failed", code: "UNAUTHORIZED" } });
    }

    if (rows.length === 0) {
      return reply.status(401).send({ ok: false, error: { message: "User not found", code: "UNAUTHORIZED" } });
    }

    const u = rows[0];
    const branch = await branchOfUser({ employee_id: u.employee_id });
    cached = {
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: (u.is_active ?? 1) !== 0,
      tokenVersion: u.token_version ?? 0,
      employeeId: u.employee_id,
      branch,
      cachedAt: now,
    };
    userCache.set(userId, cached);
  }

  if (!cached.isActive) {
    return reply.status(401).send({ ok: false, error: { message: "Account is deactivated", code: "UNAUTHORIZED" } });
  }

  const tokenV = payload.v ?? 0;
  if (cached.tokenVersion !== tokenV) {
    return reply.status(401).send({ ok: false, error: { message: "Token has been revoked", code: "UNAUTHORIZED" } });
  }

  // Peran dan cabang diambil dari DB, bukan token!
  req.user = {
    id: cached.id,
    username: cached.username,
    role: cached.role,
    branch: cached.branch,
    v: cached.tokenVersion,
    employeeId: cached.employeeId,
  };
}

export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) {
      return reply.status(401).send({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    }
    if (!roles.includes(req.user.role)) {
      // Akronim umum jangan dirusak kapitalisasinya (QC/HR/BKI/SDM).
      const ACRONYMS = new Set(["QC", "HR", "HSE", "BKI", "SDM", "IT", "API"]);
      const labels = [...new Set(roles.map((r) => {
        const u = String(r ?? "").toUpperCase();
        if (ACRONYMS.has(u)) return u;
        return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
      }))];
      return reply
        .status(403)
        .send({ ok: false, error: { message: `Butuh peran ${labels.join(" / ")}`, code: "FORBIDDEN" } });
    }
  };
}

export type ExecFn = (sql: string, params: unknown[]) => Promise<unknown>;
export type QueryFn<T = Record<string, unknown>> = (sql: string, params: unknown[]) => Promise<T[]>;

interface SeedAccount {
  username: string;
  name: string;
  role: string;
  email: string;
}

export const SEED_ACCOUNTS: SeedAccount[] = [
  { username: "demo@galangan.com", name: "Client Viewer", role: "viewer", email: "demo@galangan.com" },
  { username: "dev@alk.id", name: "Developer", role: "developer", email: "dev@alk.id" },
  { username: "direktur@galangan.com", name: "Direktur", role: "direktur", email: "direktur@galangan.com" },
  { username: "manager@galangan.com", name: "Manager", role: "manager", email: "manager@galangan.com" },
];

export async function seedUsers(
  dbInsert: ExecFn,
  dbQuery?: QueryFn,
  queryImpl?: (sql: string, params: unknown[]) => Promise<Record<string, unknown>[]>,
): Promise<void> {
  const query = dbQuery ?? queryImpl;
  for (const account of SEED_ACCOUNTS) {
    const envKey = `SEED_PASSWORD_${account.role.toUpperCase()}`;
    const envPass = process.env[envKey]?.trim();
    let accountPass = envPass;
    if (!accountPass) {
      accountPass = randomBytes(12).toString("base64url").slice(0, 16);
      console.log(`[seed] Password akun ${account.username} (${account.role}): ${accountPass}`);
    }

    let existing: Record<string, unknown>[] = [];
    if (query) {
      try {
        existing = await query("SELECT id, name, role, email, is_active FROM users WHERE username = ?", [
          account.username,
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Very old DBs (001 without 002 applied): is_active column missing.
        if (/no such column/i.test(message) || /unknown column/i.test(message)) {
          existing = await query("SELECT id, name, role, email FROM users WHERE username = ?", [account.username]);
        } else {
          throw err;
        }
      }
    }
    if (existing.length > 0) {
      const row = existing[0] as { name?: unknown; role?: unknown; email?: unknown; is_active?: unknown };
      const patch: Record<string, unknown> = {};
      if (typeof row.name === "string" && row.name !== account.name) patch.name = account.name;
      if (typeof row.role === "string" && row.role !== account.role) patch.role = account.role;
      if (typeof row.email === "string" && row.email !== account.email) patch.email = account.email;
      if (envPass) {
        patch.pass_hash = await hashPassword(envPass);
      }
      // Backfill legacy NULLs (column is NOT NULL DEFAULT 1 on fresh DBs,
      // but old rows may carry NULL).
      if (row.is_active === null || row.is_active === undefined) patch.is_active = 1;
      if (Object.keys(patch).length > 0) {
        const sets = Object.keys(patch)
          .map((k) => `${k} = ?`)
          .join(", ");
        const params = [...Object.values(patch), account.username];
        try {
          await dbInsert(`UPDATE users SET ${sets} WHERE username = ?`, params);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (/no such column/i.test(message) || /unknown column/i.test(message)) {
            // Retry without is_active on pre-002 schemas.
            delete patch.is_active;
            if (Object.keys(patch).length > 0) {
              const retrySets = Object.keys(patch)
                .map((k) => `${k} = ?`)
                .join(", ");
              await dbInsert(`UPDATE users SET ${retrySets} WHERE username = ?`, [
                ...Object.values(patch),
                account.username,
              ]);
            }
          } else {
            throw err;
          }
        }
      }
      continue;
    }
    const passHash = await hashPassword(accountPass);
    try {
      await dbInsert(
        "INSERT INTO users (id, username, pass_hash, name, role, email, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [randomUUID(), account.username, passHash, account.name, account.role, account.email],
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("UNIQUE") || message.includes("Duplicate")) continue;
      if (/no such column/i.test(message) || /unknown column/i.test(message)) {
        try {
          await dbInsert("INSERT INTO users (id, username, pass_hash, name, role, email) VALUES (?, ?, ?, ?, ?, ?)", [
            randomUUID(),
            account.username,
            passHash,
            account.name,
            account.role,
            account.email,
          ]);
        } catch (retryErr) {
          const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
          if (retryMsg.includes("UNIQUE") || retryMsg.includes("Duplicate")) continue;
          throw retryErr;
        }
        continue;
      }
      throw err;
    }
  }
}
