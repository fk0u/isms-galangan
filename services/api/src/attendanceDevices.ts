/* ADR-0025: mesin absensi dikelola dari website.
 * - status mesin (terakhir online, info firmware),
 * - user yang terlihat di mesin (ID + nama; biometrik tidak pernah disimpan),
 * - pencocokan ID mesin ↔ karyawan (field employees.data.devicePin) + proses
 *   ulang scan yang sempat ditolak karena ID belum terhubung,
 * - antrean perintah server → mesin (diambil saat mesin bertanya receive_cmd). */
import { randomBytes } from "node:crypto";
import { exec, q, withTx } from "./db.js";
import { applyPunches, type IngestResult, type PunchInput } from "./routes/attendanceIngest.js";

const now = (): string => new Date().toISOString();

/* ---------- biometrik: buang sebelum disimpan / dicatat ---------- */
const BIO_KEY = /enroll_data$|^enroll_data|photo|image|template|fp_data|face_data|palm|vein/i;

/** Salinan JSON tanpa data biometrik (nilai field biometrik diganti "<disensor>"). Murni. */
export function stripBiometric(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripBiometric);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      out[k] = BIO_KEY.test(k) && x !== null && x !== "" && typeof x !== "number" && typeof x !== "boolean" ? "<disensor>" : stripBiometric(x);
    }
    return out;
  }
  return v;
}

/** Semua pasangan {user_id, user_name} di mana pun dalam JSON hasil mesin. Murni. */
export function collectDeviceUsers(v: unknown, out: { userId: string; userName: string }[] = []): { userId: string; userName: string }[] {
  if (Array.isArray(v)) { for (const x of v) collectDeviceUsers(x, out); return out; }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const id = o.user_id ?? o.userId;
    if ((typeof id === "string" || typeof id === "number") && String(id).trim() !== "") {
      out.push({ userId: String(id).trim(), userName: String(o.user_name ?? o.name ?? "").trim() });
    }
    for (const x of Object.values(o)) if (x && typeof x === "object") collectDeviceUsers(x, out);
  }
  return out;
}

/* ---------- status & user mesin ---------- */
export async function touchDevice(deviceId: string, info: unknown, ip: string): Promise<void> {
  const t = now();
  const infoText = info === undefined || info === null ? null : JSON.stringify(stripBiometric(info)).slice(0, 4000);
  const res = await exec("UPDATE attendance_device_status SET last_seen = ?, info = COALESCE(?, info), ip = ? WHERE device_id = ?", [t, infoText, ip, deviceId]);
  if (res.changes === 0) await exec("INSERT INTO attendance_device_status (device_id, last_seen, info, ip) VALUES (?, ?, ?, ?)", [deviceId, t, infoText, ip]);
}

export async function upsertDeviceUser(deviceId: string, userId: string, userName: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(userId)) return;
  const t = now();
  const name = userName.slice(0, 160);
  const res = await exec(
    "UPDATE attendance_device_users SET last_seen = ?, user_name = CASE WHEN ? = '' THEN user_name ELSE ? END WHERE device_id = ? AND user_id = ?",
    [t, name, name, deviceId, userId],
  );
  if (res.changes === 0) {
    await exec("INSERT INTO attendance_device_users (device_id, user_id, user_name, first_seen, last_seen) VALUES (?, ?, ?, ?, ?)", [deviceId, userId, name, t, t]);
  }
}

/* ---------- saran karyawan berdasarkan nama ---------- */
const norm = (s: string): string[] => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 0);

/** Kemiripan nama 0..1 (token sama / awalan sama, mis. "Budi S" ~ "Budi Santoso"). Murni. */
export function nameScore(a: string, b: string): number {
  const x = norm(a);
  const y = norm(b);
  if (x.length === 0 || y.length === 0) return 0;
  let hit = 0;
  const used = new Set<number>();
  for (const w of x) {
    // Sama persis = 1; singkatan/awalan ("s" ~ "santoso", "budi" ~ "budiman") = 0,7.
    const j = y.findIndex((v, i) => !used.has(i) && (v === w || v.startsWith(w) || w.startsWith(v)));
    if (j >= 0) { used.add(j); hit += y[j] === w ? 1 : 0.7; }
  }
  return hit / Math.max(x.length, y.length);
}

