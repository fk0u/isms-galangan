/* Pengaturan akses modul per role oleh akun developer (#287). Default dari
 * notulen 23 Okt (moduleAccess.ts); isian developer disimpan di setting
 * SET-RBAC dan menimpa default per role. Izin DATA tetap dari policy.ts. */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { exec, q } from "../db.js";
import { requireAuth } from "../auth.js";
import { ok, fail } from "../envelope.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { COLLECTION_TO_MODULE, MATRIX, normalizeRole, permissionsFor, requirePermission, ROLES, type Role } from "../policy.js";
import { isProjectManagerTitle } from "../domainGuards.js";
import { cleanOverride, DEFAULT_ACCESS, FIN_TABS, loadOverride, MODULE_KEYS, moduleAccessFor, type AccessLevel, type ModuleKey } from "../moduleAccess.js";

/** Tingkat akses MAKSIMAL yang bisa diberikan tabel modul untuk sebuah peran:
 *  tabel hanya membatasi izin data dasar (policy.ts), tidak menambah. Modul
 *  tanpa koleksi data (dashboard, analytics, notifikasi, ...) dianggap crud. */
export function baseMaxLevels(role: Role): Record<ModuleKey, AccessLevel> {
  const base = MATRIX[role] ?? {};
  const out = {} as Record<ModuleKey, AccessLevel>;
  for (const m of MODULE_KEYS) {
    const cols = Object.entries(COLLECTION_TO_MODULE).filter(([, mod]) => mod === m).map(([c]) => c);
    if (role === "developer" || cols.length === 0) { out[m] = "crud"; continue; }
    const acts = cols.flatMap((c) => base[c] ?? []);
    out[m] = acts.includes("w") || acts.includes("d") ? "crud" : acts.includes("r") ? "view" : "none";
  }
  return out;
}

/** Izin efektif per modul (gabungan izin koleksinya) setelah tabel modul diterapkan. */
async function effectiveFor(role: Role): Promise<{ levels: Record<string, AccessLevel>; modules: Record<string, { r: boolean; w: boolean; d: boolean } | null> }> {
  const access = await moduleAccessFor(role);
  const perms = permissionsFor(role, access);
  const max = baseMaxLevels(role);
  const levels: Record<string, AccessLevel> = {};
  const modules: Record<string, { r: boolean; w: boolean; d: boolean } | null> = {};
  const rank: Record<AccessLevel, number> = { none: 0, view: 1, crud: 2 };
  for (const m of MODULE_KEYS) {
    const lvl = access.levels[m] ?? "crud";
    levels[m] = rank[lvl] <= rank[max[m]] ? lvl : max[m];
    const cols = Object.entries(COLLECTION_TO_MODULE).filter(([, mod]) => mod === m).map(([c]) => c);
    if (cols.length === 0) { modules[m] = null; continue; }
    const acts = role === "developer" ? ["r", "w", "d"] : cols.flatMap((c) => perms[c] ?? []);
    modules[m] = { r: acts.includes("r"), w: acts.includes("w"), d: acts.includes("d") };
  }
  return { levels, modules };
}

export function registerRbacRoutes(app: FastifyInstance): void {
  /* Izin efektif semua peran (sumber tunggal untuk tampilan "Pilih peran"
     dan tabel akses modul - sebelumnya web memakai matriks tertulis sendiri
     yang bisa berbeda dari server). Baca saja: direktur, manager, developer. */
  app.get("/api/rbac/effective", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!["developer", "direktur", "manager"].includes(normalizeRole(req.user?.role))) {
      return reply.status(403).send(fail("Hanya direktur, manager, atau developer", "FORBIDDEN"));
    }
    const roles: Record<string, unknown> = {};
    for (const r of ROLES) roles[r] = await effectiveFor(r);
    return ok({ roles });
  });

  /* Kandidat Project Manager untuk form proyek. Peran yang boleh membuat
     proyek (mis. Commercial) belum tentu boleh membaca data SDM (gaji dsb.),
     jadi endpoint ini hanya mengirim nama & jabatan karyawan aktif berjabatan PM. */
  app.get("/api/project-managers", { preHandler: [requireAuth, requirePermission("projects", "w")] }, async () => {
    const rows = await q<{ id: string; data: string }>("SELECT id, data FROM employees", []);
    const out: { id: string; name: string; role: string; dept: string }[] = [];
    for (const r of rows) {
      try {
        const e = JSON.parse(r.data) as Record<string, unknown>;
        if (!isProjectManagerTitle(e.role) || (String(e.status ?? "") || "Aktif") !== "Aktif") continue;
        out.push({ id: r.id, name: String(e.name ?? ""), role: String(e.role ?? ""), dept: String(e.dept ?? "") });
      } catch { /* baris rusak dilewati */ }
    }
    return ok({ managers: out.sort((a, b) => a.name.localeCompare(b.name)) });
  });

  const devOnly = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (normalizeRole(req.user?.role) !== "developer") {
      await reply.status(403).send(fail("Hanya akun developer yang dapat mengatur hak akses", "FORBIDDEN"));
    }
  };

  app.get("/api/rbac", { preHandler: [requireAuth, devOnly] }, async () => {
    const effective: Record<string, unknown> = {};
    for (const r of ROLES) effective[r] = await moduleAccessFor(r);
    const baseMax: Record<string, unknown> = {};
    for (const r of ROLES) baseMax[r] = baseMaxLevels(r);
    return ok({ roles: ROLES, modules: MODULE_KEYS, finTabs: FIN_TABS, defaults: DEFAULT_ACCESS, override: await loadOverride(), effective, baseMax });
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
