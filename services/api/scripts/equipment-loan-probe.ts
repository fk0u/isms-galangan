/* equipment-loan-probe.ts — F3-H-03: peminjaman equipment yang bertumpang
 * tanggalnya ditolak server (409); setelah dikembalikan boleh dipinjam lagi. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Equipment Loan Probe (F3-H-03) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1"))[0];
  const tok = signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  const equipId = `EQ-PROBE-${Date.now().toString(36).toUpperCase()}`;
  await exec("INSERT INTO equipment (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [equipId, "Samarinda", JSON.stringify({ name: "Probe Crane", status: "Tersedia" }), new Date().toISOString()]);
  const created: string[] = [];
  const loan = async (startDate: string, endDate: string) => {
    const res = await app.inject({ method: "POST", url: "/api/bookings", headers: { authorization: `Bearer ${tok}` }, payload: { data: { kind: "Peminjaman", equipId, equip: "Probe Crane", borrower: "Probe", startDate, endDate, date: startDate, status: "Dipinjam" } } });
    if (res.statusCode === 201) created.push((res.json().data as { id: string }).id);
    return res;
  };
  try {
    const a = await loan("2026-11-01", "2026-11-10");
    assert("peminjaman pertama → 201", a.statusCode === 201, a.body);
    const b = await loan("2026-11-05", "2026-11-12");
    assert("rentang bertumpang → 409", b.statusCode === 409, b.body);
    const c = await loan("2026-11-10", "2026-11-11");
    assert("menyentuh hari terakhir → 409", c.statusCode === 409, c.body);
    const d = await loan("2026-11-11", "2026-11-15");
    assert("setelah rentang selesai → 201", d.statusCode === 201, d.body);
    const bad = await loan("2026-12-10", "2026-12-01");
    assert("selesai sebelum mulai → 409", bad.statusCode === 409, bad.body);
    const ret = await app.inject({ method: "PATCH", url: `/api/bookings/${created[0]}`, headers: { authorization: `Bearer ${tok}` }, payload: { data: { status: "Selesai", conditionIn: "Baik" } } });
    assert("pengembalian → 200", ret.statusCode === 200, ret.body);
    const e = await loan("2026-11-02", "2026-11-04");
    assert("setelah dikembalikan boleh dipinjam di rentang itu → 201", e.statusCode === 201, e.body);
  } finally {
    for (const id of created) { await exec("DELETE FROM bookings WHERE id = ?", [id]); await exec("DELETE FROM audit_log WHERE row_id = ?", [id]); }
    await exec("DELETE FROM equipment WHERE id = ?", [equipId]);
  }
  console.log(`\n${passed}/${total} pemeriksaan peminjaman equipment lolos.`);
  await app.close();
  await closeDb();
}
main().catch(async (err) => { console.error(err); process.exitCode = 1; await closeDb(); });
