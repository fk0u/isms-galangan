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
import { moduleAccessFor, type ModuleAccess } from "../moduleAccess.js";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { branchOfUser, requireAuth, SEED_ACCOUNTS, signToken } from "../auth.js";
import { normalizeRole, permissionsFor } from "../policy.js";
import { q } from "../db.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { createRateLimiter, getClientIp } from "../rateLimit.js";

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


type DemoIssue =
  | { error: string; status: 403 | 404 | 409 | 503; code: string }
  | { token: string; permissions: ReturnType<typeof permissionsFor>; modules: ModuleAccess; user: { id: string; username: string; name: string; role: string; branch: string; email: string; employeeId: string | null } };

/** Token untuk akun seed sebuah peran. Dipakai "lihat sebagai peran" dan login demo. */
async function issueDemoToken(role: string): Promise<DemoIssue> {
  const account = SEED_ACCOUNTS.find((a) => a.role === role);
  if (!account) return { error: "Peran demo tidak dikenal", status: 404, code: "NOT_FOUND" };
  const rows = await q<UserRow>(
    "SELECT id, username, name, role, email, is_active, employee_id, token_version FROM users WHERE username = ?",
    [account.username],
  );
  const user = rows[0];
  if (!user) return { error: "Akun demo belum dibuat - jalankan seed", status: 404, code: "NOT_FOUND" };
  if ((user.is_active ?? 1) === 0) return { error: "Akun demo dinonaktifkan", status: 403, code: "FORBIDDEN" };
  // Peran di DB harus sama dengan peran yang dipilih (akun seed bisa diubah lewat /api/users).
  if (normalizeRole(user.role) !== normalizeRole(account.role)) {
    return { error: `Akun demo ${account.username} kini berperan ${user.role}, bukan ${account.role}`, status: 409, code: "CONFLICT" };
  }
  let branch: string;
  try {
    branch = await branchOfUser(user);
  } catch {
    return { error: "Scope cabang akun demo tidak dapat diverifikasi", status: 503, code: "BRANCH_SCOPE_UNAVAILABLE" };
  }
  const token = signToken({ id: user.id, username: user.username, role: user.role, branch, v: user.token_version ?? 0 });
  return {
    token,
    permissions: permissionsFor(user.role),
    modules: await moduleAccessFor(user.role),
    user: { id: user.id, username: user.username, name: user.name, role: user.role, branch, email: user.email, employeeId: user.employee_id },
  };
}

/* Login demo dari halaman login (presentasi, permintaan 14 Okt): pilih peran
   tanpa mengetik password. SANGAT TERBUKA - siapa pun yang membuka halaman
   login bisa masuk sebagai peran seed mana pun - jadi butuh saklar ketiga
   DEMO_LOGIN_PAGE=true di atas DEMO_ROLE_SWITCH dan ALLOW_SEED_LOGIN. Hanya
   untuk server demo berisi data sintetis; matikan sebelum data nyata masuk. */
export function demoLoginEnabled(): boolean {
  return demoSwitchEnabled() && flagOn("DEMO_LOGIN_PAGE");
}
const demoLoginLimiter = createRateLimiter(30, 10 * 60_000);

export function registerDemoSwitchRoutes(app: FastifyInstance): void {
  app.get("/api/auth/demo-login", async () => ok({
    enabled: demoLoginEnabled(),
    roles: demoLoginEnabled() ? SEED_ACCOUNTS.map((a) => ({ role: a.role, name: a.name })) : [],
  }));

  app.post("/api/auth/demo-login", async (req, reply) => {
    if (!demoLoginEnabled()) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const lim = demoLoginLimiter(getClientIp(req));
    if (!lim.allowed) {
      reply.header("Retry-After", String(lim.retryAfterSec));
      return reply.status(429).send(fail("Terlalu banyak percobaan, coba lagi nanti", "RATE_LIMITED"));
    }
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const out = await issueDemoToken(parsed.data.role);
    if ("error" in out) return reply.status(out.status).send(fail(out.error, out.code));
    await writeAudit({
      actor: `login-demo:${out.user.username}`, action: "auth.demo_login", table: "users", rowId: out.user.id,
      diff: { role: out.user.role }, ip: requestIp(req),
    }, { required: true });
    return ok(out);
  });

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
    const out = await issueDemoToken(parsed.data.role);
    if ("error" in out) return reply.status(out.status).send(fail(out.error, out.code));
    await writeAudit({
      actor: requestActor(req), action: "auth.demo_switch", table: "users", rowId: out.user.id,
      diff: { to: out.user.username, role: out.user.role }, ip: requestIp(req),
    }, { required: true });
    return ok(out);
  });
}
