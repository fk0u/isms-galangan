import { scopedProjectIds } from "../teamScope.js";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { requirePermission } from "../policy.js";
import { exec, getDialect, q, withTx } from "../db.js";
import { fail, ok } from "../envelope.js";
import { exactBranchPredicate } from "./crudSearch.js";

const WbsSchema = z.object({ wbs: z.array(z.unknown()), baseData: z.unknown().optional() });
const TeamSchema = z.object({
  memberIds: z.array(z.string().min(1)).max(500),
  baseData: z.unknown().optional(),
});

interface SideRow {
  project_id: string;
  data: string;
}

interface SideWriteOutcome {
  projectMissing: boolean;
  projectForbidden: boolean;
  conflict: SideRow | null;
}

interface ProjectScopeUser {
  role?: string;
  employeeId?: string | null;
  branch?: string;
}

async function projectScopeFor(user: ProjectScopeUser | undefined): Promise<Set<string> | null> {
  const teamScope = await scopedProjectIds(user);
  const branch = String(user?.branch ?? "").trim();
  if (branch === "" || branch === "SEMUA") return teamScope;
  const rows = await q<{ id: string }>(
    `SELECT id FROM projects WHERE ${exactBranchPredicate(getDialect())}`,
    [branch],
  );
  const branchScope = new Set(rows.map((row) => row.id));
  return teamScope === null
    ? branchScope
    : new Set([...teamScope].filter((projectId) => branchScope.has(projectId)));
}

function projectInScope(projectId: string, scope: Set<string> | null): boolean {
  return scope === null || scope.has(projectId);
}

/**
 * Compare-and-swap tanpa kolom `updated_at`.
 *
 * Tabel `wbs_by_project` / `team_by_project` hanya punya `project_id` + `data`,
 * jadi `ON DUPLICATE KEY UPDATE data = VALUES(data)` adalah penimpaan buta:
 * dua perangkat yang sama-sama menyimpan WBS akan saling menimpa, dan yang
 * kalah hilang tanpa satu pun jejak. Tidak ada error, tidak ada 409.
 *
 * Menambah kolom `updated_at` berarti migrasi produksi, sementara tabel ini
 * menyimpan blob kecil. Jadi klien mengirim `baseData` - isi yang ia yakini
 * masih ada di server - dan server menolak dengan 409 STALE kalau isinya sudah
 * berbeda. Baris yang tidak ada diperlakukan sebagai snapshot server `[]`,
 * sehingga penghapusan baris sejak fetch juga menghasilkan 409 untuk baseline
 * non-kosong. Ini persis pola `baseUpdatedAt` yang sudah dipakai tabel utama,
 * jadi klien sudah punya jalur penanganan 409 STALE.
 *
 * `baseData` yang tidak dikirim berarti "menimpa buta" - dipakai klien lama
 * yang belum tahu soal fitur ini, dan tidak boleh dibalas 409 demi
 * backwards compatibility.
 */
async function upsert(table: string, projectId: string, payload: unknown): Promise<void> {
  const json = JSON.stringify(payload);
  if (getDialect() === "mysql") {
    await exec(
      `INSERT INTO ${table} (project_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)`,
      [projectId, json],
    );
    return;
  }
  await exec(
    `INSERT INTO ${table} (project_id, data) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET data = excluded.data`,
    [projectId, json],
  );
}

