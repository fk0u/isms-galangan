/* fkweb-probe.ts — mesin Fingerspot (protokol FK realtime, frame emulator) → absensi ISMS. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, exec, q } from "../src/db.js";
import { fkPunch, fkTime, parseFkBody } from "../src/routes/fkweb.js";
import { cmdFrame, enrollFrame, fkBody, fkHeaders, glogFrame, type FkFrame } from "./fkweb-emulator.js";

async function main(): Promise<void> {
  console.log("=== ISMS Fingerspot FK (fkweb) Probe ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const g = glogFrame("1001", "20261116075800");
  assert("parse body FK (uint32 LE + JSON)", parseFkBody(fkBody(g.json))?.user_id === "1001");
  assert("body rusak → null", parseFkBody(Buffer.from([255, 0, 0, 0, 1])) === null && parseFkBody(Buffer.alloc(2)) === null);
  assert("io_time → ISO WITA", fkTime("20261116075800") === "2026-11-16T07:58:00+08:00" && fkTime("2026-11-16") === null);
  assert("glog → tap auto", JSON.stringify(fkPunch(g.json)) === JSON.stringify({ employeeNo: "1001", timestamp: "2026-11-16T07:58:00+08:00", type: "auto" }));

  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ? AND is_active = 1 LIMIT 1", ["direktur"]))[0];
  if (!u) throw new Error("Butuh akun direktur hasil seed");
  const hr = { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 })}` };
  const stamp = Date.now().toString(36).toUpperCase();
  const dev = `FKEMU${stamp}`;
  const empId = `EMP-FK-${stamp}`;
  const pin = `66${Date.now() % 1_000_000}`;
  const send = async (f: FkFrame, devId = dev) => {
    const body = fkBody(f.json, f.tail);
    const r = await app.inject({ method: "POST", url: "/fkweb", payload: body, headers: fkHeaders(devId, f, body.length) });
    return { status: r.statusCode, rc: String(r.headers.response_code ?? ""), trans: String(r.headers.trans_id ?? "") };
  };
  const myRows = async () => (await q<{ data: string }>("SELECT data FROM attendance", [])).map((r) => JSON.parse(r.data) as Record<string, unknown>).filter((d) => d.employeeId === empId);
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empId, "Samarinda", JSON.stringify({ name: "Probe FK", username: pin, status: "Aktif" }), new Date().toISOString()]);
  try {
    const denied = await send(glogFrame(pin, "20261116075800"));
    assert("dev_id belum terdaftar → 401 ERROR, tidak ada absensi", denied.status === 401 && denied.rc === "ERROR" && (await myRows()).length === 0, JSON.stringify(denied));

    const reg = await app.inject({ method: "POST", url: "/api/attendance/devices", headers: hr, payload: { deviceId: dev } });
    assert("HR mendaftarkan No Mesin", reg.statusCode === 200, reg.body);

    const cmd = await send(cmdFrame("20261116075700"));
    assert("receive_cmd → ERROR_NO_CMD + trans_id sama", cmd.status === 200 && cmd.rc === "ERROR_NO_CMD" && cmd.trans === "ReceiveCommandAction", JSON.stringify(cmd));
    const enr = await send(enrollFrame(pin));
    assert("realtime_enroll_data → OK (template dibuang)", enr.status === 200 && enr.rc === "OK" && enr.trans === "RTEnrollDataAction", JSON.stringify(enr));
    const leak = await q<{ n: number }>("SELECT COUNT(*) AS n FROM audit_log WHERE diff LIKE ?", ["%BIN_1%"]);
    assert("template biometrik tidak tercatat di audit_log", Number(leak[0]?.n ?? 0) === 0);

    for (const t of ["20261116120100", "20261116075800", "20261116170500"]) {
      const r = await send(glogFrame(pin, t));
      assert(`realtime_glog ${t} → OK + trans_id RTLogSendAction`, r.status === 200 && r.rc === "OK" && r.trans === "RTLogSendAction", JSON.stringify(r));
    }
    const rows = await myRows();
    assert("satu baris absensi: masuk 07:58, pulang 17:05, sumber device:<dev_id>", rows.length === 1 && rows[0]?.date === "2026-11-16" && rows[0]?.checkIn === "07:58" && rows[0]?.checkOut === "17:05" && rows[0]?.source === `device:${dev}`, JSON.stringify(rows));

    const retry = await send(glogFrame(pin, "20261116075800"));
    const rows2 = await myRows();
    assert("kiriman ulang mesin tidak menggandakan / mengubah jam", retry.rc === "OK" && rows2.length === 1 && rows2[0]?.checkIn === "07:58" && rows2[0]?.checkOut === "17:05", JSON.stringify(rows2));

    const unk = await send(glogFrame("99999999", "20261116080000"));
    const audit = await q<{ diff: string }>("SELECT diff FROM audit_log WHERE actor = ? AND action = 'attendance_ingest' ORDER BY created_at DESC LIMIT 1", [`device:${dev}`]);
    assert("PIN tak dikenal → OK ke mesin, tercatat di audit", unk.rc === "OK" && String(audit[0]?.diff ?? "").includes("99999999"), audit[0]?.diff);

    const bad = await app.inject({ method: "POST", url: "/fkweb", payload: Buffer.from("rusak"), headers: fkHeaders(dev, glogFrame(pin, "x"), 5) });
    assert("body rusak → tetap OK (tidak diulang mesin), tidak menulis absensi", bad.statusCode === 200 && String(bad.headers.response_code) === "OK" && (await myRows()).length === 1, `${bad.statusCode}`);
    assert("rute JSON lain tidak terpengaruh parser biner", (await app.inject({ method: "GET", url: "/api/version" })).statusCode === 200);
  } finally {
    const mine = (await q<{ id: string; data: string }>("SELECT id, data FROM attendance", [])).filter((r) => r.data.includes(empId));
    for (const r of mine) await exec("DELETE FROM attendance WHERE id = ?", [r.id]);
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
    await exec("DELETE FROM access_secrets WHERE access_key = ?", [`device:${dev}`]);
  }
  console.log(`\n${passed}/${total} pemeriksaan Fingerspot FK lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
