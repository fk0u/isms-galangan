/* public-leave-probe.ts — F3-L-06: pengajuan cuti mandiri via QR.
 * ADR-0019: tanpa PIN. Token QR di-hash, kedaluwarsa, dan dicabut saat diganti;
 * pratinjau NIK hanya nama/jabatan/departemen; dokumen pendukung divalidasi;
 * percobaan beruntun dibatasi. */
import fs from "node:fs";
import path from "node:path";
import { buildApp } from "../src/app.js";
import { uploadsRoot } from "../src/routes/files.js";
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
    payload: { token: "x".repeat(48), nik, type: "Izin", from: "2026-11-02", to: "2026-11-03", note: "Keperluan keluarga", ...over },
  });
  // QR yang sedang dipakai karyawan tidak boleh ikut berganti karena probe ini.
  const qrAsli = (await q<{ value: string }>("SELECT value FROM access_secrets WHERE access_key = ?", ["qr:token"]))[0]?.value ?? null;
  let berkas = "";
  try {
    const mech = await app.inject({ method: "GET", url: "/api/leave-qr", headers: { authorization: `Bearer ${await tokenFor("mekanik")}` } });
    assert("peran lapangan tidak bisa melihat status QR", mech.statusCode === 403, String(mech.statusCode));
    const made = await app.inject({ method: "POST", url: "/api/leave-qr/rotate", headers: hr });
    const qr = (made.json() as { data: { token: string; createdBy: string; expiresAt: string } }).data;
    const token = qr.token;
    assert("HR membuat QR: token + pembuat + kedaluwarsa", made.statusCode === 200 && token.length >= 32 && qr.createdBy !== "" && Date.parse(qr.expiresAt) > Date.now(), made.body);
    const ttlDays = (Date.parse(qr.expiresAt) - Date.now()) / 86_400_000;
    assert("QR berlaku 1 tahun (K17-HR-01)", ttlDays > 364 && ttlDays <= 365, `sisa ${ttlDays.toFixed(1)} hari`);
    const stored = (await q<{ value: string }>("SELECT value FROM access_secrets WHERE access_key = ?", ["qr:token"]))[0]?.value ?? "";
    assert("token disimpan sebagai hash, bukan teks asli", !stored.includes(token) && stored.includes("hash"), "");
    const status = await app.inject({ method: "GET", url: "/api/leave-qr", headers: hr });
    assert("status QR tidak mengembalikan token", status.statusCode === 200 && !status.body.includes(token) && status.body.includes("expiresAt"), status.body);

    const check = (payload: Record<string, unknown>, ip = "10.8.0.1") => app.inject({ method: "POST", url: "/api/public/leave/check", remoteAddress: ip, payload });
    assert("cek tautan aktif → 200", (await check({ token })).statusCode === 200);
    const known = await check({ token, nik });
    assert("NIK cocok → hanya nama, jabatan, departemen", Object.keys((known.json() as { data: { employee: object } }).data.employee).sort().join() === "dept,name,role", known.body);
    const unknown = await check({ token, nik: "tidak-ada" });
    assert("NIK tak dikenal → 200 tanpa data", unknown.statusCode === 200 && (unknown.json() as { data: { employee: unknown } }).data.employee === null, unknown.body);
    assert("cek dengan token salah → 404", (await check({ token: "x".repeat(48), nik })).statusCode === 404);

    const wrongToken = await submit({}, "10.9.0.1");
    assert("token QR salah → 404", wrongToken.statusCode === 404, wrongToken.body);
    const wrongNik = await submit({ token, nik: "tidak-ada" }, "10.9.0.3");
    assert("NIK tak dikenal → 401 tanpa baris baru", wrongNik.statusCode === 401, wrongNik.body);
    const backwards = await submit({ token, from: "2026-11-05", to: "2026-11-01" }, "10.9.0.4");
    assert("tanggal terbalik → 400", backwards.statusCode === 400, backwards.body);
    const exe = await submit({ token, attachment: { name: "surat.pdf", data: Buffer.from("MZ bukan pdf").toString("base64") } }, "10.9.0.7");
    assert("dokumen palsu berekstensi .pdf → 400", exe.statusCode === 400, exe.body);
    const badExt = await submit({ token, attachment: { name: "surat.exe", data: "AAAA" } }, "10.9.0.8");
    assert("jenis dokumen tak diizinkan → 400", badExt.statusCode === 400, badExt.body);
    const before = (await q<{ n: number }>("SELECT COUNT(*) AS n FROM leaves WHERE data LIKE ?", [`%${empId}%`]))[0]!.n;
    assert("pengajuan yang ditolak tidak meninggalkan baris", before === 0, String(before));

    const pdf = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF").toString("base64");
    const good = await submit({ token, attachment: { name: "surat-dokter.pdf", data: pdf } }, "10.9.0.5");
    const id = (good.json() as { data?: { id?: string } }).data?.id ?? "";
    const row = id ? (await q<{ data: string; branch: string }>("SELECT data, branch FROM leaves WHERE id = ?", [id]))[0] : undefined;
    const d = row ? JSON.parse(row.data) as Record<string, unknown> : {};
    assert("NIK benar tanpa PIN → 201 dan baris leaves Diajukan", good.statusCode === 201 && d.status === "Diajukan" && d.employeeId === empId && d.days === 2 && d.source === "QR" && row?.branch === "Samarinda", good.body);
    berkas = String(d.fileUrl ?? "");
    assert("dokumen pendukung tertaut ke pengajuan", /^\/files\/\d{4}-\d{2}\/[0-9a-f]+\.pdf$/.test(String(d.fileUrl ?? "")), String(d.fileUrl));
    assert("dokumen hanya bisa dibuka dengan login", (await app.inject({ method: "GET", url: String(d.fileUrl) })).statusCode === 401 && (await app.inject({ method: "GET", url: String(d.fileUrl), headers: hr })).statusCode === 200);
    assert("respons publik hanya berisi nomor & status", Object.keys((good.json() as { data: object }).data).sort().join() === "id,status", good.body);

    // Rate limit per IP: 10 percobaan / 10 menit.
    let limited = 0;
    for (let i = 0; i < 12; i += 1) if ((await submit({ token, nik: `acak-${i}` }, "10.9.9.9")).statusCode === 429) limited += 1;
    assert("percobaan beruntun dari satu IP dibatasi (429)", limited >= 2, String(limited));

    const rot = await app.inject({ method: "POST", url: "/api/leave-qr/rotate", headers: hr });
    const after = await submit({ token }, "10.9.0.6");
    assert("setelah QR baru dibuat, QR lama ditolak", rot.statusCode === 200 && after.statusCode === 404 && (await check({ token }, "10.8.0.2")).statusCode === 404, after.body);
    const kept = id ? (await q<{ id: string }>("SELECT id FROM leaves WHERE id = ?", [id])).length : 0;
    assert("pengajuan lama tidak berubah saat QR diganti", kept === 1);
    const exp = JSON.parse((await q<{ value: string }>("SELECT value FROM access_secrets WHERE access_key = ?", ["qr:token"]))[0]!.value) as Record<string, string>;
    await exec("UPDATE access_secrets SET value = ? WHERE access_key = ?", [JSON.stringify({ ...exp, expiresAt: "2020-01-01T00:00:00.000Z" }), "qr:token"]);
    const newest = (rot.json() as { data: { token: string } }).data.token;
    assert("token kedaluwarsa ditolak", (await check({ token: newest }, "10.8.0.3")).statusCode === 404);
    await exec("UPDATE access_secrets SET value = ? WHERE access_key = ?", [JSON.stringify(exp), "qr:token"]);
    if (id) await exec("DELETE FROM leaves WHERE id = ?", [id]);
  } finally {
    if (qrAsli === null) await exec("DELETE FROM access_secrets WHERE access_key = ?", ["qr:token"]);
    else await exec("UPDATE access_secrets SET value = ? WHERE access_key = ?", [qrAsli, "qr:token"]);
    if (berkas.startsWith("/files/")) fs.rmSync(path.join(uploadsRoot(), berkas.slice("/files/".length)), { force: true });
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
    await exec("DELETE FROM access_secrets WHERE access_key = ?", [`pin:${empId}`]);
  }
  console.log(`\n${passed}/${total} pemeriksaan cuti publik lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
