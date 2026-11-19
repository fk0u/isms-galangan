/* ADR-0025: halaman "Mesin" di Absensi.
 *   GET    /api/attendance/device-users              status mesin + user mesin + saran karyawan
 *   POST   /api/attendance/device-users/link         hubungkan / lepas ID mesin ↔ karyawan
 *   GET    /api/attendance/devices/:id/commands      riwayat perintah ke mesin
 *   POST   /api/attendance/devices/:id/commands      antrekan perintah (mentah: developer/direktur)
 *   DELETE /api/attendance/devices/:id/commands/:cmd batalkan perintah yang belum terkirim
 *   POST   /api/attendance/devices/:id/actions       aksi HR: status, sinkron jam, restart,
 *                                                    muat user, daftarkan karyawan, hapus user
 * HR = boleh tulis absensi DAN karyawan (sama dengan pendaftaran alat). */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { q } from "../db.js";
import { fail, ok } from "../envelope.js";
import { can, normalizeRole } from "../policy.js";
import { analyzeDay, foldOvernight, type DayAnalysis } from "../attendanceAnalysis.js";
import { tapsOf } from "./attendanceIngest.js";
import {
  cancelCommand, connectionStats, hoursFor, loadWorkHours, saveWorkHours, deviceBeats, enqueueCommand, enqueueHrAction, linkDevicePin, listCommands, loadEmployees, nameScore, pendingPunches, reprocessPending,
  type HrAction,
} from "../attendanceDevices.js";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const LinkSchema = z.object({ userId: z.string().trim().regex(ID_RE), employeeId: z.string().trim().min(1).max(128).nullable() });
const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("sync_time") }),
  z.object({ action: z.literal("restart") }),
  z.object({ action: z.literal("pull_users") }),
  z.object({ action: z.literal("settings") }),
  z.object({ action: z.literal("pull_logs"), from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ action: z.literal("push_employee"), employeeId: z.string().trim().min(1).max(128), userId: z.string().trim().regex(/^\d{1,9}$/).optional() }),
  z.object({ action: z.literal("remove_user"), userId: z.string().trim().regex(ID_RE) }),
]);
const LogQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deviceId: z.string().regex(ID_RE).optional(),
  status: z.enum(["accepted", "reprocessed", "pending", "invalid"]).optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).max(100_000).optional(),
});
export type LogStatus = "accepted" | "reprocessed" | "pending" | "invalid";
/** Tanggal WITA (YYYY-MM-DD) → batas ISO UTC jam 00:00 WITA. Murni. */
const witaDayStartIso = (d: string): string => new Date(Date.parse(`${d}T00:00:00+08:00`)).toISOString();
const todayWita = (): string => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
const addDays = (d: string, n: number): string => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** "20261116075800" → "2026-11-16T07:58:00+08:00". Murni. */
const ioIso = (t: string): string | null => {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(t);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+08:00` : null;
};

const CmdSchema = z.object({
  cmd: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,39}$/),
  param: z.record(z.unknown()).nullable().optional(),
});

async function registeredDevices(): Promise<string[]> {
  const rows = await q<{ access_key: string }>("SELECT access_key FROM access_secrets WHERE access_key LIKE 'device:%'", []);
  return rows.map((r) => r.access_key.slice("device:".length)).sort();
}

export function registerAttendanceDeviceRoutes(app: FastifyInstance): void {
  const isHr = (role: string | undefined): boolean => can(role, "attendance", "w") && can(role, "employees", "w");
  const isRaw = (role: string | undefined): boolean => ["developer", "direktur"].includes(normalizeRole(role));

  app.get("/api/attendance/device-users", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const [devices, status, users, emps, pending] = await Promise.all([
      registeredDevices(),
      q<{ device_id: string; last_seen: string; info: string | null; ip: string | null; stats: string | null }>("SELECT device_id, last_seen, info, ip, stats FROM attendance_device_status", []),
      q<{ device_id: string; user_id: string; user_name: string | null; last_seen: string }>("SELECT device_id, user_id, user_name, last_seen FROM attendance_device_users", []),
      loadEmployees(),
      pendingPunches(),
    ]);
    const byPin = new Map(emps.filter((e) => e.devicePin).map((e) => [e.devicePin, e]));
    const byNik = new Map(emps.filter((e) => e.nik).map((e) => [e.nik, e]));
    const empOf = (uid: string) => byPin.get(uid) ?? byNik.get(uid) ?? null;
    const free = emps.filter((e) => !e.devicePin && e.status !== "Nonaktif" && e.status !== "Keluar");

    // User mesin = yang pernah terlihat (scan / pendaftaran) + ID dari scan tertunda.
    const map = new Map<string, { deviceId: string; userId: string; userName: string; lastSeen: string }>();
    for (const u of users) map.set(`${u.device_id}|${u.user_id}`, { deviceId: u.device_id, userId: u.user_id, userName: u.user_name ?? "", lastSeen: u.last_seen });
    const pendingBy = new Map<string, number>();
    for (const p of pending) {
      pendingBy.set(p.userId, (pendingBy.get(p.userId) ?? 0) + 1);
      const dev = p.source.slice("device:".length);
      if (![...map.values()].some((u) => u.userId === p.userId)) map.set(`${dev}|${p.userId}`, { deviceId: dev, userId: p.userId, userName: "", lastSeen: "" });
    }
    const rows = [...map.values()].map((u) => {
      const emp = empOf(u.userId);
      let suggestion: { id: string; name: string; score: number } | null = null;
      if (!emp && u.userName) {
        for (const e of free) {
          const sc = nameScore(u.userName, e.name);
          if (sc >= 0.5 && (!suggestion || sc > suggestion.score)) suggestion = { id: e.id, name: e.name, score: Math.round(sc * 100) / 100 };
        }
      }
      return {
        ...u,
        employee: emp ? { id: emp.id, name: emp.name, via: emp.devicePin === u.userId ? "devicePin" : "nik" } : null,
        suggestion,
        pending: emp ? 0 : (pendingBy.get(u.userId) ?? 0),
      };
    }).sort((a, b) => Number(a.employee !== null) - Number(b.employee !== null) || a.userId.localeCompare(b.userId, undefined, { numeric: true }));

    const statusBy = new Map(status.map((s) => [s.device_id, s]));
    return ok({
      devices: devices.map((id) => {
        const s = statusBy.get(id);
        let info: unknown = null;
        let stats: unknown = null;
        try { info = s?.info ? JSON.parse(s.info) as unknown : null; } catch { info = null; }
        try { stats = s?.stats ? JSON.parse(s.stats) as unknown : null; } catch { stats = null; }
        return { deviceId: id, lastSeen: s?.last_seen ?? null, ip: s?.ip ?? null, info, stats };
      }),
      users: rows,
      employees: emps.filter((e) => e.status !== "Nonaktif" && e.status !== "Keluar")
        .map((e) => ({ id: e.id, name: e.name, nik: e.nik, devicePin: e.devicePin }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      canRaw: isRaw(req.user?.role),
    });
  });

  app.post("/api/attendance/device-users/link", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const parsed = LinkSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("ID mesin hanya huruf, angka, - dan _", "VALIDATION_ERROR"));
    const { userId, employeeId } = parsed.data;
    if (employeeId !== null) {
      const exists = await q<{ id: string }>("SELECT id FROM employees WHERE id = ?", [employeeId]);
      if (exists.length === 0) return reply.status(404).send(fail("Karyawan tidak ditemukan", "NOT_FOUND"));
    }
    const { before } = await linkDevicePin(userId, employeeId);
    const result = employeeId !== null ? await reprocessPending(userId) : { accepted: 0, unknown: [], invalid: 0 };
    await writeAudit({
      actor: requestActor(req), action: "attendance_device_link", table: "employees", rowId: employeeId ?? before ?? "-",
      diff: { devicePin: userId, employeeId, previousEmployeeId: before, reprocessed: result.accepted },
      ip: requestIp(req),
    });
    return ok({ userId, employeeId, previousEmployeeId: before, reprocessed: result.accepted });
  });

  /* Log scan mesin: setiap kiriman scan tercatat di audit_log (attendance_ingest)
     oleh /fkweb dan /iclock. Status dihitung ulang terhadap pemetaan ID saat ini:
     scan yang dulu "ID belum terhubung" tampil "diproses ulang" setelah HR
     menghubungkan ID-nya. Rentang default 7 hari terakhir, maks 62 hari. */
  app.get("/api/attendance/device-logs", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const parsed = LogQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(fail("Filter log tidak sah", "VALIDATION_ERROR"));
    const f = parsed.data;
    const to = f.to ?? todayWita();
    const from = f.from ?? addDays(to, -6);
    if (from > to) return reply.status(400).send(fail("Tanggal awal setelah tanggal akhir", "VALIDATION_ERROR"));
    if (Date.parse(to) - Date.parse(from) > 62 * 86_400_000) return reply.status(400).send(fail("Rentang log maksimal 62 hari", "VALIDATION_ERROR"));
    const rows = await q<{ created_at: string; actor: string; diff: string }>(
      "SELECT created_at, actor, diff FROM audit_log WHERE table_name = 'attendance' AND action = 'attendance_ingest' AND actor LIKE 'device:%' AND created_at >= ? AND created_at < ? ORDER BY created_at DESC",
      [witaDayStartIso(from), witaDayStartIso(addDays(to, 1))],
    );
    const emps = await loadEmployees();
    const byPin = new Map(emps.filter((e) => e.devicePin).map((e) => [e.devicePin, e]));
    const byNik = new Map(emps.filter((e) => e.nik).map((e) => [e.nik, e]));
    /* Jenis tiap scan dibaca dari baris absensi harinya: jam = jam masuk →
       "in", = jam pulang → "out", selain itu scan tambahan ("extra"). */
    const days = new Map<string, { checkIn: string; checkOut: string; scans: number }>();
    for (const a of await q<{ data: string }>("SELECT data FROM attendance", [])) {
      try {
        const x = JSON.parse(a.data) as Record<string, unknown>;
        const date = String(x.date ?? "");
        if (date < addDays(from, -1) || date > addDays(to, 1)) continue;
        days.set(`${String(x.employeeId)}|${date}`, { checkIn: String(x.checkIn ?? ""), checkOut: String(x.checkOut ?? ""), scans: tapsOf(x).length });
      } catch { /* baris rusak dilewati */ }
    }
    const out = rows.map((r) => {
      let d: Record<string, unknown> = {};
      try { d = JSON.parse(r.diff) as Record<string, unknown>; } catch { /* baris rusak */ }
      const deviceId = r.actor.slice("device:".length);
      const protocol = String(d.protocol ?? "json");
      const userId = String(d.userId ?? "");
      const accepted = Number(d.accepted ?? 0);
      const unknown = Array.isArray(d.unknown) ? d.unknown.map(String) : [];
      const emp = userId ? (byPin.get(userId) ?? byNik.get(userId) ?? null) : null;
      let status: LogStatus;
      if (accepted > 0) status = "accepted";
      else if (userId && unknown.includes(userId)) status = emp ? "reprocessed" : "pending";
      else if (unknown.length > 0) status = "pending";
      else status = "invalid";
      const scanIso = ioIso(String(d.ioTime ?? ""));
      const day = emp && scanIso ? days.get(`${emp.id}|${scanIso.slice(0, 10)}`) : undefined;
      const hhmm = scanIso ? scanIso.slice(11, 16) : "";
      const kind: "in" | "out" | "extra" | null = !day ? null : hhmm === day.checkIn ? "in" : hhmm === day.checkOut ? "out" : "extra";
      return {
        at: r.created_at, deviceId, protocol, userId,
        kind, dayScans: day?.scans ?? 0,
        scanAt: scanIso,
        employee: emp ? { id: emp.id, name: emp.name } : null,
        status,
        lines: protocol === "fk" ? 1 : Number(d.lines ?? accepted + unknown.length),
        unknown: protocol === "fk" ? [] : unknown,
      };
    });
    const needle = (f.q ?? "").toLowerCase();
    const filtered = out.filter((r) => (!f.deviceId || r.deviceId === f.deviceId)
      && (!f.status || r.status === f.status)
      && (!needle || r.userId.toLowerCase().includes(needle) || (r.employee?.name ?? "").toLowerCase().includes(needle)));
    const summary = { accepted: 0, reprocessed: 0, pending: 0, invalid: 0 } as Record<LogStatus, number>;
    for (const r of filtered) summary[r.status] += 1;
    const limit = f.limit ?? 100;
    const offset = f.offset ?? 0;
    return ok({ from, to, total: filtered.length, summary, rows: filtered.slice(offset, offset + limit), devices: await registeredDevices() });
  });

  /* Ringkasan harian dari scan mesin: per karyawan per hari - masuk, pulang,
     lama di kantor (bersih, dikurangi keluar di tengah hari), jumlah scan,
     dan tanda (telat, pulang cepat, lembur, belum pulang). Lihat
     attendanceAnalysis.ts untuk algoritmanya. Hanya baris bersumber mesin. */
  app.get("/api/attendance/device-daily", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const parsed = LogQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(fail("Filter tidak sah", "VALIDATION_ERROR"));
    const f = parsed.data;
    const today = todayWita();
    const to = f.to ?? today;
    const from = f.from ?? to;
    if (from > to) return reply.status(400).send(fail("Tanggal awal setelah tanggal akhir", "VALIDATION_ERROR"));
    if (Date.parse(to) - Date.parse(from) > 62 * 86_400_000) return reply.status(400).send(fail("Rentang maksimal 62 hari", "VALIDATION_ERROR"));
    const emps = new Map((await loadEmployees()).map((e) => [e.id, e]));
    const needle = (f.q ?? "").toLowerCase();
    type DailyRow = DayAnalysis & { id: string; date: string; employee: { id: string; name: string; devicePin: string }; status: string; hours: { start: string; end: string } };
    const base = await loadWorkHours();
    const rows: DailyRow[] = [];
    /* Kumpulkan tap per karyawan per tanggal (rentang +-1 hari supaya shift
       lintas tengah malam di tepi rentang ikut terbaca), lalu foldOvernight
       memindah tap dini hari ke shift malam sebelumnya. */
    const perEmp = new Map<string, Map<string, string[]>>();
    const meta = new Map<string, { id: string; status: string }>();
    for (const a of await q<{ id: string; data: string }>("SELECT id, data FROM attendance", [])) {
      let d: Record<string, unknown>;
      try { d = JSON.parse(a.data) as Record<string, unknown>; } catch { continue; }
      const date = String(d.date ?? "");
      if (date < addDays(from, -1) || date > addDays(to, 1) || !String(d.source ?? "").startsWith("device:")) continue;
      const empId = String(d.employeeId ?? "");
      const m = perEmp.get(empId) ?? new Map<string, string[]>();
      // Jam masuk/pulang tersimpan selalu ikut (baris lama tanpa daftar tap).
      m.set(date, tapsOf(d));
      perEmp.set(empId, m);
      meta.set(`${empId}|${date}`, { id: a.id, status: String(d.status ?? "") });
    }
    for (const [empId, days] of perEmp) {
      const emp = emps.get(empId);
      const name = emp?.name ?? empId;
      if (needle && !name.toLowerCase().includes(needle) && !(emp?.devicePin ?? "").toLowerCase().includes(needle)) continue;
      for (const [date, taps] of foldOvernight(days)) {
        if (date < from || date > to) continue;
        const mt = meta.get(`${empId}|${date}`);
        rows.push({
          id: mt?.id ?? `${empId}|${date}`, date, employee: { id: empId, name, devicePin: emp?.devicePin ?? "" },
          status: mt?.status ?? "", hours: hoursFor(emp, base), ...analyzeDay(taps, { isToday: date === today, ...hoursFor(emp, base) }),
        });
      }
    }
    rows.sort((x, y) => y.date.localeCompare(x.date) || x.employee.name.localeCompare(y.employee.name));
    const done = rows.filter((r) => r.netMin > 0);
    const has = (flag: DayAnalysis["flags"][number]): number => rows.filter((r) => r.flags.includes(flag)).length;
    return ok({
      from, to, rows,
      summary: {
        present: rows.length, late: has("late"), inOffice: has("in_office"), noCheckout: has("no_checkout"),
        earlyLeave: has("early_leave"), overtime: has("overtime"), review: has("odd_scans"),
        outsideHours: has("outside_hours"), overnight: has("overnight"),
        avgNetMin: done.length ? Math.round(done.reduce((s, r) => s + r.netMin, 0) / done.length) : 0,
      },
      workHours: base,
    });
  });

  /* Statistik untuk grafik tab Mesin: scan per jam hari ini, scan per hari
     14 hari, isi vs kapasitas, kualitas koneksi, dan pengaturan terakhir. */
  app.get("/api/attendance/devices/:id/stats", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    if (!ID_RE.test(id)) return reply.status(400).send(fail("ID alat tidak sah", "VALIDATION_ERROR"));
    const today = todayWita();
    const from14 = addDays(today, -13);
    const perHour = Array.from({ length: 24 }, () => 0);
    const perDay = new Map<string, number>();
    for (let i = 0; i < 14; i += 1) perDay.set(addDays(from14, i), 0);
    const rows = await q<{ diff: string }>(
      "SELECT diff FROM audit_log WHERE actor = ? AND action = 'attendance_ingest' AND created_at >= ?",
      [`device:${id}`, witaDayStartIso(addDays(from14, -1))],
    );
    for (const r of rows) {
      try {
        const d = JSON.parse(r.diff) as { ioTime?: string };
        const t = String(d.ioTime ?? "");
        if (t.length !== 14) continue;
        const date = `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
        if (perDay.has(date)) perDay.set(date, (perDay.get(date) ?? 0) + 1);
        if (date === today) perHour[Number(t.slice(8, 10))] = (perHour[Number(t.slice(8, 10))] ?? 0) + 1;
      } catch { /* dilewati */ }
    }
    const st = (await q<{ stats: string | null; last_seen: string | null }>("SELECT stats, last_seen FROM attendance_device_status WHERE device_id = ?", [id]))[0];
    const setting = (await q<{ result: string | null; done_at: string | null }>("SELECT result, done_at FROM attendance_device_commands WHERE device_id = ? AND cmd_code = 'GET_DEVICE_SETTING' AND status = 'done' ORDER BY done_at DESC LIMIT 1", [id]))[0];
    const parseJ = (x: string | null | undefined): unknown => { try { return x ? JSON.parse(x) as unknown : null; } catch { return null; } };
    return ok({
      perHour, perDay: [...perDay.entries()].map(([date, count]) => ({ date, count })),
      capacity: parseJ(st?.stats),
      connection: { ...connectionStats(deviceBeats(id)), lastSeen: st?.last_seen ?? null },
      settings: setting ? { at: setting.done_at, values: (parseJ(setting.result) as { data?: unknown } | null)?.data ?? null } : null,
    });
  });

  /* Jam kerja standar untuk analisis scan mesin (telat / pulang cepat / lewat
     jam pulang). Pengecualian per karyawan diisi di data karyawan. */
  app.get("/api/attendance/work-hours", { preHandler: [requireAuth] }, async () => ok(await loadWorkHours()));
  app.put("/api/attendance/work-hours", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengatur jam kerja", "FORBIDDEN"));
    const parsed = z.object({ start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).safeParse(req.body);
    if (!parsed.success || parsed.data.start >= parsed.data.end) return reply.status(400).send(fail("Jam masuk harus sebelum jam pulang (format HH:MM)", "VALIDATION_ERROR"));
    const before = await loadWorkHours();
    await saveWorkHours(parsed.data.start, parsed.data.end);
    await writeAudit({ actor: requestActor(req), action: "update", table: "settings", rowId: "SET-ATT-HOURS", diff: { before, after: parsed.data }, ip: requestIp(req) });
    return ok(parsed.data);
  });

  app.get("/api/attendance/devices/:id/commands", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    if (!ID_RE.test(id)) return reply.status(400).send(fail("ID alat tidak sah", "VALIDATION_ERROR"));
    return ok({ commands: await listCommands(id) });
  });

  /* Perintah mentah: hanya developer/direktur selama format perintah tiap
     firmware masih diuji. Aksi HR (restart, sinkron jam, rekam) menyusul
     setelah kodenya terbukti di mesin asli. */
  app.post("/api/attendance/devices/:id/commands", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isRaw(req.user?.role)) return reply.status(403).send(fail("Perintah mentah hanya untuk developer/direktur", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    if (!(await registeredDevices()).includes(id)) return reply.status(404).send(fail("Alat belum terdaftar", "NOT_FOUND"));
    const parsed = CmdSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Kode perintah: huruf besar, angka, _ (maks 40)", "VALIDATION_ERROR"));
    const cmd = await enqueueCommand(id, parsed.data.cmd, parsed.data.param ?? null, requestActor(req));
    await writeAudit({ actor: requestActor(req), action: "attendance_device_command", table: "attendance", rowId: cmd.id, diff: { deviceId: id, cmd: cmd.cmdCode, param: cmd.param }, ip: requestIp(req) });
    return reply.status(201).send(ok(cmd));
  });

  /* Aksi HR bertipe: kode perintah firmware sudah terbukti di mesin asli
     (GET_DEVICE_STATUS, SET_TIME, RESET_FK, GET_USER_ID_LIST, GET/SET_USER_INFO,
     DELETE_USER). Pendaftaran karyawan selalu mengecek ID kosong dulu. */
  app.post("/api/attendance/devices/:id/actions", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    if (!(await registeredDevices()).includes(id)) return reply.status(404).send(fail("Alat belum terdaftar", "NOT_FOUND"));
    const parsed = ActionSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Aksi tidak dikenal", "VALIDATION_ERROR"));
    const res = await enqueueHrAction(id, parsed.data as HrAction, requestActor(req));
    if ("error" in res) return reply.status(res.status).send(fail(res.error, res.status === 404 ? "NOT_FOUND" : "CONFLICT"));
    await writeAudit({ actor: requestActor(req), action: "attendance_device_action", table: "attendance", rowId: res.command.id, diff: { deviceId: id, ...parsed.data, cmd: res.command.cmdCode }, ip: requestIp(req) });
    return reply.status(201).send(ok(res.command));
  });

  app.delete("/api/attendance/devices/:id/commands/:cmd", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!isHr(req.user?.role)) return reply.status(403).send(fail("Hanya HR yang boleh mengelola mesin absensi", "FORBIDDEN"));
    const { id, cmd } = req.params as { id: string; cmd: string };
    if (!(await cancelCommand(id, cmd))) return reply.status(409).send(fail("Perintah sudah terkirim atau tidak ada", "CONFLICT"));
    return ok({ id: cmd, cancelled: true });
  });
}
