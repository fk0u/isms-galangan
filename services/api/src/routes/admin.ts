import { timingSafeEqual } from "node:crypto";
import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { exec, q } from "../db.js";
import { fail, ok } from "../envelope.js";
import { createRateLimiter, getClientIp } from "../rateLimit.js";
import { requestIp, writeAudit } from "../audit.js";
import { buildSeedRows, buildTeamSeeds, buildWbsSeeds, topUpDemoWbsHistory } from "../seedData.js";
import { requireAuth } from "../auth.js";
import { can, normalizeRole } from "../policy.js";
import { createBackup, defaultBackupRootDir, listBackups } from "../backup.js";
import { restoreFromBackup, restoreFromSqliteBuffer } from "../restore.js";
import { generateAllCollectionsCsvZip, generateSqlDump } from "../exportSql.js";
import { COLLECTIONS } from "./crud.js";

const seedLimiter = createRateLimiter(20, 60_000);

function isSetupTokenValid(expected: string | undefined, provided: unknown): boolean {
  if (!expected || typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function requireSuperadmin(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const query = (req.query ?? {}) as { token?: string };
  if (query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${query.token}`;
  }
  await requireAuth(req, reply);
  if (reply.sent) return false;

  const role = normalizeRole(req.user?.role);
  const isSuper = role === "direktur" || role === "developer" || can(role, "settings", "w");
  if (!isSuper) {
    reply.status(403).send(fail("Hanya Direktur atau Superadmin yang berwenang mengelola backup & database", "FORBIDDEN"));
    return false;
  }
  return true;
}

export function registerAdminRoutes(app: FastifyInstance): void {
  // S-08: Admin seed
  app.post("/api/admin/seed", async (req, reply) => {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_SEED !== "true") {
      return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    }
    const check = seedLimiter(getClientIp(req));
    if (!check.allowed) {
      reply.header("Retry-After", String(check.retryAfterSec));
      return reply.status(429).send(fail("Too many requests, try again later", "RATE_LIMITED"));
    }
    const expected = process.env.SETUP_TOKEN;
    const provided = req.headers["x-setup-token"];
    if (!isSetupTokenValid(expected, provided)) {
      await writeAudit({
        actor: "anonymous",
        action: "admin.seed_denied",
        table: "-",
        rowId: "-",
        diff: {},
        ip: requestIp(req),
      });
      return reply.status(403).send(fail("Forbidden", "FORBIDDEN"));
    }
    const query = (req.query ?? {}) as { force?: string | string[] };
    const forceRaw = Array.isArray(query.force) ? query.force[0] : query.force;
    const force = forceRaw === "1" || forceRaw === "true";
    const now = new Date().toISOString();
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];
    const recordError = (context: string, err: unknown): void => {
      const message = err instanceof Error ? err.message : String(err);
      const full = `${context}: ${message}`;
      if (errors.length < 5) errors.push(full);
      console.error("[admin/seed]", full);
    };
    for (const row of buildSeedRows()) {
      try {
        const exists = await q("SELECT id FROM " + row.table + " WHERE id = ?", [row.id]);
        if (exists.length > 0) {
          if (force) {
            await exec(`UPDATE ${row.table} SET branch = ?, data = ?, updated_at = ? WHERE id = ?`, [
              row.branch, JSON.stringify(row.data), now, row.id,
            ]);
            inserted += 1;
          } else {
            skipped += 1;
          }
          continue;
        }
        await exec(`INSERT INTO ${row.table} (id, branch, data, updated_at) VALUES (?, ?, ?, ?)`, [
          row.id, row.branch, JSON.stringify(row.data), now,
        ]);
        inserted += 1;
      } catch (err) {
        skipped += 1;
        recordError(`${row.table}/${row.id}`, err);
      }
    }
    for (const w of buildWbsSeeds()) {
      try {
        const exists = await q<{ project_id: string; data: string }>("SELECT project_id, data FROM wbs_by_project WHERE project_id = ?", [w.projectId]);
        if (exists.length > 0) {
          const next = topUpDemoWbsHistory(w.projectId, exists[0].data);
          if (next) { await exec("UPDATE wbs_by_project SET data = ? WHERE project_id = ? AND data = ?", [next, w.projectId, exists[0].data]); inserted += 1; } else skipped += 1;
          continue;
        }
        await exec("INSERT INTO wbs_by_project (project_id, data) VALUES (?, ?)", [w.projectId, JSON.stringify(w.wbs)]);
        inserted += 1;
      } catch (err) {
        skipped += 1;
        recordError(`wbs_by_project/${w.projectId}`, err);
      }
    }
    for (const t of buildTeamSeeds()) {
      try {
        const exists = await q("SELECT project_id FROM team_by_project WHERE project_id = ?", [t.projectId]);
        if (exists.length > 0) { skipped += 1; continue; }
        await exec("INSERT INTO team_by_project (project_id, data) VALUES (?, ?)", [t.projectId, JSON.stringify(t.memberIds)]);
        inserted += 1;
      } catch (err) {
        skipped += 1;
        recordError(`team_by_project/${t.projectId}`, err);
      }
    }
    await writeAudit({
      actor: "admin-seed",
      action: "admin.seed_success",
      table: "-",
      rowId: "-",
      diff: { inserted, skipped },
      ip: requestIp(req),
    });
    return ok({ inserted, skipped, errors });
  });

  // 1. GET /api/admin/backups — Daftar cadangan tersimpan (retensi 2 terbaru)
  app.get("/api/admin/backups", async (req, reply) => {
    if (!(await requireSuperadmin(req, reply))) return;
    const backups = listBackups();
    return ok({
      backups,
      retentionLimit: 2,
      schedule: "Setiap hari pukul 00:00 (12 malam)",
    });
  });

  // 2. POST /api/admin/backup — Pemicu backup manual seketika (simpan 2 terbaru)
  app.post("/api/admin/backup", async (req, reply) => {
    if (!(await requireSuperadmin(req, reply))) return;
    try {
      const res = await createBackup({ prune: true, keepCount: 2 });
      await writeAudit({
        actor: req.user?.username ?? "superadmin",
        action: "admin.backup_manual",
        table: "database",
        rowId: res.timestamp,
        diff: {
          tablesCount: res.tablesCount,
          sizeBytes: res.sizeBytes,
          deletedBackups: res.deletedBackups,
        },
        ip: requestIp(req),
      });
      return ok({
        message: "Backup berhasil dibuat",
        backup: res,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send(fail(`Gagal membuat backup: ${msg}`, "BACKUP_FAILED"));
    }
  });

  // 3. POST /api/admin/restore — Restore dari salah satu folder backup yang tersimpan
  app.post("/api/admin/restore", async (req, reply) => {
    if (!(await requireSuperadmin(req, reply))) return;
    const body = (req.body ?? {}) as { backupId?: string };
    if (!body.backupId || typeof body.backupId !== "string") {
      return reply.status(400).send(fail("backupId wajib disertakan", "VALIDATION_ERROR"));
    }
    const cleanId = path.basename(body.backupId);
    const targetDir = path.join(defaultBackupRootDir(), cleanId);

    try {
      const res = await restoreFromBackup(targetDir);
      await writeAudit({
        actor: req.user?.username ?? "superadmin",
        action: "admin.restore_from_backup",
        table: "database",
        rowId: cleanId,
        diff: {
          backupId: cleanId,
          tablesCount: res.tablesCount,
          dialect: res.dialect,
          uploadsRestored: res.uploadsRestored,
        },
        ip: requestIp(req),
      });
      return ok({
        message: "Database berhasil dipulihkan",
        restored: res,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send(fail(`Gagal memulihkan database: ${msg}`, "RESTORE_FAILED"));
    }
  });

  // 4. POST /api/admin/restore/upload — Restore dari unggahan file SQLite langsung
  app.post("/api/admin/restore/upload", async (req, reply) => {
    if (!(await requireSuperadmin(req, reply))) return;
    if (typeof req.file !== "function") {
      return reply.status(400).send(fail("Multipart support belum siap", "BAD_REQUEST"));
    }
    const part = await req.file();
    if (!part) {
      return reply.status(400).send(fail("Tidak ada file yang diunggah", "VALIDATION_ERROR"));
    }
    try {
      const buf = await part.toBuffer();
      const res = await restoreFromSqliteBuffer(buf);
      await writeAudit({
        actor: req.user?.username ?? "superadmin",
        action: "admin.restore_from_upload",
        table: "database",
        rowId: part.filename ?? "uploaded.db",
        diff: {
          filename: part.filename,
          sizeBytes: res.sizeBytes,
        },
        ip: requestIp(req),
      });
      return ok({
        message: "Database berhasil dipulihkan dari berkas yang diunggah",
        restored: res,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send(fail(`Gagal memulihkan dari berkas: ${msg}`, "RESTORE_FAILED"));
    }
  });

  // 5. GET /api/admin/export/sql — Unduh seluruh database dalam format SQL DDL+INSERT
  app.get("/api/admin/export/sql", async (req, reply) => {
    if (!(await requireSuperadmin(req, reply))) return;
    try {
      const sql = await generateSqlDump();
      const dateStr = new Date().toISOString().slice(0, 10);
      reply.header("Content-Type", "application/sql; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="isms-database-dump-${dateStr}.sql"`);
      return reply.send(sql);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send(fail(`Gagal menghasilkan export SQL: ${msg}`, "EXPORT_FAILED"));
    }
  });

  // 6. GET /api/admin/export/csv — Unduh seluruh koleksi dalam arsip ZIP berkas-berkas CSV
  app.get("/api/admin/export/csv", async (req, reply) => {
    if (!(await requireSuperadmin(req, reply))) return;
    try {
      const zipBuffer = await generateAllCollectionsCsvZip();
      const dateStr = new Date().toISOString().slice(0, 10);
      reply.header("Content-Type", "application/zip");
      reply.header("Content-Disposition", `attachment; filename="isms-all-collections-csv-${dateStr}.zip"`);
      return reply.send(zipBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send(fail(`Gagal menghasilkan export CSV: ${msg}`, "EXPORT_FAILED"));
    }
  });

  // 7. GET /api/admin/export/all — Seluruh data koleksi terstruktur (JSON) untuk konversi XLSX multi-sheet
  app.get("/api/admin/export/all", async (req, reply) => {
    if (!(await requireSuperadmin(req, reply))) return;
    const collectionsData: Record<string, unknown[]> = {};
    for (const col of COLLECTIONS) {
      try {
        const rows = await q<{ id: string; branch: string; data: string | object; updated_at: string }>(
          `SELECT id, branch, data, updated_at FROM ${col}`
        );
        collectionsData[col] = rows.map((r) => {
          let parsed: Record<string, unknown> = {};
          try {
            parsed = typeof r.data === "string" ? JSON.parse(r.data) : (r.data as Record<string, unknown>);
          } catch {
            parsed = {};
          }
          return { id: r.id, branch: r.branch, updated_at: r.updated_at, ...parsed };
        });
      } catch {
        collectionsData[col] = [];
      }
    }
    return ok({
      collections: collectionsData,
      exportedAt: new Date().toISOString(),
    });
  });
}