export interface EmpLite { id: string; name: string; nik: string; devicePin: string; status: string; branch: string }

export async function loadEmployees(): Promise<EmpLite[]> {
  const rows = await q<{ id: string; branch: string; data: string }>("SELECT id, branch, data FROM employees", []);
  const out: EmpLite[] = [];
  for (const r of rows) {
    try {
      const d = JSON.parse(r.data) as Record<string, unknown>;
      out.push({ id: r.id, branch: r.branch, name: String(d.name ?? ""), nik: String(d.username ?? "").trim(), devicePin: String(d.devicePin ?? "").trim(), status: String(d.status ?? "") });
    } catch { /* baris rusak dilewati */ }
  }
  return out;
}

/* ---------- scan yang tertunda (ID belum terhubung) ---------- */
interface PendingPunch { userId: string; ioTime: string; source: string }

/** Scan FK yang ditolak karena ID belum dikenal, dibaca dari audit_log.
 *  Pemanggil menyaring ID yang kini sudah terhubung (tidak perlu penanda
 *  "sudah diproses": memproses ulang tap yang sama tidak mengubah jam). */
export async function pendingPunches(): Promise<PendingPunch[]> {
  const rows = await q<{ actor: string; diff: string }>("SELECT actor, diff FROM audit_log WHERE action = 'attendance_ingest' AND actor LIKE 'device:%'", []);
  const out: PendingPunch[] = [];
  for (const r of rows) {
    try {
      const d = JSON.parse(r.diff) as { protocol?: string; userId?: string; ioTime?: string; unknown?: string[]; reprocessed?: boolean };
      if (d.protocol !== "fk" || !d.userId || !d.ioTime || !(d.unknown ?? []).includes(d.userId)) continue;
      out.push({ userId: d.userId, ioTime: d.ioTime, source: r.actor });
    } catch { /* dilewati */ }
  }
  return out;
}