export function registerWbsRoutes(app: FastifyInstance): void {
  app.get("/api/projects/:id/wbs", { preHandler: [requireAuth, requirePermission("projects", "r")] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!projectInScope(id, await projectScopeFor(req.user))) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const rows = await q<SideRow>("SELECT project_id, data FROM wbs_by_project WHERE project_id = ?", [id]);
    const wbs = rows.length > 0 ? (JSON.parse((rows[0] as SideRow).data) as unknown) : [];
    return ok({ projectId: id, wbs });
  });

  app.put("/api/projects/:id/wbs", { preHandler: [requireAuth, requirePermission("wbs_by_project", "w")] }, async (req, reply) => {
    const parsed = WbsSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    if (!projectInScope(id, await projectScopeFor(req.user))) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const lockClause = getDialect() === "mysql" ? " FOR UPDATE" : "";
    const outcome = await withTx<SideWriteOutcome>(async () => {
      // Lock parent row first so writers serialize even before the side row exists.
      const projects = await q<{ id: string }>(`SELECT id FROM projects WHERE id = ?${lockClause}`, [id]);
      if (projects.length === 0) return { projectMissing: true, projectForbidden: false, conflict: null };
      if (!projectInScope(id, await projectScopeFor(req.user))) {
        return { projectMissing: false, projectForbidden: true, conflict: null };
      }
      const beforeRows = await q<SideRow>(`SELECT project_id, data FROM wbs_by_project WHERE project_id = ?${lockClause}`, [id]);
      const current = beforeRows[0] as SideRow | undefined;
      const serverData = current?.data ?? "[]";
      if (parsed.data.baseData !== undefined && JSON.stringify(parsed.data.baseData) !== serverData) {
        return { projectMissing: false, projectForbidden: false, conflict: current ?? { project_id: id, data: serverData } };
      }
      const before = current ? JSON.parse(current.data) as unknown : null;
      await upsert("wbs_by_project", id, parsed.data.wbs);
      await writeAudit({
        actor: requestActor(req),
        action: before === null ? "create" : "update",
        table: "wbs_by_project",
        rowId: id,
        diff: { before, after: parsed.data.wbs },
        ip: requestIp(req),
      }, { required: true });
      return { projectMissing: false, projectForbidden: false, conflict: null };
    });
    if (outcome.projectForbidden) {
      return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    }
    if (outcome.projectMissing) {
      return reply.status(422).send(fail(`Proyek ${id} tidak ada`, "UNPROCESSABLE"));
    }
    if (outcome.conflict !== null) {
      return reply.status(409).send({
        ok: false,
        error: { message: `WBS ${id} sudah diubah perangkat lain`, code: "STALE" },
        data: { projectId: id, wbs: JSON.parse(outcome.conflict.data) as unknown },
      });
    }
    return ok({ projectId: id, wbs: parsed.data.wbs });
  });

  /* Tarik WBS terarah dalam satu request, tanpa team kecuali diminta pemanggil. */
  app.get("/api/project-sides", { preHandler: [requireAuth, requirePermission("projects", "r")] }, async (req, reply) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const rawIds = String(query.projects ?? "").trim();
    const requestedIds = rawIds === "" ? null : [...new Set(rawIds.split(",").map((id) => id.trim()).filter(Boolean))];
    if (requestedIds && requestedIds.length > 500) {
      return reply.status(400).send(fail("At most 500 project IDs may be requested", "VALIDATION_ERROR"));
    }
    const scope = await projectScopeFor(req.user);
    const permittedIds = requestedIds?.filter((id) => projectInScope(id, scope));
    const pick = async (tbl: string): Promise<Record<string, unknown>> => {
      let rows: SideRow[];
      if (requestedIds) {
        if (!permittedIds?.length) return {};
        rows = await q<SideRow>(
          `SELECT project_id, data FROM ${tbl} WHERE project_id IN (${permittedIds.map(() => "?").join(",")})`,
          permittedIds,
        );
      } else {
        rows = await q<SideRow>(`SELECT project_id, data FROM ${tbl}`, []);
      }
      const out: Record<string, unknown> = {};
      for (const row of rows) {
        if (!projectInScope(row.project_id, scope)) continue;
        try { out[row.project_id] = JSON.parse(row.data) as unknown; } catch { /* baris rusak dilewati */ }
      }
      return out;
    };
    const includeTeam = String(query.includeTeam ?? "true").toLowerCase() !== "false";
    return ok({ wbs: await pick("wbs_by_project"), ...(includeTeam ? { team: await pick("team_by_project") } : {}) });
  });

  app.get("/api/projects/:id/team", { preHandler: [requireAuth, requirePermission("projects", "r")] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!projectInScope(id, await projectScopeFor(req.user))) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const rows = await q<SideRow>("SELECT project_id, data FROM team_by_project WHERE project_id = ?", [id]);
    const memberIds = rows.length > 0 ? (JSON.parse((rows[0] as SideRow).data) as unknown) : [];
    return ok({ projectId: id, memberIds });
  });

  app.put("/api/projects/:id/team", { preHandler: [requireAuth, requirePermission("team_by_project", "w")] }, async (req, reply) => {
    const parsed = TeamSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    if (!projectInScope(id, await projectScopeFor(req.user))) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    for (const memberId of parsed.data.memberIds) {
      const rows = await q("SELECT id FROM employees WHERE id = ?", [memberId]);
      if (rows.length === 0) {
        return reply.status(422).send(fail(`Karyawan ${memberId} tidak ada`, "UNPROCESSABLE"));
      }
    }
    const lockClause = getDialect() === "mysql" ? " FOR UPDATE" : "";
    const outcome = await withTx<SideWriteOutcome>(async () => {
      // Lock parent row first so writers serialize even before the side row exists.
      const projects = await q<{ id: string }>(`SELECT id FROM projects WHERE id = ?${lockClause}`, [id]);
      if (projects.length === 0) return { projectMissing: true, projectForbidden: false, conflict: null };
      if (!projectInScope(id, await projectScopeFor(req.user))) {
        return { projectMissing: false, projectForbidden: true, conflict: null };
      }
      const beforeRows = await q<SideRow>(`SELECT project_id, data FROM team_by_project WHERE project_id = ?${lockClause}`, [id]);
      const current = beforeRows[0] as SideRow | undefined;
      const serverData = current?.data ?? "[]";
      if (parsed.data.baseData !== undefined && JSON.stringify(parsed.data.baseData) !== serverData) {
        return { projectMissing: false, projectForbidden: false, conflict: current ?? { project_id: id, data: serverData } };
      }
      const before = current ? JSON.parse(current.data) as unknown : null;
      await upsert("team_by_project", id, parsed.data.memberIds);
      await writeAudit({
        actor: requestActor(req),
        action: before === null ? "create" : "update",
        table: "team_by_project",
        rowId: id,
        diff: { before, after: parsed.data.memberIds },
        ip: requestIp(req),
      }, { required: true });
      return { projectMissing: false, projectForbidden: false, conflict: null };
    });
    if (outcome.projectForbidden) {
      return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    }
    if (outcome.projectMissing) {
      return reply.status(422).send(fail(`Proyek ${id} tidak ada`, "UNPROCESSABLE"));
    }
    if (outcome.conflict !== null) {
      return reply.status(409).send({
        ok: false,
        error: { message: `Tim proyek ${id} sudah diubah perangkat lain`, code: "STALE" },
        data: { projectId: id, memberIds: JSON.parse(outcome.conflict.data) as unknown },
      });
    }
    return ok({ projectId: id, memberIds: parsed.data.memberIds });
  });
}
