/* fkweb-probe.ts — mesin Fingerspot (protokol FK realtime, frame emulator) → absensi ISMS. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, exec, q } from "../src/db.js";
import { fkPunch, fkTime, parseFkBody } from "../src/routes/fkweb.js";
import { addTap, implausibleTime, mergePunch } from "../src/routes/attendanceIngest.js";
import { analyzeDay } from "../src/attendanceAnalysis.js";
import { collectDeviceUsers, nameScore, parseBinBlocks, parseUserIdList, stripBiometric, witaStamp } from "../src/attendanceDevices.js";
import { cmdFrame, enrollFrame, fkBody, fkHeaders, glogFrame, type FkFrame } from "./fkweb-emulator.js";

async function linkPin(app: Awaited<ReturnType<typeof buildApp>>, headers: Record<string, string>, userId: string, employeeId: string): Promise<void> {
  await app.inject({ method: "POST", url: "/api/attendance/device-users/link", headers, payload: { userId, employeeId } });
}

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
  assert("nameScore: singkatan cocok, nama lain tidak", nameScore("Budi S", "Budi Santoso") >= 0.8 && nameScore("John", "Budi Santoso") === 0);
  assert("stripBiometric menyensor template", JSON.stringify(stripBiometric({ enroll_data_array: [{ enroll_data: "BIN_1" }], user_id: "1" })).includes("<disensor>") && !JSON.stringify(stripBiometric({ enroll_data: "BIN_1" })).includes("BIN_1"));
  assert("collectDeviceUsers membaca daftar user bersarang", collectDeviceUsers({ user_list: [{ user_id: "3", user_name: "Ani" }, { user_id: 4 }] }).map((u) => u.userId).join() === "3,4");
  const entry = (id: string): Buffer => { const b = Buffer.alloc(36); b.write(id, "latin1"); return b; };
  const listBlock = (ids: string[]): Buffer => { const body = Buffer.concat(ids.map(entry)); const len = Buffer.alloc(4); len.writeUInt32LE(body.length, 0); return Buffer.concat([len, body]); };
  assert("parseUserIdList: blok biner [len][entri 36 byte] → ID", parseUserIdList(parseBinBlocks(listBlock(["1", "27"]))[0]!, 36, 2).join() === "1,27");
  assert("stripBiometric tidak menyensor supported_enroll_data", JSON.stringify(stripBiometric({ supported_enroll_data: ["FP", "FACE"] })).includes("FACE"));
  assert("witaStamp 14 digit WITA", witaStamp(new Date("2026-11-16T05:00:00Z")) === "20261116130000");
  assert("scan ganda (07:58 lalu 07:59) bukan jam pulang", JSON.stringify(mergePunch(mergePunch({}, "auto", "07:58"), "auto", "07:59")) === JSON.stringify({ checkIn: "07:58", checkOut: "" }));
  assert("urutan tap tidak berpengaruh (17:05, 07:59, 07:58)", JSON.stringify(mergePunch(mergePunch(mergePunch({}, "auto", "17:05"), "auto", "07:59"), "auto", "07:58")) === JSON.stringify({ checkIn: "07:58", checkOut: "17:05" }));
  assert("jam mesin ngawur ditolak (masa depan / >400 hari lampau)", implausibleTime("2030-01-01T08:00:00+08:00") && implausibleTime("2020-01-01T08:00:00+08:00") && !implausibleTime(new Date().toISOString()));
  assert("addTap: unik per menit, urut, terhitung", JSON.stringify(addTap(addTap(addTap(undefined, "17:05").taps, "07:58").taps, "07:58")) === JSON.stringify({ taps: ["07:58", "17:05"], scanCount: 2 }));
  const A = analyzeDay(["07:58", "07:59", "12:00", "13:00", "17:30"]);
  assert("analisis: debounce scan ganda, 4 tap → 2 sesi + istirahat 60 mnt, bersih 8 j 32 m, lembur 30 m", A.taps.join() === "07:58,12:00,13:00,17:30" && A.sessions.length === 2 && A.breakMin === 60 && A.netMin === 512 && A.overtimeMin === 30 && A.flags.join() === "overtime", JSON.stringify(A));
  const B = analyzeDay(["08:20", "12:01", "16:30"]);
  assert("analisis: tap ganjil → satu sesi + tanda tinjau, telat 20 m, pulang cepat 30 m", B.sessions.length === 1 && B.netMin === 490 && B.lateMin === 20 && B.earlyMin === 30 && B.flags.join() === "late,odd_scans,early_leave", JSON.stringify(B));
  assert("analisis: satu tap → belum pulang / masih di kantor (hari ini)", analyzeDay(["08:00"]).flags.join() === "no_checkout" && analyzeDay(["08:00", "08:10"], { isToday: true }).flags.join() === "in_office" && analyzeDay([]).checkIn === "");
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

    /* --- ID mesin tetap (tidak bisa diubah di mesin) → pencocokan HR --- */
    const devPin = `9${Date.now() % 100000}`;
    const early = await send(glogFrame(devPin, "20261115073000"));
    assert("scan dari ID mesin yang belum terhubung → OK, tertunda", early.rc === "OK");
    await send({ ...enrollFrame(devPin), json: { ...enrollFrame(devPin).json, user_name: "Probe F" } });
    const list1 = await app.inject({ method: "GET", url: "/api/attendance/device-users", headers: hr });
    const u1 = (list1.json() as { data: { users: Array<{ userId: string; userName: string; pending: number; employee: unknown; suggestion: { id: string } | null }>; devices: Array<{ deviceId: string; lastSeen: string | null }> } }).data;
    const row = u1.users.find((u) => u.userId === devPin);
    assert("device-users: ID mesin tampil dengan nama dari mesin, 1 scan tertunda, saran = karyawan bernama mirip", row?.userName === "Probe F" && row.pending === 1 && row.employee === null && row.suggestion?.id === empId, JSON.stringify(row));
    assert("device-users: status mesin terakhir online tercatat", Boolean(u1.devices.find((d) => d.deviceId === dev)?.lastSeen));
    const link = await app.inject({ method: "POST", url: "/api/attendance/device-users/link", headers: hr, payload: { userId: devPin, employeeId: empId } });
    assert("hubungkan ID mesin → 1 scan tertunda diproses ulang", link.statusCode === 200 && (link.json() as { data: { reprocessed: number } }).data.reprocessed === 1, link.body);
    const day17 = (await myRows()).find((d) => d.date === "2026-11-15");
    assert("scan tertunda kini jadi absensi 07:30", day17?.checkIn === "07:30", JSON.stringify(day17));
    await send(glogFrame(devPin, "20261115170000"));
    assert("scan berikutnya lewat ID mesin langsung masuk (pulang 17:00)", (await myRows()).find((d) => d.date === "2026-11-15")?.checkOut === "17:00");
    const raw = await q<{ n: number }>("SELECT COUNT(*) AS n FROM attendance_device_users WHERE user_name LIKE ? OR user_name LIKE ?", ["%BIN_%", "%enroll%"]);
    assert("tabel user mesin tidak berisi data biometrik", Number(raw[0]?.n ?? 0) === 0);

    /* --- antrean perintah server → mesin --- */
    const q1 = await app.inject({ method: "POST", url: `/api/attendance/devices/${dev}/commands`, headers: hr, payload: { cmd: "GET_USER_ID_LIST", param: null } });
    const cmdId = (q1.json() as { data: { id: string } }).data.id;
    assert("direktur mengantrekan perintah → 201", q1.statusCode === 201 && /^CMD/.test(cmdId), q1.body);
    const poll = await (async () => { const b = fkBody(cmdFrame("20261115080000").json); return app.inject({ method: "POST", url: "/fkweb", payload: b, headers: fkHeaders(dev, cmdFrame("x"), b.length) }); })();
    assert("receive_cmd → perintah dikirim (trans_id = id, cmd_code)", poll.headers.response_code === "OK" && poll.headers.trans_id === cmdId && poll.headers.cmd_code === "GET_USER_ID_LIST", JSON.stringify(poll.headers));
    const again2 = await send(cmdFrame("20261115080020"));
    assert("perintah tidak dikirim dua kali", again2.rc === "ERROR_NO_CMD");
    const resBody = fkBody({ user_id_array: [{ user_id: "12", user_name: "Siti" }], enroll_data: "BIN_9" });
    const resp = await app.inject({ method: "POST", url: "/fkweb", payload: resBody, headers: { ...fkHeaders(dev, { code: "send_cmd_result", trans: cmdId, json: {} }, resBody.length), cmd_return_code: "OK" } });
    assert("hasil perintah diterima → OK", resp.statusCode === 200 && resp.headers.response_code === "OK");
    const hist = await app.inject({ method: "GET", url: `/api/attendance/devices/${dev}/commands`, headers: hr });
    const c0 = (hist.json() as { data: { commands: Array<{ id: string; status: string; result: unknown }> } }).data.commands.find((c) => c.id === cmdId);
    assert("riwayat: status done, hasil tersimpan tanpa biometrik", c0?.status === "done" && JSON.stringify(c0.result).includes("Siti") && !JSON.stringify(c0.result).includes("BIN_9"), JSON.stringify(c0));
    const siti = await q<{ user_name: string }>("SELECT user_name FROM attendance_device_users WHERE device_id = ? AND user_id = ?", [dev, "12"]);
    assert("user dari hasil perintah ikut tercatat (ID 12 Siti)", siti[0]?.user_name === "Siti");
    const q2 = await app.inject({ method: "POST", url: `/api/attendance/devices/${dev}/commands`, headers: hr, payload: { cmd: "RESET_FK" } });
    const c2 = (q2.json() as { data: { id: string } }).data.id;
    const cancel = await app.inject({ method: "DELETE", url: `/api/attendance/devices/${dev}/commands/${c2}`, headers: hr });
    assert("perintah yang belum terkirim bisa dibatalkan", cancel.statusCode === 200 && (await send(cmdFrame("20261115080040"))).rc === "ERROR_NO_CMD");
    assert("kode perintah tidak sah → 400", (await app.inject({ method: "POST", url: `/api/attendance/devices/${dev}/commands`, headers: hr, payload: { cmd: "rm -rf" } })).statusCode === 400);
    assert("alat belum terdaftar → 404", (await app.inject({ method: "POST", url: "/api/attendance/devices/TIDAK-ADA/commands", headers: hr, payload: { cmd: "RESET_FK" } })).statusCode === 404);
    const gudang = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ? LIMIT 1", ["gudang"]))[0];
    if (gudang) {
      const gh = { authorization: `Bearer ${signToken({ id: gudang.id, username: gudang.username, role: gudang.role, branch: "Samarinda", v: gudang.token_version ?? 0 })}` };
      assert("peran tanpa izin HR → 403 di device-users & perintah", (await app.inject({ method: "GET", url: "/api/attendance/device-users", headers: gh })).statusCode === 403 && (await app.inject({ method: "POST", url: `/api/attendance/devices/${dev}/commands`, headers: gh, payload: { cmd: "RESET_FK" } })).statusCode === 403);
    }

    /* --- aksi HR (kode perintah terbukti di mesin asli) --- */
    const act = (payload: Record<string, unknown>) => app.inject({ method: "POST", url: `/api/attendance/devices/${dev}/actions`, headers: hr, payload });
    /** Satu putaran mesin: tanya perintah, lalu kirim jawabannya. */
    const round = async (answer: (code: string, trans: string) => { rc: string; json: Record<string, unknown> | null; tail?: Buffer }) => {
      const b = fkBody(cmdFrame("20261115090000").json);
      const polled = await app.inject({ method: "POST", url: "/fkweb", payload: b, headers: fkHeaders(dev, cmdFrame("x"), b.length) });
      const code = String(polled.headers.cmd_code ?? "");
      const trans = String(polled.headers.trans_id ?? "");
      if (!code) return { code: "", param: null as unknown };
      const pBuf = polled.rawPayload;
      const param = pBuf.length >= 4 ? parseFkBody(pBuf) : null;
      const a = answer(code, trans);
      const body = a.json ? Buffer.concat([fkBody(a.json), a.tail ?? Buffer.alloc(0)]) : Buffer.alloc(0);
      await app.inject({ method: "POST", url: "/fkweb", payload: body, headers: { ...fkHeaders(dev, { code: "send_cmd_result", trans, json: {} }, body.length), cmd_return_code: a.rc } });
      return { code, param };
    };
    const overview = async () => (await app.inject({ method: "GET", url: "/api/attendance/device-users", headers: hr })).json() as { data: { devices: Array<{ deviceId: string; stats: Record<string, unknown> | null }>; users: Array<{ userId: string; userName: string; employee: { id: string } | null }> } };

    assert("aksi status → 201", (await act({ action: "status" })).statusCode === 201);
    const st = await round(() => ({ rc: "OK", json: { user_count: 3, fp_count: 2, face_count: 1, all_log_count: 9 } }));
    const stats = (await overview()).data.devices.find((d) => d.deviceId === dev)?.stats;
    assert("GET_DEVICE_STATUS dikirim & ringkasannya tersimpan", st.code === "GET_DEVICE_STATUS" && stats?.user_count === 3, JSON.stringify(stats));

    await act({ action: "sync_time" });
    const tm = await round(() => ({ rc: "OK", json: null }));
    assert("sinkron jam → SET_TIME {time: 14 digit WITA}", tm.code === "SET_TIME" && /^\d{14}$/.test(String((tm.param as { time?: string } | null)?.time ?? "")), JSON.stringify(tm));

    await act({ action: "pull_users" });
    const pl = await round(() => ({ rc: "OK", json: { one_user_id_size: 36, user_id_array: "BIN_1", user_id_count: 2 }, tail: listBlock(["12", "15"]) }));
    const nm = await round((code) => ({ rc: "OK", json: code === "GET_USER_INFO" ? { user_id: "15", user_name: "Rina", enroll_data_array: "BIN_1", user_privilege: "USER" } : null, tail: Buffer.alloc(500) }));
    const after = (await overview()).data.users;
    assert("muat user: ID biner diurai, nama diminta otomatis (hanya yang belum bernama)", pl.code === "GET_USER_ID_LIST" && nm.code === "GET_USER_INFO" && (nm.param as { user_id?: string } | null)?.user_id === "15" && after.find((u) => u.userId === "15")?.userName === "Rina", JSON.stringify(nm));
    assert("muat user menyelaraskan daftar: ID yang tak ada lagi di mesin dibuang", after.find((u) => u.userId === devPin) === undefined || after.find((u) => u.userId === devPin)?.employee !== null, JSON.stringify(after.map((u) => u.userId)));
    const raw12 = await q<{ user_id: string }>("SELECT user_id FROM attendance_device_users WHERE device_id = ?", [dev]);
    assert("tabel user mesin kini hanya ID dari mesin (12, 15)", raw12.map((r) => r.user_id).sort().join() === "12,15", JSON.stringify(raw12));
    assert("tidak ada perintah tersisa setelah muat user", (await send(cmdFrame("20261115090100"))).rc === "ERROR_NO_CMD");

    const emp2 = `EMP-FK2-${stamp}`;
    await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [emp2, "Samarinda", JSON.stringify({ name: "Karyawan Baru Probe Dengan Nama Panjang Sekali", username: `55${Date.now() % 100000}`, status: "Aktif" }), new Date().toISOString()]);
    try {
      const push = await act({ action: "push_employee", employeeId: emp2 });
      assert("daftarkan karyawan → perintah pertama cek ID (GET_USER_INFO)", push.statusCode === 201 && (push.json() as { data: { cmdCode: string } }).data.cmdCode === "GET_USER_INFO", push.body);
      const chk = await round(() => ({ rc: "ERROR_NO_ID", json: null }));
      const set = await round(() => ({ rc: "OK", json: null }));
      const setParam = set.param as { user_id?: string; user_name?: string; enroll_data_array?: unknown[] } | null;
      const emp2Pin = String((JSON.parse((await q<{ data: string }>("SELECT data FROM employees WHERE id = ?", [emp2]))[0]!.data) as { devicePin?: string }).devicePin ?? "");
      assert("ID kosong → SET_USER_INFO (nama ≤ 24 huruf) → karyawan terhubung ke ID itu", chk.code === "GET_USER_INFO" && set.code === "SET_USER_INFO" && (setParam?.user_name ?? "").length <= 24 && emp2Pin !== "" && emp2Pin === setParam?.user_id, JSON.stringify({ set, emp2Pin }));
      const chkRow = ((await app.inject({ method: "GET", url: `/api/attendance/devices/${dev}/commands`, headers: hr })).json() as { data: { commands: Array<{ cmdCode: string; status: string; meta?: { action?: string } }> } }).data.commands.find((c) => c.meta?.action === "push_check");
      assert("cek ID kosong (mesin: ERROR_NO_ID) tercatat selesai, bukan ditolak", chkRow?.status === "done", JSON.stringify(chkRow));
      assert("daftarkan ulang karyawan yang sudah terhubung → 409", (await act({ action: "push_employee", employeeId: emp2 })).statusCode === 409);

      await exec("UPDATE employees SET data = ? WHERE id = ?", [JSON.stringify({ name: "Karyawan Kedua", username: "x", status: "Aktif" }), emp2]);
      await act({ action: "push_employee", employeeId: emp2, userId: "777" });
      const taken = await round(() => ({ rc: "OK", json: { user_id: "777", user_name: "Orang Lain", enroll_data_array: "BIN_1" }, tail: Buffer.alloc(300) }));
      const hist2 = (await app.inject({ method: "GET", url: `/api/attendance/devices/${dev}/commands`, headers: hr })).json() as { data: { commands: Array<{ cmdCode: string; status: string; result: unknown }> } };
      assert("ID sudah dipakai di mesin → dibatalkan (ID_TAKEN), tidak ada SET_USER_INFO", taken.code === "GET_USER_INFO" && hist2.data.commands[0]?.status === "error" && JSON.stringify(hist2.data.commands[0]?.result).includes("ID_TAKEN") && (await send(cmdFrame("20261115090200"))).rc === "ERROR_NO_CMD", JSON.stringify(hist2.data.commands[0]));
      assert("ID yang tercatat dipakai di daftar mesin → 409 langsung", (await act({ action: "push_employee", employeeId: emp2, userId: "15" })).statusCode === 409);

      await linkPin(app, hr, "15", emp2);
      await act({ action: "remove_user", userId: "15" });
      const del = await round(() => ({ rc: "OK", json: null }));
      const left = (await overview()).data.users.find((u) => u.userId === "15");
      const pinNow = String((JSON.parse((await q<{ data: string }>("SELECT data FROM employees WHERE id = ?", [emp2]))[0]!.data) as { devicePin?: string }).devicePin ?? "");
      assert("hapus dari mesin → DELETE_USER, ID dilepas dari karyawan & daftar mesin", del.code === "DELETE_USER" && (del.param as { user_id?: string } | null)?.user_id === "15" && left === undefined && pinNow === "", JSON.stringify({ del, left, pinNow }));
      assert("aksi tak dikenal → 400", (await act({ action: "format_mesin" })).statusCode === 400);
    } finally {
      await exec("DELETE FROM employees WHERE id = ?", [emp2]);
    }

    /* --- log scan mesin --- */
    type LogRow = { deviceId: string; userId: string; status: string; scanAt: string | null; employee: { id: string } | null };
    const logs = async (qs = "") => (await app.inject({ method: "GET", url: `/api/attendance/device-logs?deviceId=${dev}${qs}`, headers: hr })).json() as { data: { total: number; rows: LogRow[]; summary: Record<string, number> } };
    const lg = (await logs()).data;
    const earlyLog = lg.rows.find((r) => r.userId === devPin && r.scanAt === "2026-11-15T07:30:00+08:00");
    assert("log: scan sebelum ID terhubung kini berstatus diproses ulang & menunjuk karyawan", earlyLog?.status === "reprocessed" && earlyLog.employee?.id === empId, JSON.stringify(earlyLog));
    assert("log: PIN tak dikenal berstatus menunggu dihubungkan", lg.rows.some((r) => r.userId === "99999999" && r.status === "pending"));
    assert("log: scan langsung diterima tercatat", lg.rows.some((r) => r.status === "accepted" && r.employee?.id === empId));
    const onlyPending = (await logs("&status=pending")).data;
    assert("log: filter status & ringkasan", onlyPending.rows.every((r) => r.status === "pending") && onlyPending.summary.pending === onlyPending.total && onlyPending.total >= 1);
    assert("log: cari ID mesin", (await logs(`&q=${devPin}`)).data.rows.every((r) => r.userId.includes(devPin)));
    const d16 = (await myRows()).find((d) => d.date === "2026-11-16");
    assert("hitungan scan harian: 3 tap unik (07:58, 12:01, 17:05), kiriman ulang tidak menambah", d16?.scanCount === 3 && JSON.stringify(d16.taps) === JSON.stringify(["07:58", "12:01", "17:05"]), JSON.stringify(d16));
    type KRow = { userId: string; scanAt: string | null; kind: string | null; dayScans: number };
    const kr = ((await app.inject({ method: "GET", url: `/api/attendance/device-logs?deviceId=${dev}&q=${pin}`, headers: hr })).json() as { data: { rows: KRow[] } }).data.rows;
    const kindAt = (t: string) => kr.find((r) => r.scanAt === `2026-11-16T${t}:00+08:00`)?.kind;
    assert("log: jenis scan terdeteksi (masuk 07:58, tambahan 12:01, pulang 17:05) + jumlah scan hari itu", kindAt("07:58") === "in" && kindAt("12:01") === "extra" && kindAt("17:05") === "out" && kr.find((r) => r.scanAt?.startsWith("2026-11-16"))?.dayScans === 3, JSON.stringify(kr.slice(0, 6)));
    type DRow = { date: string; employee: { id: string }; checkIn: string; checkOut: string; netMin: number; taps: string[]; flags: string[] };
    const daily = ((await app.inject({ method: "GET", url: "/api/attendance/device-daily?from=2026-11-16&to=2026-11-16", headers: hr })).json() as { data: { rows: DRow[]; summary: { present: number; review: number } } }).data;
    const mine16 = daily.rows.find((r) => r.employee.id === empId);
    assert("ringkasan harian: 07:58→17:05, bersih 9 j 7 m, 3 scan → tanda tinjau", mine16?.checkIn === "07:58" && mine16.checkOut === "17:05" && mine16.netMin === 547 && mine16.taps.length === 3 && mine16.flags.includes("odd_scans") && daily.summary.present >= 1 && daily.summary.review >= 1, JSON.stringify(mine16));
    assert("log: rentang > 62 hari → 400", (await app.inject({ method: "GET", url: "/api/attendance/device-logs?from=2026-01-01&to=2026-12-31", headers: hr })).statusCode === 400);

    const bad = await app.inject({ method: "POST", url: "/fkweb", payload: Buffer.from("rusak"), headers: fkHeaders(dev, glogFrame(pin, "x"), 5) });
    assert("body rusak → tetap OK (tidak diulang mesin), tidak menulis absensi", bad.statusCode === 200 && String(bad.headers.response_code) === "OK" && (await myRows()).length === 2, `${bad.statusCode}`);
    /* --- aturan penggabungan scan --- */
    await exec("INSERT INTO attendance (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [`ABS-PROBE-${stamp}`, "Samarinda", JSON.stringify({ employeeId: empId, date: "2026-11-14", shift: "Pagi", status: "Izin", overtime: 0 }), new Date().toISOString()]);
    await send(glogFrame(pin, "20261114080000"));
    const izin = (await myRows()).find((d) => d.date === "2026-11-14");
    assert("status Izin dari HR tidak ditimpa scan, jam scan tetap tercatat", izin?.status === "Izin" && izin.checkIn === "08:00", JSON.stringify(izin));
    const before = (await myRows()).length;
    const future = await send(glogFrame(pin, "20300101080000"));
    assert("scan berjam ngawur → OK ke mesin, tidak jadi absensi", future.rc === "OK" && (await myRows()).length === before);
    assert("rute JSON lain tidak terpengaruh parser biner", (await app.inject({ method: "GET", url: "/api/version" })).statusCode === 200);
  } finally {
    const mine = (await q<{ id: string; data: string }>("SELECT id, data FROM attendance", [])).filter((r) => r.data.includes(empId));
    for (const r of mine) await exec("DELETE FROM attendance WHERE id = ?", [r.id]);
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
    await exec("DELETE FROM access_secrets WHERE access_key = ?", [`device:${dev}`]);
    await exec("DELETE FROM attendance_device_users WHERE device_id = ?", [dev]);
    await exec("DELETE FROM attendance_device_status WHERE device_id = ?", [dev]);
    await exec("DELETE FROM attendance_device_commands WHERE device_id = ?", [dev]);
  }
  console.log(`\n${passed}/${total} pemeriksaan Fingerspot FK lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