const fkIso = (t: string): string | null => {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(t);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+08:00` : null;
};

/** Proses ulang scan tertunda milik satu ID mesin (setelah dihubungkan ke karyawan). */
export async function reprocessPending(userId: string): Promise<IngestResult> {
  const mine = (await pendingPunches()).filter((p) => p.userId === userId);
  const bySource = new Map<string, PunchInput[]>();
  for (const p of mine) {
    const ts = fkIso(p.ioTime);
    if (!ts) continue;
    const list = bySource.get(p.source) ?? [];
    list.push({ employeeNo: userId, timestamp: ts, type: "auto" });
    bySource.set(p.source, list);
  }
  const total: IngestResult = { accepted: 0, unknown: [], invalid: 0 };
  for (const [source, punches] of bySource) {
    const r = await applyPunches(punches, source);
    total.accepted += r.accepted;
    total.invalid += r.invalid;
  }
  return total;
}

/** Hubungkan (atau lepas, employeeId = null) ID mesin ke karyawan. ID unik di semua karyawan. */
export async function linkDevicePin(userId: string, employeeId: string | null): Promise<{ before: string | null }> {
  return withTx(async () => {
    const rows = await q<{ id: string; data: string }>("SELECT id, data FROM employees", []);
    let before: string | null = null;
    const t = now();
    for (const r of rows) {
      let d: Record<string, unknown>;
      try { d = JSON.parse(r.data) as Record<string, unknown>; } catch { continue; }
      const pin = String(d.devicePin ?? "").trim();
      if (pin === userId && r.id !== employeeId) {
        before = r.id;
        delete d.devicePin;
        await exec("UPDATE employees SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(d), t, r.id]);
      }
      if (r.id === employeeId && pin !== userId) {
        d.devicePin = userId;
        await exec("UPDATE employees SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(d), t, r.id]);
      }
    }
    return { before };
  });
}

/* ---------- antrean perintah ---------- */
export interface DeviceCommand {
  id: string; deviceId: string; cmdCode: string; param: unknown; status: string; result: unknown;
  createdBy: string; createdAt: string; sentAt: string | null; doneAt: string | null;
}
type CmdRow = { id: string; device_id: string; cmd_code: string; param: string | null; status: string; result: string | null; created_by: string | null; created_at: string; sent_at: string | null; done_at: string | null };
const parse = (s: string | null): unknown => { if (s === null) return null; try { return JSON.parse(s) as unknown; } catch { return s; } };
const toCmd = (r: CmdRow): DeviceCommand => ({
  id: r.id, deviceId: r.device_id, cmdCode: r.cmd_code, param: parse(r.param), status: r.status, result: parse(r.result),
  createdBy: r.created_by ?? "", createdAt: r.created_at, sentAt: r.sent_at, doneAt: r.done_at,
});
/** Perintah terkirim tanpa jawaban selama ini dianggap timeout. */
const SENT_TIMEOUT_MS = 5 * 60_000;

export async function enqueueCommand(deviceId: string, cmdCode: string, param: unknown, by: string): Promise<DeviceCommand> {
  const id = `CMD${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;
  const t = now();
  await exec(
    "INSERT INTO attendance_device_commands (id, device_id, cmd_code, param, status, created_by, created_at) VALUES (?, ?, ?, ?, 'queued', ?, ?)",
    [id, deviceId, cmdCode, param === undefined || param === null ? null : JSON.stringify(param), by, t],
  );
  return { id, deviceId, cmdCode, param: param ?? null, status: "queued", result: null, createdBy: by, createdAt: t, sentAt: null, doneAt: null };
}

/** Ambil perintah tertua untuk mesin ini dan tandai terkirim (aman bila dua permintaan bersamaan). */
export async function takeNextCommand(deviceId: string): Promise<DeviceCommand | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rows = await q<CmdRow>("SELECT * FROM attendance_device_commands WHERE device_id = ? AND status = 'queued' ORDER BY created_at ASC, id ASC LIMIT 1", [deviceId]);
    const row = rows[0];
    if (!row) return null;
    const t = now();
    const res = await exec("UPDATE attendance_device_commands SET status = 'sent', sent_at = ? WHERE id = ? AND status = 'queued'", [t, row.id]);
    if (res.changes === 1) return toCmd({ ...row, status: "sent", sent_at: t });
  }
  return null;
}

/** Simpan jawaban mesin untuk perintah (dicocokkan lewat trans_id = id perintah). */
export async function recordCommandResult(deviceId: string, cmdId: string, returnCode: string, requestCode: string, json: unknown, binaryBytes: number): Promise<boolean> {
  const ok = returnCode === "" || /^OK$/i.test(returnCode);
  const result = JSON.stringify({ returnCode, requestCode, data: stripBiometric(json), binaryBytes }).slice(0, 200_000);
  const res = await exec(
    "UPDATE attendance_device_commands SET status = ?, result = ?, done_at = ? WHERE id = ? AND device_id = ? AND status IN ('sent', 'timeout')",
    [ok ? "done" : "error", result, now(), cmdId, deviceId],
  );
  if (res.changes === 1) for (const u of collectDeviceUsers(json)) await upsertDeviceUser(deviceId, u.userId, u.userName);
  return res.changes === 1;
}

export async function listCommands(deviceId: string, limit = 30): Promise<DeviceCommand[]> {
  const cutoff = new Date(Date.now() - SENT_TIMEOUT_MS).toISOString();
  await exec("UPDATE attendance_device_commands SET status = 'timeout' WHERE device_id = ? AND status = 'sent' AND sent_at < ?", [deviceId, cutoff]);
  const rows = await q<CmdRow>(`SELECT * FROM attendance_device_commands WHERE device_id = ? ORDER BY created_at DESC, id DESC LIMIT ${Math.max(1, Math.min(100, limit))}`, [deviceId]);
  return rows.map(toCmd);
}

export async function cancelCommand(deviceId: string, cmdId: string): Promise<boolean> {
  const res = await exec("UPDATE attendance_device_commands SET status = 'cancelled', done_at = ? WHERE id = ? AND device_id = ? AND status = 'queued'", [now(), cmdId, deviceId]);
  return res.changes === 1;
}
