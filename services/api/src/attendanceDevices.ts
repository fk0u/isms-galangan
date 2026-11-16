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
      // "supported_enroll_data" hanya daftar jenis biometrik yang didukung, bukan data biometrik.
      const bio = BIO_KEY.test(k) && !/^supported_/.test(k);
      out[k] = bio && x !== null && x !== "" && typeof x !== "number" && typeof x !== "boolean" ? "<disensor>" : stripBiometric(x);
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
  /** Konteks sisi server (tidak dikirim ke mesin), mis. {action, employeeId}. */
  meta?: unknown;
}
type CmdRow = { id: string; device_id: string; cmd_code: string; param: string | null; status: string; result: string | null; created_by: string | null; created_at: string; sent_at: string | null; done_at: string | null; meta?: string | null };
const parse = (s: string | null): unknown => { if (s === null) return null; try { return JSON.parse(s) as unknown; } catch { return s; } };
const toCmd = (r: CmdRow): DeviceCommand => ({
  id: r.id, deviceId: r.device_id, cmdCode: r.cmd_code, param: parse(r.param), status: r.status, result: parse(r.result),
  createdBy: r.created_by ?? "", createdAt: r.created_at, sentAt: r.sent_at, doneAt: r.done_at, meta: parse(r.meta ?? null),
});
/** Perintah terkirim tanpa jawaban selama ini dianggap timeout. */
const SENT_TIMEOUT_MS = 5 * 60_000;

