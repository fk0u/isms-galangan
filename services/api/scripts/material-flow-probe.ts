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
  // Viewer wajib ada di seed (dicek sebelum fixture dibuat): tanpa itu aturan 403 tidak teruji.
  const viewer = await tokenFor("viewer");
  if (!viewer) throw new Error("Butuh akun viewer hasil seed (npm run seed)");
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

  /* ADR-0018 (issue #73): permintaan tidak memotong stok; gudang yang memutuskan. */
  const decide = (token: string, id: string, payload: unknown) => app.inject({
    method: "POST", url: `/api/material-requests/${id}/approval`, headers: { authorization: `Bearer ${token}` }, payload: payload as Record<string, unknown>,
  });
  const mrOf = async (id: string) => {
    const r = (await q<{ data: string }>("SELECT data FROM materialRequests WHERE id = ?", [id]))[0];
    return r ? (JSON.parse(r.data) as { status: string; issued: number; shortage: number; approvalStatus?: string; rejectReason?: string }) : null;
  };
  const movementCount = async (): Promise<number> => (await q<{ id: string }>("SELECT id FROM movements WHERE data LIKE ?", [`%${itemId}%`])).length;
  const mekanik = await tokenFor("mekanik");
  if (!mekanik) throw new Error("Butuh akun mekanik hasil seed");

  const r1 = await call(dir, { itemId, qty: 3, purpose: "wbs", wbsTask: "Probe WBS" });
  const d1 = r1.json().data as { issued: number; shortage: number; status: string; movementId: string | null; requisitionId: string | null; materialRequestId: string };
  assert("stok cukup → permintaan tercatat TANPA barang keluar dan tanpa PR", r1.statusCode === 201 && d1.issued === 0 && d1.movementId === null && d1.requisitionId === null, r1.body);
  assert("stok tetap 5 sebelum disetujui", (await stockOf()) === 5 && (await movementCount()) === 0);
  assert("status Menunggu Approval Gudang", (await mrOf(d1.materialRequestId))?.status === "Menunggu Approval Gudang");
  const byMek = await decide(mekanik, d1.materialRequestId, { decision: "approve" });
  assert("peminta (mekanik) tidak boleh menyetujui → 403", byMek.statusCode === 403, byMek.body);
  const early = await app.inject({ method: "POST", url: `/api/material-requests/${d1.materialRequestId}/fulfill`, headers: { authorization: `Bearer ${dir}` } });
  assert("fulfill sebelum disetujui → 409", early.statusCode === 409 && (await stockOf()) === 5, early.body);
  const ok1 = await decide(dir, d1.materialRequestId, { decision: "approve" });
  const mr1 = await mrOf(d1.materialRequestId);
  assert("disetujui → barang keluar 3, stok 5 → 2, Dipenuhi dari stok", ok1.statusCode === 200 && (await stockOf()) === 2 && mr1?.status === "Dipenuhi dari stok" && mr1.shortage === 0 && (await movementCount()) === 1, ok1.body);
  const twice = await decide(dir, d1.materialRequestId, { decision: "approve" });
  assert("keputusan kedua → 409", twice.statusCode === 409, twice.body);

  const rRej = await call(dir, { itemId, qty: 1, purpose: "wbs" });
  const rejId = (rRej.json().data as { materialRequestId: string }).materialRequestId;
  const noReason = await decide(dir, rejId, { decision: "reject" });
  assert("tolak tanpa alasan → 422", noReason.statusCode === 422, noReason.body);
  const rej = await decide(dir, rejId, { decision: "reject", note: "Barang dicadangkan untuk proyek lain" });
  const mrRej = await mrOf(rejId);
  assert("ditolak → alasan tersimpan, tanpa pergerakan stok", rej.statusCode === 200 && mrRej?.status === "Ditolak Gudang" && mrRej.rejectReason === "Barang dicadangkan untuk proyek lain" && (await stockOf()) === 2 && (await movementCount()) === 1, rej.body);
  const afterRej = await app.inject({ method: "POST", url: `/api/material-requests/${rejId}/fulfill`, headers: { authorization: `Bearer ${dir}` } });
  assert("fulfill permintaan yang ditolak → 409", afterRej.statusCode === 409, afterRej.body);

  const r2 = await call(dir, { itemId, qty: 4, purpose: "sparepart" });
  const d2 = r2.json().data as { issued: number; shortage: number; status: string; requisitionId: string | null; sparepartId: string | null; materialRequestId: string };
  assert("stok kurang (2 dari 4) → PR untuk 2, belum ada barang keluar", r2.statusCode === 201 && d2.issued === 0 && d2.status === "Menunggu PO" && !!d2.requisitionId && (await stockOf()) === 2, r2.body);
  const pr = (await q<{ data: string }>("SELECT data FROM requisitions WHERE id = ?", [d2.requisitionId ?? ""]))[0];
  assert("PR tercatat qty 2 status Diajukan", !!pr && (JSON.parse(pr.data) as { qty: number; status: string }).qty === 2 && (JSON.parse(pr.data) as { status: string }).status === "Diajukan");
  const mr2Id = d2.materialRequestId;
  const prSrc = JSON.parse(pr?.data ?? "{}") as { sourceRequestIds?: string[] };
  assert("PR menyimpan sourceRequestIds", prSrc.sourceRequestIds?.[0] === mr2Id);
  const ok2 = await decide(dir, mr2Id, { decision: "approve" });
  const mr2 = await mrOf(mr2Id);
  assert("disetujui → keluar 2 yang ada, stok 0, Sebagian diterima", ok2.statusCode === 200 && (await stockOf()) === 0 && mr2?.status === "Sebagian diterima" && mr2.shortage === 2, ok2.body);
  const sp = (await q<{ data: string }>("SELECT data FROM spareparts WHERE id = ?", [d2.sparepartId ?? ""]))[0];
  assert("sparepart tercatat dengan status pemenuhan", !!sp && (JSON.parse(sp.data) as { fulfillment?: { status: string } }).fulfillment?.status === "Sebagian");

  const fulfill = (token: string, id: string) => app.inject({ method: "POST", url: `/api/material-requests/${id}/fulfill`, headers: { authorization: `Bearer ${token}` } });
  const fNone = await fulfill(dir, mr2Id);
  assert("penuhi saat stok 0 → 409", fNone.statusCode === 409, fNone.body);
  // Barang PO masuk gudang: stok 5.
  await exec("UPDATE inventory SET data = json_set(data, '$.stock', 5) WHERE id = ?", [itemId]);
  const fOk = await fulfill(dir, mr2Id);
  const mr2b = await mrOf(mr2Id);
  assert("penuhi sisa dari stok → Selesai, stok 5 → 3", fOk.statusCode === 200 && mr2b?.status === "Selesai" && mr2b.shortage === 0 && (await stockOf()) === 3, fOk.body);
  const spAfter = (await q<{ data: string }>("SELECT data FROM spareparts WHERE id = ?", [d2.sparepartId ?? ""]))[0];
  assert("sparepart ikut terpenuhi", (JSON.parse(spAfter?.data ?? "{}") as { fulfillment?: { shortage: number } }).fulfillment?.shortage === 0);
  const prAfter = (await q<{ data: string }>("SELECT data FROM requisitions WHERE id = ?", [d2.requisitionId ?? ""]))[0];
  assert("PR sumber dibatalkan setelah dipenuhi dari stok", (JSON.parse(prAfter?.data ?? "{}") as { status?: string }).status === "Dibatalkan");
  const fAgain = await fulfill(dir, mr2Id);
  assert("penuhi ulang yang sudah selesai → 409", fAgain.statusCode === 409, fAgain.body);
  const crudMr = await app.inject({ method: "POST", url: "/api/materialRequests", headers: { authorization: `Bearer ${dir}` }, payload: { data: { projectId: project.id, itemId } } });
  assert("buat permintaan lewat CRUD → 422", crudMr.statusCode === 422, crudMr.body);
  const delMr = await app.inject({ method: "DELETE", url: `/api/materialRequests/${mr2Id}`, headers: { authorization: `Bearer ${dir}` } });
  assert("hapus permintaan lewat CRUD → 409", delMr.statusCode === 409, delMr.body);
  const proyek = await tokenFor("proyek");
  if (!proyek) throw new Error("Butuh akun proyek hasil seed");
  const wbsByProyek = await call(proyek, { itemId, qty: 1, purpose: "wbs" });
  assert("peran proyek meminta material WBS → 403", wbsByProyek.statusCode === 403, wbsByProyek.body);
  await exec("UPDATE inventory SET data = json_set(data, '$.stock', 0) WHERE id = ?", [itemId]);

  const r3 = await call(dir, { itemId, qty: 1, purpose: "wbs" });
  const d3 = r3.json().data as { issued: number; shortage: number; status: string; movementId: string | null };
  assert("stok habis → PR penuh (Menunggu PO), tanpa movement", r3.statusCode === 201 && d3.issued === 0 && d3.shortage === 1 && d3.status === "Menunggu PO" && d3.movementId === null, r3.body);

  const bad = await call(dir, { itemId, qty: 0 });
  assert("qty 0 → 400", bad.statusCode === 400, bad.body);
  const missing = await call(dir, { itemId: "STK-TIDAK-ADA", qty: 1 });
  assert("item tidak ada → 404", missing.statusCode === 404, missing.body);

  const denied = await call(viewer, { itemId, qty: 1 });
  assert("viewer tidak boleh meminta barang → 403", denied.statusCode === 403, denied.body);

  // Bersihkan data uji.
  await exec("DELETE FROM movements WHERE data LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM requisitions WHERE data LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM spareparts WHERE data LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM materialRequests WHERE data LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM inventory WHERE id = ?", [itemId]);
  await exec("DELETE FROM audit_log WHERE action = 'material_request' AND diff LIKE ?", [`%${itemId}%`]);
  await exec("DELETE FROM audit_log WHERE action IN ('material_fulfill', 'material_approve', 'material_reject') AND row_id IN (?, ?, ?)", [mr2Id, d1.materialRequestId, rejId]);

  console.log(`\n${passed}/${total} pemeriksaan alur material lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
