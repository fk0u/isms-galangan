/* Pasangan GET untuk endpoint yang sebelumnya hanya bisa ditulis (POST),
 * supaya setiap data yang masuk lewat API bisa dibaca kembali lewat API:
 *   POST /api/files                          → GET /api/files
 *   PUT  /api/projects/:id/wbs (foto)        → GET /api/projects/:id/wbs/photos
 *   POST /api/projects/:id/material-requests → GET /api/projects/:id/material-requests
 *   POST /api/attendance/devices             → GET /api/attendance/devices
 *   POST /api/employees/:id/leave-pin        → GET /api/employees/:id/leave-pin
 * Rahasia (API key alat, PIN) tidak pernah dikembalikan - hanya statusnya. */
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth.js";
import { q } from "../db.js";
import { fail, ok } from "../envelope.js";
import { can } from "../policy.js";
import { scopedProjectIds } from "../teamScope.js";
import { isPrivateFile } from "./files.js";

export interface WbsPhotoRow { task: string; url: string; note: string; date: string; by: string; source: "foto" | "riwayat" }

/** Semua foto pada WBS satu proyek: galeri per pekerjaan + foto di riwayat update. Murni. */
export function collectWbsPhotos(wbs: unknown): WbsPhotoRow[] {
  if (!Array.isArray(wbs)) return [];
  const out: WbsPhotoRow[] = [];
  const seen = new Set<string>();
  const push = (row: WbsPhotoRow): void => {
    const key = `${row.task}|${row.url}`;
    if (row.url === "" || seen.has(key)) return;
    seen.add(key);
    out.push(row);
  };
  for (const raw of wbs) {
    if (!raw || typeof raw !== "object") continue;
    const w = raw as Record<string, unknown>;
    const task = String(w.task ?? "");
    for (const p of Array.isArray(w.photos) ? w.photos : []) {
      if (typeof p === "string") push({ task, url: p, note: "", date: "", by: "", source: "foto" });
      else if (p && typeof p === "object") {
        const o = p as Record<string, unknown>;
        push({ task, url: String(o.url ?? ""), note: String(o.note ?? ""), date: String(o.date ?? ""), by: "", source: "foto" });
      }
    }
    if (typeof w.photoUrl === "string" && w.photoUrl !== "") push({ task, url: w.photoUrl, note: String(w.photoNote ?? ""), date: "", by: "", source: "foto" });
    for (const h of Array.isArray(w.history) ? w.history : []) {
      if (!h || typeof h !== "object") continue;
      const o = h as Record<string, unknown>;
      for (const u of Array.isArray(o.photos) ? o.photos : []) {
        push({ task, url: String(u ?? ""), note: String(o.note ?? ""), date: String(o.date ?? ""), by: String(o.actor ?? o.by ?? ""), source: "riwayat" });
      }
    }
  }
  return out;
}

export function registerReadModelRoutes(app: FastifyInstance): void {
  /** 404 bila proyek di luar lingkup tim peran lapangan (sama dengan /api/projects/:id). */
  const projectVisible = async (user: { role?: string; employeeId?: string | null } | undefined, id: string): Promise<boolean> => {
    const scope = await scopedProjectIds(user);
    return scope === null || scope.has(id);
  };

  app.get("/api/projects/:id/wbs/photos", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "projects", "r")) return reply.status(403).send(fail("Forbidden", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    if (!(await projectVisible(req.user, id))) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const rows = await q<{ data: string }>("SELECT data FROM wbs_by_project WHERE project_id = ?", [id]);
    let wbs: unknown = [];
    try { wbs = JSON.parse(rows[0]?.data ?? "[]"); } catch { /* WBS rusak = tanpa foto */ }
    const photos = collectWbsPhotos(wbs);
    return ok({ projectId: id, total: photos.length, photos });
  });

  app.get("/api/projects/:id/material-requests", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "materialRequests", "r")) return reply.status(403).send(fail("Forbidden", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    if (!(await projectVisible(req.user, id))) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const rows = await q<{ id: string; branch: string; data: string; updated_at: string }>("SELECT id, branch, data, updated_at FROM materialRequests ORDER BY updated_at DESC", []);
    const out = rows.flatMap((r) => {
      try {
        const d = JSON.parse(r.data) as Record<string, unknown>;
        return String(d.projectId ?? "") === id ? [{ id: r.id, branch: r.branch, data: d, updated_at: r.updated_at }] : [];
      } catch { return []; }
    });
    return ok({ projectId: id, total: out.length, rows: out });
  });

  app.get("/api/attendance/devices", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "attendance", "w") || !can(req.user?.role, "employees", "w")) return reply.status(403).send(fail("Hanya HR yang boleh melihat alat absensi", "FORBIDDEN"));
    const rows = await q<{ access_key: string; updated_at: string }>("SELECT access_key, updated_at FROM access_secrets WHERE access_key LIKE 'device:%' ORDER BY access_key", []);
    return ok({ devices: rows.map((r) => ({ deviceId: r.access_key.slice("device:".length), registeredAt: r.updated_at })) });
  });

  app.get("/api/employees/:id/leave-pin", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "employees", "w")) return reply.status(403).send(fail("Forbidden", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    const rows = await q<{ updated_at: string }>("SELECT updated_at FROM access_secrets WHERE access_key = ?", [`pin:${id}`]);
    return ok({ id, pinSet: rows.length > 0, updatedAt: rows[0]?.updated_at ?? null });
  });

  /* Daftar unggahan dari jejak audit (sumber kebenaran siapa mengunggah apa).
     Berkas pribadi karyawan hanya ikut untuk peran yang boleh membukanya. */
  app.get("/api/files", { preHandler: [requireAuth] }, async (req) => {
    const limit = Math.min(500, Math.max(1, Number((req.query as { limit?: string }).limit ?? 100) || 100));
    const rows = await q<{ actor: string; row_id: string; diff: string; created_at: string }>(
      "SELECT actor, row_id, diff, created_at FROM audit_log WHERE action = 'upload' AND table_name = 'files' ORDER BY created_at DESC LIMIT ?", [limit],
    );
    const hr = can(req.user?.role, "employees", "w");
    const files = [];
    for (const r of rows) {
      if (!hr && (await isPrivateFile(r.row_id))) continue;
      let meta: Record<string, unknown> = {};
      try { meta = JSON.parse(r.diff) as Record<string, unknown>; } catch { /* metadata hilang */ }
      files.push({ url: r.row_id, name: String(meta.name ?? ""), size: Number(meta.size ?? 0), extension: String(meta.extension ?? ""), uploadedBy: r.actor, uploadedAt: r.created_at });
    }
    return ok({ total: files.length, files });
  });
}
