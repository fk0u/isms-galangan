/* inventory-issue-probe.ts — F3-G-03: barang keluar eceran (kemasan terbuka)
 * dan potongan plat divalidasi server dalam satuan dasar. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Inventory Issue Probe (F3-G-03) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1"))[0];
  const tok = signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  const tag = Date.now().toString(36).toUpperCase();
  const drum = `STK-DRUM${tag}`;
  const plat = `STK-PLAT${tag}`;
  const now = new Date().toISOString();
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [drum, "Samarinda", JSON.stringify({ name: "Probe Cat", unit: "drum", stock: 3, conversion: { baseUnit: "liter", perUnit: 200 } }), now]);
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [plat, "Samarinda", JSON.stringify({ name: "Probe Plat", unit: "lembar", stock: 2, conversion: { baseUnit: "kg", perUnit: 848, dims: { lengthMm: 6000, widthMm: 1500, thicknessMm: 12, weightKg: 848 } } }), now]);
  const issue = (id: string, body: Record<string, unknown>) => app.inject({ method: "POST", url: `/api/inventory/${id}/issue`, headers: { authorization: `Bearer ${tok}` }, payload: body });
  const stateOf = async (id: string) => JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [id]))[0].data) as { stock: number; openBase?: number };
  try {
    const a = await issue(drum, { qty: 50, note: "Cat lambung" });
    const s1 = await stateOf(drum);
    assert("keluar 50 L → 2 drum utuh + 150 L terbuka", a.statusCode === 200 && s1.stock === 2 && s1.openBase === 150, a.body);
    const b = await issue(drum, { qty: 600, note: "terlalu banyak" });
    assert("melebihi 550 L → 409", b.statusCode === 409, b.body);
    const c = await issue(plat, { cut: { lengthMm: 1500, widthMm: 750 }, note: "Potongan bracket" });
    const s2 = await stateOf(plat);
    assert("potongan 1500×750 = 106 kg, buka 1 lembar", c.statusCode === 200 && (c.json().data as { baseQty: number }).baseQty === 106 && s2.stock === 1 && s2.openBase === 742, c.body);
    const d = await issue(plat, { cut: { lengthMm: 7000, widthMm: 100 }, note: "x" });
    assert("potongan lebih besar dari lembar → 422", d.statusCode === 422, d.body);
    const e = await issue(drum, { qty: 10, note: "" });
    assert("tanpa catatan → 400", e.statusCode === 400, e.body);
  } finally {
    await exec("DELETE FROM movements WHERE data LIKE ? OR data LIKE ?", [`%${drum}%`, `%${plat}%`]);
    await exec("DELETE FROM audit_log WHERE row_id IN (?, ?)", [drum, plat]);
    await exec("DELETE FROM inventory WHERE id IN (?, ?)", [drum, plat]);
  }
  console.log(`\n${passed}/${total} pemeriksaan barang keluar lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => { console.error(err); process.exitCode = 1; await closeDb(); });