export async function enqueueCommand(deviceId: string, cmdCode: string, param: unknown, by: string, meta: unknown = null): Promise<DeviceCommand> {
  const id = `CMD${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;
  const t = now();
  await exec(
    "INSERT INTO attendance_device_commands (id, device_id, cmd_code, param, status, created_by, created_at, meta) VALUES (?, ?, ?, ?, 'queued', ?, ?, ?)",
    [id, deviceId, cmdCode, param === undefined || param === null ? null : JSON.stringify(param), by, t, meta === null ? null : JSON.stringify(meta)],
  );
  return { id, deviceId, cmdCode, param: param ?? null, status: "queued", result: null, createdBy: by, createdAt: t, sentAt: null, doneAt: null, meta };
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

/** Blok biner setelah JSON: rangkaian [uint32 LE panjang][isi]. Bila tidak
 *  cocok dengan pola itu, seluruh ekor dianggap satu blok. Murni. */
export function parseBinBlocks(tail: Buffer): Buffer[] {
  const out: Buffer[] = [];
  let i = 0;
  while (i + 4 <= tail.length) {
    const n = tail.readUInt32LE(i);
    if (n === 0 || i + 4 + n > tail.length) break;
    out.push(tail.subarray(i + 4, i + 4 + n));
    i += 4 + n;
  }
  return i === tail.length && out.length > 0 ? out : tail.length > 0 ? [tail] : [];
}

/** Daftar ID user dari blok biner GET_USER_ID_LIST: entri berukuran tetap
 *  (one_user_id_size), ID = teks sampai byte NUL pertama. Murni. */
export function parseUserIdList(block: Buffer, entrySize: number, count: number): string[] {
  const ids: string[] = [];
  if (entrySize <= 0) return ids;
  for (let k = 0; k < count && (k + 1) * entrySize <= block.length; k += 1) {
    const raw = block.subarray(k * entrySize, (k + 1) * entrySize).toString("latin1");
    const id = raw.split("\0")[0]?.trim() ?? "";
    if (/^[A-Za-z0-9_-]{1,64}$/.test(id)) ids.push(id);
  }
  return ids;
}

/** Waktu WITA "YYYYMMDDHHmmss" untuk SET_TIME. Murni. */
export const witaStamp = (d = new Date()): string => new Date(d.getTime() + 8 * 3600_000).toISOString().replace(/\D/g, "").slice(0, 14);

/** Simpan jawaban mesin untuk perintah (dicocokkan lewat trans_id = id perintah),
 *  lalu jalankan tindak lanjutnya (lihat afterResult). */
export async function recordCommandResult(deviceId: string, cmdId: string, returnCode: string, requestCode: string, json: unknown, tail: Buffer = Buffer.alloc(0)): Promise<boolean> {
  const ok = returnCode === "" || /^OK$/i.test(returnCode);
  const result = JSON.stringify({ returnCode, requestCode, data: stripBiometric(json), binaryBytes: tail.length }).slice(0, 200_000);
  const res = await exec(
    "UPDATE attendance_device_commands SET status = ?, result = ?, done_at = ? WHERE id = ? AND device_id = ? AND status IN ('sent', 'timeout')",
    [ok ? "done" : "error", result, now(), cmdId, deviceId],
  );
  if (res.changes !== 1) return false;
  if (ok) for (const u of collectDeviceUsers(json)) await upsertDeviceUser(deviceId, u.userId, u.userName);
  const row = (await q<CmdRow>("SELECT * FROM attendance_device_commands WHERE id = ?", [cmdId]))[0];
  if (row) await afterResult(toCmd(row), ok, json, tail);
  return true;
}

/* ---------- aksi HR & tindak lanjut hasil perintah ---------- */
type Meta = { action?: string; employeeId?: string; userId?: string; userName?: string; by?: string };

/** Tindak lanjut otomatis setelah mesin menjawab:
 *  - GET_USER_ID_LIST  → catat ID, minta nama tiap ID yang belum bernama;
 *  - GET_USER_INFO (cek ID kosong untuk pendaftaran) → bila kosong, buat user;
 *  - SET_USER_INFO (pendaftaran) → hubungkan ID ke karyawan;
 *  - DELETE_USER → lepas ID dari karyawan & daftar user mesin;
 *  - GET_DEVICE_STATUS → simpan ringkasan jumlah user/biometrik/log. */
async function afterResult(cmd: DeviceCommand, ok: boolean, json: unknown, tail: Buffer): Promise<void> {
  const meta = (cmd.meta ?? {}) as Meta;
  const by = meta.by ?? cmd.createdBy;
  const data = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  if (cmd.cmdCode === "GET_USER_ID_LIST" && ok) {
    const blocks = parseBinBlocks(tail);
    const ids = parseUserIdList(blocks[0] ?? Buffer.alloc(0), Number(data.one_user_id_size ?? 0), Number(data.user_id_count ?? 0));
    const known = new Map((await q<{ user_id: string; user_name: string | null }>("SELECT user_id, user_name FROM attendance_device_users WHERE device_id = ?", [cmd.deviceId])).map((r) => [r.user_id, r.user_name ?? ""]));
    for (const id of ids) {
      // Selalu disentuh: last_seen = terakhir terlihat di daftar mesin.
      await upsertDeviceUser(cmd.deviceId, id, "");
      if (!known.get(id)) await enqueueCommand(cmd.deviceId, "GET_USER_INFO", { user_id: id }, by, { action: "pull_name", userId: id, by });
    }
    /* Selaraskan: ID yang tidak ada lagi di mesin dibuang dari daftar. Hanya
       bila hasil urai lengkap (jumlah = user_id_count) - pengurai yang keliru
       tidak boleh mengosongkan daftar. ID mesin di data karyawan TIDAK diubah. */
    const expected = Number(data.user_id_count ?? -1);
    if (ids.length === expected) {
      const keep = new Set(ids);
      for (const id of known.keys()) {
        if (!keep.has(id)) await exec("DELETE FROM attendance_device_users WHERE device_id = ? AND user_id = ?", [cmd.deviceId, id]);
      }
    }
    return;
  }
  if (cmd.cmdCode === "GET_USER_INFO" && meta.action === "push_check" && meta.userId && meta.employeeId) {
    const taken = ok && String(data.user_id ?? "") === meta.userId;
    if (taken) {
      await exec("UPDATE attendance_device_commands SET status = 'error', result = ? WHERE id = ?", [JSON.stringify({ returnCode: "ID_TAKEN", message: `ID ${meta.userId} sudah dipakai di mesin; pendaftaran dibatalkan agar biometrik user lain tidak tertimpa`, data: stripBiometric(json) }), cmd.id]);
      return;
    }
    await enqueueCommand(cmd.deviceId, "SET_USER_INFO", { user_id: meta.userId, user_name: meta.userName ?? "", user_privilege: "USER", enroll_data_array: [] }, by, { action: "push", userId: meta.userId, employeeId: meta.employeeId, userName: meta.userName, by });
    return;
  }
  if (cmd.cmdCode === "SET_USER_INFO" && meta.action === "push" && ok && meta.userId && meta.employeeId) {
    await upsertDeviceUser(cmd.deviceId, meta.userId, meta.userName ?? "");
    await linkDevicePin(meta.userId, meta.employeeId);
    return;
  }
  if (cmd.cmdCode === "DELETE_USER" && meta.action === "remove" && ok && meta.userId) {
    await exec("DELETE FROM attendance_device_users WHERE device_id = ? AND user_id = ?", [cmd.deviceId, meta.userId]);
    await linkDevicePin(meta.userId, null);
    return;
  }
  if (cmd.cmdCode === "GET_DEVICE_STATUS" && ok) {
    await exec("UPDATE attendance_device_status SET stats = ? WHERE device_id = ?", [JSON.stringify({ ...data, at: now() }).slice(0, 4000), cmd.deviceId]);
  }
}

/** ID berikutnya untuk karyawan baru di mesin: angka terbesar yang dikenal + 1. */
export async function nextDeviceUserId(deviceId: string): Promise<string> {
  const users = await q<{ user_id: string }>("SELECT user_id FROM attendance_device_users WHERE device_id = ?", [deviceId]);
  const pins = (await loadEmployees()).map((e) => e.devicePin);
  const nums = [...users.map((u) => u.user_id), ...pins].filter((v) => /^\d{1,9}$/.test(v)).map(Number);
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}

export type HrAction =
  | { action: "status" } | { action: "sync_time" } | { action: "restart" } | { action: "pull_users" }
  | { action: "push_employee"; employeeId: string; userId?: string }
  | { action: "remove_user"; userId: string };

/** Ubah aksi HR menjadi perintah firmware (kode terbukti di mesin asli, 16 Nov 2026). */
export async function enqueueHrAction(deviceId: string, a: HrAction, by: string): Promise<{ command: DeviceCommand } | { error: string; status: number }> {
  switch (a.action) {
    case "status": return { command: await enqueueCommand(deviceId, "GET_DEVICE_STATUS", null, by, { action: "status", by }) };
    case "sync_time": return { command: await enqueueCommand(deviceId, "SET_TIME", { time: witaStamp() }, by, { action: "sync_time", by }) };
    case "restart": return { command: await enqueueCommand(deviceId, "RESET_FK", null, by, { action: "restart", by }) };
    case "pull_users": return { command: await enqueueCommand(deviceId, "GET_USER_ID_LIST", null, by, { action: "pull_users", by }) };
    case "remove_user": return { command: await enqueueCommand(deviceId, "DELETE_USER", { user_id: a.userId }, by, { action: "remove", userId: a.userId, by }) };
    case "push_employee": {
      const emp = (await loadEmployees()).find((e) => e.id === a.employeeId);
      if (!emp) return { error: "Karyawan tidak ditemukan", status: 404 };
      if (emp.devicePin) return { error: `Karyawan sudah terhubung ke ID mesin ${emp.devicePin}`, status: 409 };
      const userId = a.userId?.trim() || await nextDeviceUserId(deviceId);
      const known = await q<{ user_id: string }>("SELECT user_id FROM attendance_device_users WHERE device_id = ? AND user_id = ?", [deviceId, userId]);
      if (known.length > 0) return { error: `ID ${userId} sudah dipakai di mesin`, status: 409 };
      // Nama di layar mesin terbatas; 24 karakter cukup untuk nama + inisial.
      const userName = emp.name.trim().slice(0, 24);
      /* Cek dulu ID kosong di mesin (GET_USER_INFO). SET_USER_INFO ke ID yang
         sudah ada bisa menimpa biometrik orang lain - pendaftaran dibatalkan bila terpakai. */
      return { command: await enqueueCommand(deviceId, "GET_USER_INFO", { user_id: userId }, by, { action: "push_check", userId, employeeId: emp.id, userName, by }) };
    }
  }
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
