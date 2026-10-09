/* material-flow-probe.ts — alur material proyek (F3-D-01 / F3-D-03, ADR-0007):
 * stok cukup → barang keluar; stok kurang → keluar sebagian + PR; stok habis →
 * PR penuh; stok tidak pernah negatif; sparepart tercatat; izin & validasi. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Material Flow Probe (F3-D-01) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenFor = async (role: string): Promise<string | null> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>(
      "SELECT id, username, role, token_version FROM users WHERE role = ? LIMIT 1", [role],
    ))[0];
    return u ? signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 }) : null;
  };
  const dir = await tokenFor("direktur");
  if (!dir) throw new Error("Butuh akun direktur hasil seed (npm run seed)");
  const project = (await q<{ id: string }>("SELECT id FROM projects LIMIT 1"))[0];
  if (!project) throw new Error("Butuh minimal satu proyek hasil seed");

  const itemId = `STK-PROBE${Date.now().toString(36).toUpperCase()}`;
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    itemId, "Samarinda", JSON.stringify({ name: "Probe Bearing", unit: "pcs", stock: 5, price: 250000, category: "Mechanical" }), new Date().toISOString(),
  ]);
  const stockOf = async (): Promise<number> => {
    const r = (await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [itemId]))[0];
    return Number((JSON.parse(r?.data ?? "{}") as { stock?: number }).stock ?? NaN);
  };
  const call = (token: string, payload: unknown) => app.inject({
    method: "POST", url: `/api/projects/${project.id}/material-requests`,
    headers: { authorization: `Bearer ${token}` }, payload: payload as Record<string, unknown>,
  });

  const r1 = await call(dir, { itemId, qty: 3, purpose: "wbs", wbsTask: "Probe WBS" });
  const d1 = r1.json().data as { issued: number; shortage: number; status: string; movementId: string | null; requisitionId: string | null };
  assert("stok cukup → keluar penuh, tanpa PR", r1.statusCode === 201 && d1.issued === 3 && d1.shortage === 0 && d1.status === "Dari stok" && !!d1.movementId && d1.requisitionId === null, r1.body);
  assert("stok berkurang 5 → 2", (await stockOf()) === 2);

  const r2 = await call(dir, { itemId, qty: 4, purpose: "sparepart" });
  const d2 = r2.json().data as { issued: number; shortage: number; status: string; requisitionId: string | null; sparepartId: string | null };
  assert("stok kurang → keluar 2 + PR 2 (Sebagian)", r2.statusCode === 201 && d2.issued === 2 && d2.shortage === 2 && d2.status === "Sebagian" && !!d2.requisitionId, r2.body);
  assert("stok tidak negatif (0)", (await stockOf()) === 0);
  const pr = (await q<{ data: string }>("SELECT data FROM requisitions WHERE id = ?", [d2.requisitionId ?? ""]))[0];
  assert("PR tercatat qty 2 status Diajukan", !!pr && (JSON.parse(pr.data) as { qty: number; status: string }).qty === 2 && (JSON.parse(pr.data) as { status: string }).status === "Diajukan");
  const sp = (await q<{ data: string }>("SELECT data FROM spareparts WHERE id = ?", [d2.sparepartId ?? ""]))[0];
  assert("sparepart tercatat dengan status pemenuhan", !!sp && (JSON.parse(sp.data) as { fulfillment?: { status: string } }).fulfillment?.status === "Sebagian");

  const r3 = await call(dir, { itemId, qty: 1, purpose: "wbs" });
  const d3 = r3.json().data as { issued: number; shortage: number; status: string; movementId: string | null };
  assert("stok habis → PR penuh (Menunggu PO), tanpa movement", r3.statusCode === 201 && d3.issued === 0 && d3.shortage === 1 && d3.status === "Menunggu PO" && d3.movementId === null, r3.body);

  const bad = await call(dir, { itemId, qty: 0 });
  assert("qty 0 → 400", bad.statusCode === 400, bad.body);
  const missing = await call(dir, { itemId: "STK-TIDAK-ADA", qty: 1 });
  assert("item tidak ada → 404", missing.statusCode === 404, missing.body);

  const viewer = await tokenFor("viewer");
  if (viewer) {
    const denied = await call(viewer, { itemId, qty: 1 });
    assert("viewer tidak boleh meminta barang → 403", denied.statusCode === 403, denied.body);
  }

  // Bersihkan data uji.
  await exec("DELETE FROM movements WHERE data LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM requisitions WHERE data LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM spareparts WHERE data LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM inventory WHERE id = ?", [itemId]);

  console.log(`\n${passed}/${total} pemeriksaan alur material lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
