/* public-leave-probe.ts — F3-L-06: pengajuan cuti mandiri via QR.
 * Token salah, NIK tak dikenal, PIN salah → ditolak dengan jawaban yang sama;
 * PIN benar → 1 baris leaves "Diajukan"; hash PIN tidak bocor lewat CRUD;
 * percobaan beruntun dibatasi. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Public Leave Probe (F3-L-06) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenFor = async (role: string): Promise<string> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ? AND is_active = 1 LIMIT 1", [role]))[0];
    return signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  };
  const empId = `EMP-QR-${Date.now().toString(36).toUpperCase()}`;
  const nik = `99${Date.now()}`;
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empId, "Samarinda", JSON.stringify({ name: "Probe Karyawan", username: nik, status: "Aktif" }), new Date().toISOString()]);
  const hr = { authorization: `Bearer ${await tokenFor("direktur")}` };
  const submit = (over: Record<string, unknown>, ip: string) => app.inject({
    method: "POST", url: "/api/public/leave", remoteAddress: ip,
    payload: { token: "x".repeat(48), nik, pin: "123456", type: "Izin", from: "2026-11-02", to: "2026-11-03", note: "Keperluan keluarga", ...over },
  });
  try {
    const qr = await app.inject({ method: "GET", url: "/api/leave-qr", headers: hr });
    const token = (qr.json() as { data: { token: string } }).data.token;
    assert("HR mendapat token QR", qr.statusCode === 200 && token.length >= 32, qr.body);
    const mech = await app.inject({ method: "GET", url: "/api/leave-qr", headers: { authorization: `Bearer ${await tokenFor("mekanik")}` } });
    assert("peran lapangan tidak bisa mengambil token QR", mech.statusCode === 403, String(mech.statusCode));
    const setPin = await app.inject({ method: "POST", url: `/api/employees/${empId}/leave-pin`, headers: hr, payload: { pin: "246810" } });
    assert("HR mengatur PIN (tidak dikembalikan)", setPin.statusCode === 200 && !setPin.body.includes("246810"), setPin.body);
    const badPin = await app.inject({ method: "POST", url: `/api/employees/${empId}/leave-pin`, headers: hr, payload: { pin: "12ab" } });
    assert("PIN bukan 6 angka → 400", badPin.statusCode === 400, String(badPin.statusCode));

    const wrongToken = await submit({ pin: "246810" }, "10.9.0.1");
    assert("token QR salah → 404", wrongToken.statusCode === 404, wrongToken.body);
    const wrongPin = await submit({ token, pin: "000000" }, "10.9.0.2");
    const wrongNik = await submit({ token, nik: "tidak-ada", pin: "246810" }, "10.9.0.3");
    assert("PIN salah → 401", wrongPin.statusCode === 401, wrongPin.body);
    assert("NIK tak dikenal → jawaban identik dengan PIN salah", wrongNik.statusCode === 401 && wrongNik.body === wrongPin.body, wrongNik.body);
    const backwards = await submit({ token, pin: "246810", from: "2026-11-05", to: "2026-11-01" }, "10.9.0.4");
    assert("tanggal terbalik → 400", backwards.statusCode === 400, backwards.body);

    const good = await submit({ token, pin: "246810" }, "10.9.0.5");
    const id = (good.json() as { data?: { id?: string } }).data?.id ?? "";
    const row = id ? (await q<{ data: string; branch: string }>("SELECT data, branch FROM leaves WHERE id = ?", [id]))[0] : undefined;
    const d = row ? JSON.parse(row.data) as Record<string, unknown> : {};
    assert("NIK + PIN benar → 201 dan baris leaves Diajukan", good.statusCode === 201 && d.status === "Diajukan" && d.employeeId === empId && d.days === 2 && d.source === "QR" && row?.branch === "Samarinda", good.body);
    assert("respons publik hanya berisi nomor & status", Object.keys((good.json() as { data: object }).data).sort().join() === "id,status", good.body);
    const list = await app.inject({ method: "GET", url: `/api/employees/${empId}`, headers: hr });
    assert("hash PIN tidak ikut di /api/employees", !/\$2[aby]\$/.test(list.body) && !list.body.includes("pin"), "");

    // Rate limit per IP: 10 percobaan / 10 menit.
    let limited = 0;
    for (let i = 0; i < 12; i += 1) if ((await submit({ token, nik: `acak-${i}`, pin: "000000" }, "10.9.9.9")).statusCode === 429) limited += 1;
    assert("percobaan beruntun dari satu IP dibatasi (429)", limited >= 2, String(limited));

    const rot = await app.inject({ method: "POST", url: "/api/leave-qr/rotate", headers: hr });
    const after = await submit({ token, pin: "246810" }, "10.9.0.6");
    assert("setelah token diganti, QR lama tidak berlaku", rot.statusCode === 200 && after.statusCode === 404, after.body);
    if (id) await exec("DELETE FROM leaves WHERE id = ?", [id]);
  } finally {
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
    await exec("DELETE FROM access_secrets WHERE access_key = ?", [`pin:${empId}`]);
  }
  console.log(`\n${passed}/${total} pemeriksaan cuti publik lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
