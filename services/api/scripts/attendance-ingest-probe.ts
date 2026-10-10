/* attendance-ingest-probe.ts — F3-L-08: tap dari alat → baris absensi harian. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";
import { mergePunch, witaParts } from "../src/routes/attendanceIngest.js";

async function main(): Promise<void> {
  console.log("=== ISMS Attendance Ingest Probe (F3-L-08) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  assert("witaParts: UTC 23:58 → tanggal WITA berikutnya 07:58", JSON.stringify(witaParts("2026-11-01T23:58:00Z")) === JSON.stringify({ date: "2026-11-02", time: "07:58" }));
  assert("witaParts: timestamp rusak → null", witaParts("bukan tanggal") === null);
  assert("mergePunch: masuk paling awal, pulang paling akhir", JSON.stringify(mergePunch(mergePunch(mergePunch({}, "in", "08:05"), "in", "07:55"), "out", "17:10")) === JSON.stringify({ checkIn: "07:55", checkOut: "17:10" }));

  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'direktur' AND is_active = 1 LIMIT 1"))[0];
  const hr = { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 })}` };
  const stamp = Date.now().toString(36).toUpperCase();
  const empId = `EMP-ING-${stamp}`;
  const nik = `88${Date.now()}`;
  const deviceId = `probe-${stamp}`;
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empId, "Samarinda", JSON.stringify({ name: "Probe Absen", username: nik, status: "Aktif" }), new Date().toISOString()]);
  try {
    const reg = await app.inject({ method: "POST", url: "/api/attendance/devices", headers: hr, payload: { deviceId } });
    const apiKey = (reg.json() as { data: { apiKey: string } }).data.apiKey;
    assert("HR mendaftarkan alat dan menerima API key", reg.statusCode === 200 && apiKey.length === 64, reg.body);
    const stored = (await q<{ value: string }>("SELECT value FROM access_secrets WHERE access_key = ?", [`device:${deviceId}`]))[0]?.value ?? "";
    assert("yang disimpan hash, bukan API key", stored !== "" && stored !== apiKey, "");
    const punches = [
      { employeeNo: nik, timestamp: "2026-11-02T07:58:00+08:00", type: "in" },
      { employeeNo: nik, timestamp: "2026-11-02T17:12:00+08:00", type: "out" },
      { employeeNo: "tidak-terdaftar", timestamp: "2026-11-02T08:00:00+08:00", type: "in" },
    ];
    const noKey = await app.inject({ method: "POST", url: "/api/attendance/ingest", payload: { deviceId, punches } });
    const badKey = await app.inject({ method: "POST", url: "/api/attendance/ingest", headers: { "x-device-key": "f".repeat(64) }, payload: { deviceId, punches } });
    assert("tanpa key / key salah → 401", noKey.statusCode === 401 && badKey.statusCode === 401, `${noKey.statusCode}/${badKey.statusCode}`);
    const good = await app.inject({ method: "POST", url: "/api/attendance/ingest", headers: { "x-device-key": apiKey }, payload: { deviceId, punches } });
    const res = (good.json() as { data: { accepted: number; unknown: string[] } }).data;
    assert("key benar → 2 tap diterima, 1 NIK tak dikenal dilaporkan", good.statusCode === 200 && res.accepted === 2 && res.unknown.join() === "tidak-terdaftar", good.body);
    const again = await app.inject({ method: "POST", url: "/api/attendance/ingest", headers: { "x-device-key": apiKey }, payload: { deviceId, punches: [punches[0]] } });
    const rows = (await q<{ data: string }>("SELECT data FROM attendance", [])).map((r) => JSON.parse(r.data) as Record<string, unknown>).filter((d) => d.employeeId === empId);
    assert("satu baris per karyawan per hari (tap ulang tidak menggandakan)", again.statusCode === 200 && rows.length === 1 && rows[0].checkIn === "07:58" && rows[0].checkOut === "17:12" && rows[0].status === "Hadir", JSON.stringify(rows));
    const csv = await app.inject({ method: "POST", url: "/api/attendance/import", headers: hr, payload: { punches: [{ employeeNo: nik, timestamp: "2026-11-03T08:01:00+08:00", type: "in" }] } });
    assert("impor CSV (login HR) → diterima", csv.statusCode === 200 && (csv.json() as { data: { accepted: number } }).data.accepted === 1, csv.body);
    const anon = await app.inject({ method: "POST", url: "/api/attendance/import", payload: { punches } });
    assert("impor tanpa login → 401", anon.statusCode === 401, String(anon.statusCode));
  } finally {
    const mine = (await q<{ id: string; data: string }>("SELECT id, data FROM attendance", [])).filter((r) => r.data.includes(empId));
    for (const r of mine) await exec("DELETE FROM attendance WHERE id = ?", [r.id]);
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
    await exec("DELETE FROM access_secrets WHERE access_key = ?", [`device:${deviceId}`]);
  }
  console.log(`\n${passed}/${total} pemeriksaan ingest absensi lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
