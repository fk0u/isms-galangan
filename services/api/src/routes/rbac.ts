/* Pengaturan akses modul per role oleh akun developer (#287). Default dari
 * notulen 23 Okt (moduleAccess.ts); isian developer disimpan di setting
 * SET-RBAC dan menimpa default per role. Izin DATA tetap dari policy.ts. */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { exec, q } from "../db.js";
import { requireAuth } from "../auth.js";
import { ok, fail } from "../envelope.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { normalizeRole, ROLES } from "../policy.js";
import { cleanOverride, DEFAULT_ACCESS, FIN_TABS, loadOverride, MODULE_KEYS, moduleAccessFor } from "../moduleAccess.js";

export function registerRbacRoutes(app: FastifyInstance): void {
  const devOnly = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (normalizeRole(req.user?.role) !== "developer") {
      await reply.status(403).send(fail("Hanya akun developer yang dapat mengatur hak akses", "FORBIDDEN"));
    }
  };

  app.get("/api/rbac", { preHandler: [requireAuth, devOnly] }, async () => {
    const effective: Record<string, unknown> = {};
    for (const r of ROLES) effective[r] = await moduleAccessFor(r);
    return ok({ roles: ROLES, modules: MODULE_KEYS, finTabs: FIN_TABS, defaults: DEFAULT_ACCESS, override: await loadOverride(), effective });
  });

  app.put("/api/rbac", { preHandler: [requireAuth, devOnly] }, async (req, reply) => {
    const body = (req.body ?? {}) as { override?: unknown };
    if (!body.override || typeof body.override !== "object") return reply.status(400).send(fail("override wajib berupa objek", "VALIDATION_ERROR"));
    const override = cleanOverride(body.override);
    const before = await loadOverride();
    const data = { key: "RBAC_MODULES", value: JSON.stringify(override), label: "Akses modul per role (diatur developer)", group: "Sistem" };
    const now = new Date().toISOString();
    const exists = await q("SELECT id FROM settings WHERE id = ?", ["SET-RBAC"]);
    if (exists.length) await exec("UPDATE settings SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(data), now, "SET-RBAC"]);
    else await exec("INSERT INTO settings (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", ["SET-RBAC", "Samarinda", JSON.stringify(data), now]);
    await writeAudit({ actor: requestActor(req), action: "update", table: "settings", rowId: "SET-RBAC", diff: { before, after: override }, ip: requestIp(req) });
    return ok({ override });
  });
}
