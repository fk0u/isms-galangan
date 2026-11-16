/* adms-probe.ts — mesin absensi ADMS (emulator) → baris absensi ISMS. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, exec, q } from "../src/db.js";
import { mergePunch } from "../src/routes/attendanceIngest.js";
import { parseAttlogLine } from "../src/routes/adms.js";
import { attlogLine, emulate, type Sender } from "./adms-emulator.js";

async function main(): Promise<void> {
  console.log("=== ISMS ADMS (iclock) Probe ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  assert("parse baris ATTLOG → tap WITA auto", JSON.stringify(parseAttlogLine(attlogLine("1001", "2026-11-16 07:58:00"))) === JSON.stringify({ employeeNo: "1001", timestamp: "2026-11-16T07:58:00+08:00", type: "auto" }));
  assert("baris rusak → null", parseAttlogLine("bukan\tlog") === null);
  assert("auto: awal = masuk, akhir = pulang", JSON.stringify(mergePunch(mergePunch(mergePunch({}, "auto", "12:01"), "auto", "07:58"), "auto", "17:10")) === JSON.stringify({ checkIn: "07:58", checkOut: "17:10" }));
  assert("auto: satu tap = belum pulang", JSON.stringify(mergePunch({}, "auto", "07:58")) === JSON.stringify({ checkIn: "07:58", checkOut: "" }));

  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'direktur' AND is_active = 1 LIMIT 1"))[0];
  if (!u) throw new Error("Butuh akun direktur hasil seed");
  const hr = { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 })}` };
  const stamp = Date.now().toString(36).toUpperCase();
  const sn = `REVO-${stamp}`;
  const empId = `EMP-ADMS-${stamp}`;
  const pin = `77${Date.now() % 1_000_000}`;
  const send: Sender = async (method, path, body) => {
    const r = await app.inject({ method, url: path, payload: body, headers: body !== undefined ? { "content-type": "text/plain" } : {} });
    return { status: r.statusCode, body: r.body };
  };
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empId, "Samarinda", JSON.stringify({ name: "Probe ADMS", username: pin, status: "Aktif" }), new Date().toISOString()]);
  try {
    const lines = [attlogLine(pin, "2026-11-16 12:01:00"), attlogLine(pin, "2026-11-16 07:58:00", 0, 15), attlogLine(pin, "2026-11-16 17:10:00", 1), attlogLine("99999999", "2026-11-16 08:00:00"), "baris rusak"];
    const denied = await emulate(send, sn, lines);
    assert("SN belum terdaftar → handshake 401, tidak ada log terkirim", denied.length === 1 && denied[0]?.status === 401, JSON.stringify(denied));

    const reg = await app.inject({ method: "POST", url: "/api/attendance/devices", headers: hr, payload: { deviceId: sn } });
    assert("HR mendaftarkan SN mesin", reg.statusCode === 200, reg.body);

    const run = await emulate(send, sn, lines);
    const [hs, log, cmd] = run;
    assert("handshake → konfigurasi (TimeZone=8, Realtime=1)", hs?.status === 200 && hs.body.includes(`GET OPTION FROM: ${sn}`) && hs.body.includes("TimeZone=8") && hs.body.includes("Realtime=1"), hs?.body);
    assert("ATTLOG → OK: 5 (semua baris diakui mesin)", log?.status === 200 && log.body === "OK: 5", log?.body);
    assert("getrequest → OK (tanpa perintah)", cmd?.status === 200 && cmd.body === "OK", cmd?.body);
    const rows = (await q<{ data: string }>("SELECT data FROM attendance", [])).map((r) => JSON.parse(r.data) as Record<string, unknown>).filter((d) => d.employeeId === empId);
    assert("satu baris absensi: masuk 07:58, pulang 17:10, sumber device:SN", rows.length === 1 && rows[0]?.date === "2026-11-16" && rows[0]?.checkIn === "07:58" && rows[0]?.checkOut === "17:10" && rows[0]?.source === `device:${sn}`, JSON.stringify(rows));
    const audit = await q<{ diff: string }>("SELECT diff FROM audit_log WHERE actor = ? AND action = 'attendance_ingest' ORDER BY created_at DESC LIMIT 1", [`device:${sn}`]);
    assert("audit mencatat PIN tak dikenal & baris rusak", String(audit[0]?.diff ?? "").includes("99999999") && String(audit[0]?.diff ?? "").includes("\"invalid\":1"), audit[0]?.diff);

    const again = await emulate(send, sn, [attlogLine(pin, "2026-11-16 07:58:00")]);
    const rows2 = (await q<{ data: string }>("SELECT data FROM attendance", [])).map((r) => JSON.parse(r.data) as Record<string, unknown>).filter((d) => d.employeeId === empId);
    assert("kirim ulang tap yang sama tidak menggandakan / mengubah jam", again[1]?.body === "OK: 1" && rows2.length === 1 && rows2[0]?.checkIn === "07:58" && rows2[0]?.checkOut === "17:10", JSON.stringify(rows2));

    const oper = await app.inject({ method: "POST", url: `/iclock/cdata?SN=${sn}&table=OPERLOG`, payload: "OPLOG 4\t0\t2026-11-16 07:00:00\t0\t0\t0\t0" });
    assert("tabel lain (OPERLOG, tanpa content-type) → OK", oper.statusCode === 200 && oper.body === "OK", `${oper.statusCode} ${oper.body}`);
    const json = await app.inject({ method: "GET", url: "/api/version" });
    assert("rute JSON lain tidak terpengaruh parser teks", json.statusCode === 200, String(json.statusCode));
  } finally {
    const mine = (await q<{ id: string; data: string }>("SELECT id, data FROM attendance", [])).filter((r) => r.data.includes(empId));
    for (const r of mine) await exec("DELETE FROM attendance WHERE id = ?", [r.id]);
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
    await exec("DELETE FROM access_secrets WHERE access_key = ?", [`device:${sn}`]);
  }
  console.log(`\n${passed}/${total} pemeriksaan ADMS lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
