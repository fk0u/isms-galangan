/* F3-L-08 (ADR-0017): data absensi dari alat (fingerprint/face) + impor CSV.
 *
 * Format generik {employeeNo, timestamp, type} - merk alat belum diputuskan
 * (Q14), jadi adaptor merk nanti cukup menerjemahkan ke bentuk ini.
 * Alat memakai API key per perangkat (header x-device-key); yang disimpan
 * hanya hash SHA-256-nya. Impor CSV memakai login biasa (izin tulis absensi). */
import type { FastifyInstance } from "fastify";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { exec, q, withTx } from "../db.js";
import { fail, ok } from "../envelope.js";
import { can } from "../policy.js";
import { createRateLimiter, getClientIp } from "../rateLimit.js";

const WITA_OFFSET_MS = 8 * 3600_000;
const ingestLimiter = createRateLimiter(120, 60_000);

const Punch = z.object({
  employeeNo: z.string().trim().min(1).max(64),
  /** ISO 8601 dengan zona (mis. 2026-10-12T07:58:00+08:00). */
  timestamp: z.string().min(10).max(40),
  type: z.enum(["in", "out"]),
});
const Batch = z.object({ deviceId: z.string().trim().min(1).max(64).optional(), punches: z.array(Punch).min(1).max(500) });
const DeviceSchema = z.object({ deviceId: z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/) });

const sha = (s: string): string => createHash("sha256").update(s).digest("hex");

