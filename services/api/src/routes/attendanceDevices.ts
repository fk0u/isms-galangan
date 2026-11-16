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
import {
  cancelCommand, enqueueCommand, enqueueHrAction, linkDevicePin, listCommands, loadEmployees, nameScore, pendingPunches, reprocessPending,
  type HrAction,
} from "../attendanceDevices.js";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const LinkSchema = z.object({ userId: z.string().trim().regex(ID_RE), employeeId: z.string().trim().min(1).max(128).nullable() });
const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("sync_time") }),
  z.object({ action: z.literal("restart") }),
  z.object({ action: z.literal("pull_users") }),
  z.object({ action: z.literal("push_employee"), employeeId: z.string().trim().min(1).max(128), userId: z.string().trim().regex(/^\d{1,9}$/).optional() }),
  z.object({ action: z.literal("remove_user"), userId: z.string().trim().regex(ID_RE) }),
]);
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
