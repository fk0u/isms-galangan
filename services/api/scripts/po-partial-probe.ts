/* po-partial-probe.ts — F3-J-02 kriteria: PO 10 unit, vendor A kirim 6, sisa 4
 * dialihkan ke vendor B, permintaan barang proyek selesai setelah B menerima 4. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS PO Partial Probe (F3-J-02) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenFor = async (role: string): Promise<string> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>(
      "SELECT id, username, role, token_version FROM users WHERE role = ? LIMIT 1", [role],
    ))[0];
    if (!u) throw new Error(`Butuh akun ${role} hasil seed (npm run seed)`);
    return signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  };
  const dir = await tokenFor("direktur");
  const viewer = await tokenFor("viewer");
  const project = (await q<{ id: string }>("SELECT id FROM projects LIMIT 1"))[0];
  if (!project) throw new Error("Butuh minimal satu proyek hasil seed");

  const tag = Date.now().toString(36).toUpperCase();
  const itemId = `STK-POP${tag}`;
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    itemId, "Samarinda", JSON.stringify({ name: "Probe Valve", unit: "pcs", stock: 0, cost: 100000 }), new Date().toISOString(),
  ]);
  const poIds: string[] = [];
  let mrId = "";
  let prId = "";
  const auth = (t: string) => ({ authorization: `Bearer ${t}` });
  const post = (t: string, url: string, payload: Record<string, unknown>) => app.inject({ method: "POST", url, headers: auth(t), payload });
  const mrOf = async () => JSON.parse((await q<{ data: string }>("SELECT data FROM materialRequests WHERE id = ?", [mrId]))[0]?.data ?? "{}") as { status: string; issued: number; shortage: number };
  const poOf = async (id: string) => JSON.parse((await q<{ data: string }>("SELECT data FROM purchaseOrders WHERE id = ?", [id]))[0]?.data ?? "{}") as Record<string, unknown>;
  const stock = async () => Number((JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [itemId]))[0]?.data ?? "{}") as { stock: number }).stock);

  try {
    // Proyek minta 10, stok 0 → seluruhnya jadi PR.
    const mr = await post(dir, `/api/projects/${project.id}/material-requests`, { itemId, qty: 10, purpose: "wbs" });
    const mrData = mr.json().data as { materialRequestId: string; requisitionId: string };
    mrId = mrData.materialRequestId;
    prId = mrData.requisitionId;
    assert("permintaan 10 → PR 10 (Menunggu PO)", mr.statusCode === 201 && (await mrOf()).status === "Menunggu PO", mr.body);

    // PO ke vendor A, sudah dikirim.
    const poA = await post(dir, "/api/purchaseOrders", { data: {
      poType: "Besar", item: "Probe Valve", itemId, vendor: "PT Vendor A Probe", req: prId, qty: 10, amount: 1_000_000,
      receivedQty: 0, status: "Dikirim", date: "2026-10-10", project: project.id,
    } });
    const poAId = (poA.json().data as { id: string }).id;
    poIds.push(poAId);

    const over = await post(dir, `/api/purchaseOrders/${poAId}/receive`, { qty: 11 });
    assert("terima melebihi PO → 422", over.statusCode === 422, over.body);
    const deny = await post(viewer, `/api/purchaseOrders/${poAId}/receive`, { qty: 1 });
    assert("viewer menerima barang → 403", deny.statusCode === 403, deny.body);

    const r6 = await post(dir, `/api/purchaseOrders/${poAId}/receive`, { qty: 6 });
    const r6d = r6.json().data as { fulfilled: { id: string }[] };
    const mrAfter6 = await mrOf();
    assert("vendor A kirim 6 → PO Diterima Sebagian", r6.statusCode === 200 && (await poOf(poAId)).status === "Diterima Sebagian", r6.body);
    assert("permintaan otomatis terpenuhi 6 (sisa 4)", r6d.fulfilled.length === 1 && mrAfter6.issued === 6 && mrAfter6.shortage === 4 && mrAfter6.status === "Sebagian diterima", JSON.stringify(mrAfter6));
    assert("stok masuk 6 langsung keluar ke proyek (stok 0)", (await stock()) === 0);

    const otherItem = await post(dir, `/api/purchaseOrders/${poAId}/receive`, { qty: 1, itemId: "INV-001" });
    assert("ganti barang setelah penerimaan pertama → 422", otherItem.statusCode === 422, otherItem.body);
    const blank = await post(dir, `/api/purchaseOrders/${poAId}/vendor-cannot-fulfill`, { qty: 4, reason: "   " });
    assert("alasan kosong → 400/422", blank.statusCode === 400 || blank.statusCode === 422, blank.body);
    const cancel = await post(dir, `/api/purchaseOrders/${poAId}/vendor-cannot-fulfill`, { qty: 4, reason: "Stok vendor habis" });
    assert("vendor A tidak sanggup 4 → Dibatalkan Sebagian", cancel.statusCode === 200 && (await poOf(poAId)).status === "Dibatalkan Sebagian", cancel.body);

    const same = await post(dir, `/api/purchaseOrders/${poAId}/reassign`, { vendor: "PT Vendor A Probe" });
    assert("alihkan ke vendor yang sama → 422", same.statusCode === 422, same.body);
    const re = await post(dir, `/api/purchaseOrders/${poAId}/reassign`, { vendor: "PT Vendor B Probe", unitPrice: 110000 });
    const poBId = re.statusCode === 201 ? (re.json().data as { to: { id: string } }).to.id : "";
    if (poBId) poIds.push(poBId);
    const poB = await poOf(poBId);
    assert("PO baru vendor B qty 4 (Diajukan, PR sama)", re.statusCode === 201 && poB.qty === 4 && poB.status === "Diajukan" && poB.req === prId && poB.amount === 440000, re.body);
    const again = await post(dir, `/api/purchaseOrders/${poAId}/reassign`, { vendor: "PT Vendor C Probe" });
    assert("alihkan ulang tanpa sisa → 409", again.statusCode === 409, again.body);

    const early = await post(dir, `/api/purchaseOrders/${poBId}/receive`, { qty: 4 });
    assert("terima PO yang belum dikirim → 409", early.statusCode === 409, early.body);
    await app.inject({ method: "PATCH", url: `/api/purchaseOrders/${poBId}`, headers: auth(dir), payload: { data: { status: "Dikirim" } } });
    const r4 = await post(dir, `/api/purchaseOrders/${poBId}/receive`, { qty: 4 });
    const mrDone = await mrOf();
    assert("vendor B kirim 4 → PO Diterima", r4.statusCode === 200 && (await poOf(poBId)).status === "Diterima", r4.body);
    assert("permintaan selesai (10 dari 10)", mrDone.status === "Selesai" && mrDone.issued === 10 && mrDone.shortage === 0, JSON.stringify(mrDone));

    // PO konsolidasi (beberapa barang) ditolak; PO lama tanpa qty tetap bisa diterima penuh.
    const multi = await post(dir, "/api/purchaseOrders", { data: {
      poType: "Besar", item: "Campuran", itemId, vendor: "PT Vendor A Probe", qty: 5, amount: 500000, status: "Dikirim", date: "2026-10-10",
      lines: [{ name: "Probe Valve", qty: 3, unit: "pcs", price: 100000 }, { name: "Probe Gasket", qty: 2, unit: "pcs", price: 100000 }],
    } });
    const multiId = (multi.json().data as { id: string }).id;
    poIds.push(multiId);
    const multiRecv = await post(dir, `/api/purchaseOrders/${multiId}/receive`, { qty: 1 });
    assert("PO multi-barang → 422 (tidak mencampur stok)", multiRecv.statusCode === 422, multiRecv.body);
    const legacy = await post(dir, "/api/purchaseOrders", { data: { item: "Probe Valve", itemId, vendor: "PT Vendor A Probe", amount: 300000, status: "Dikirim", date: "2026-10-10" } });
    const legacyId = (legacy.json().data as { id: string }).id;
    poIds.push(legacyId);
    const legacyRecv = await post(dir, `/api/purchaseOrders/${legacyId}/receive`, { qty: 3 });
    assert("PO lama tanpa qty → diterima penuh", legacyRecv.statusCode === 200 && (await poOf(legacyId)).status === "Diterima", legacyRecv.body);
  } finally {
    for (const id of poIds) await exec("DELETE FROM purchaseOrders WHERE id = ?", [id]);
    for (const id of poIds) await exec("DELETE FROM audit_log WHERE row_id = ?", [id]);
    await exec("DELETE FROM movements WHERE data LIKE ?", [`%${itemId}%`]);
    await exec("DELETE FROM materialRequests WHERE data LIKE ?", [`%${itemId}%`]);
    await exec("DELETE FROM requisitions WHERE data LIKE ?", [`%${itemId}%`]);
    if (mrId) await exec("DELETE FROM audit_log WHERE row_id = ?", [mrId]);
    await exec("DELETE FROM audit_log WHERE action = 'material_request' AND diff LIKE ?", [`%${itemId}%`]);
    await exec("DELETE FROM inventory WHERE id = ?", [itemId]);
  }

  console.log(`\n${passed}/${total} pemeriksaan PO sebagian lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