/** Tanggal & jam WITA dari timestamp; null bila tidak terbaca. Murni. */
export function witaParts(timestamp: string): { date: string; time: string } | null {
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return null;
  const iso = new Date(t + WITA_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** Gabungkan tap ke baris harian: masuk = tap "in" paling awal, pulang = tap "out" paling akhir. Murni. */
export function mergePunch(row: { checkIn?: string; checkOut?: string }, type: "in" | "out", time: string): { checkIn: string; checkOut: string } {
  const checkIn = String(row.checkIn ?? "");
  const checkOut = String(row.checkOut ?? "");
  if (type === "in") return { checkIn: checkIn === "" || time < checkIn ? time : checkIn, checkOut };
  return { checkIn, checkOut: checkOut === "" || time > checkOut ? time : checkOut };
}

export interface IngestResult { accepted: number; unknown: string[]; invalid: number }

export async function applyPunches(punches: z.infer<typeof Punch>[], source: string): Promise<IngestResult> {
  return withTx(async () => {
    const emps = await q<{ id: string; branch: string; data: string }>("SELECT id, branch, data FROM employees", []);
    const byNik = new Map<string, { id: string; branch: string }>();
    for (const e of emps) {
      try {
        const nik = String((JSON.parse(e.data) as Record<string, unknown>).username ?? "").trim();
        if (nik) byNik.set(nik, { id: e.id, branch: e.branch });
      } catch { /* baris rusak dilewati */ }
    }
    // ponytail: memuat seluruh absensi tiap batch; beri indeks (employeeId, date) bila tabel membesar.
    const rows = await q<{ id: string; data: string }>("SELECT id, data FROM attendance", []);
    const byDay = new Map<string, { id: string; data: Record<string, unknown> }>();
    for (const r of rows) {
      try {
        const d = JSON.parse(r.data) as Record<string, unknown>;
        byDay.set(`${String(d.employeeId)}|${String(d.date)}`, { id: r.id, data: d });
      } catch { /* dilewati */ }
    }
    const out: IngestResult = { accepted: 0, unknown: [], invalid: 0 };
    const now = new Date().toISOString();
    for (const p of punches) {
      const emp = byNik.get(p.employeeNo);
      if (!emp) { if (!out.unknown.includes(p.employeeNo)) out.unknown.push(p.employeeNo); continue; }
      const at = witaParts(p.timestamp);
      if (!at) { out.invalid += 1; continue; }
      const key = `${emp.id}|${at.date}`;
      const existing = byDay.get(key);
      if (existing) {
        const data = { ...existing.data, ...mergePunch(existing.data, p.type, at.time), status: "Hadir", source };
        await exec("UPDATE attendance SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(data), now, existing.id]);
        existing.data = data;
      } else {
        const id = `ABS-${at.date.replace(/-/g, "")}-D${randomBytes(3).toString("hex").toUpperCase()}`;
        const data: Record<string, unknown> = { employeeId: emp.id, date: at.date, shift: "Pagi", status: "Hadir", overtime: 0, source, ...mergePunch({}, p.type, at.time) };
        await exec("INSERT INTO attendance (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, emp.branch, JSON.stringify(data), now]);
        byDay.set(key, { id, data });
      }
      out.accepted += 1;
    }
    return out;
  });
}

export function registerAttendanceIngestRoutes(app: FastifyInstance): void {
  const isHr = (role: string | undefined): boolean => can(role, "attendance", "w") && can(role, "employees", "w");

  /* HR: daftarkan alat → API key ditampilkan SEKALI; mendaftar ulang mengganti key. */
  app.post("/api/attendance/devices", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mendaftarkan alat absensi", "FORBIDDEN"));
    const parsed = DeviceSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("deviceId hanya huruf, angka, - dan _ (maks 64)", "VALIDATION_ERROR"));
    const apiKey = randomBytes(32).toString("hex");
    const key = `device:${parsed.data.deviceId}`;
    const now = new Date().toISOString();
    const res = await exec("UPDATE access_secrets SET value = ?, updated_at = ? WHERE access_key = ?", [sha(apiKey), now, key]);
    if (res.changes === 0) await exec("INSERT INTO access_secrets (access_key, value, updated_at) VALUES (?, ?, ?)", [key, sha(apiKey), now]);
    await writeAudit({ actor: requestActor(req), action: "attendance_device_register", table: "attendance", rowId: parsed.data.deviceId, diff: {}, ip: requestIp(req) });
    return ok({ deviceId: parsed.data.deviceId, apiKey });
  });

  /* ALAT: kirim tap. Auth = x-device-key milik deviceId di body. */
  app.post("/api/attendance/ingest", async (req, reply) => {
    const lim = ingestLimiter(getClientIp(req));
    if (!lim.allowed) { reply.header("Retry-After", String(lim.retryAfterSec)); return reply.status(429).send(fail("Too many requests", "RATE_LIMITED")); }
    const parsed = Batch.safeParse(req.body);
    const provided = String(req.headers["x-device-key"] ?? "");
    if (!parsed.success || !parsed.data.deviceId) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const rows = await q<{ value: string }>("SELECT value FROM access_secrets WHERE access_key = ?", [`device:${parsed.data.deviceId}`]);
    const expected = Buffer.from(rows[0]?.value ?? sha("-"));
    const got = Buffer.from(sha(provided));
    if (rows.length === 0 || provided === "" || !timingSafeEqual(expected, got)) return reply.status(401).send(fail("Device key tidak valid", "UNAUTHORIZED"));
    const result = await applyPunches(parsed.data.punches, `device:${parsed.data.deviceId}`);
    await writeAudit({ actor: `device:${parsed.data.deviceId}`, action: "attendance_ingest", table: "attendance", rowId: "-", diff: { accepted: result.accepted, unknown: result.unknown.length, invalid: result.invalid }, ip: requestIp(req) });
    return ok(result);
  });

  /* HR: impor CSV (fallback bila alat belum tersambung) - isi sama, auth login biasa. */
  app.post("/api/attendance/import", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "attendance", "w")) return reply.status(403).send(fail("Peran ini tidak boleh mengimpor absensi", "FORBIDDEN"));
    const parsed = Batch.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const result = await applyPunches(parsed.data.punches, "csv");
    await writeAudit({ actor: requestActor(req), action: "attendance_import", table: "attendance", rowId: "-", diff: { accepted: result.accepted, unknown: result.unknown.length, invalid: result.invalid }, ip: requestIp(req) });
    return ok(result);
  });
}
