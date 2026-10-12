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
  const returnItemId = `STK-RET${tag}`;
  const awayReturnItemId = `STK-RETX${tag}`;
  const multiItem1Id = `STK-MI1${tag}`;
  const multiItem2Id = `STK-MI2${tag}`;
  const scopedDirectorId = `probe-return-dir-${tag}`;
  const scopedDirectorEmployeeId = `probe-return-emp-${tag}`;
  const scopedDirectorUsername = `${scopedDirectorId}@galangan.com`;
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    itemId, "Samarinda", JSON.stringify({ name: "Probe Valve", unit: "pcs", stock: 0, cost: 100000 }), new Date().toISOString(),
  ]);
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    multiItem1Id, "Samarinda", JSON.stringify({ name: "Probe Multi Item 1", unit: "pcs", stock: 0, cost: 50000 }), new Date().toISOString(),
  ]);
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    multiItem2Id, "Samarinda", JSON.stringify({ name: "Probe Multi Item 2", unit: "meter", stock: 0, cost: 100000 }), new Date().toISOString(),
  ]);
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    returnItemId, "Samarinda", JSON.stringify({ name: "Probe Return Valve", unit: "pcs", stock: 5, cost: 100000 }), new Date().toISOString(),
  ]);
  await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    awayReturnItemId, "Banjarmasin", JSON.stringify({ name: "Probe Away Return Valve", unit: "pcs", stock: 2, cost: 100000 }), new Date().toISOString(),
  ]);
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    scopedDirectorEmployeeId, "Samarinda", JSON.stringify({ nama: "Probe Return Director" }), new Date().toISOString(),
  ]);
  await exec(
    "INSERT INTO users (id, username, pass_hash, name, role, email, is_active, token_version, employee_id) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)",
    [scopedDirectorId, scopedDirectorUsername, "hash", "Probe Return Director", "direktur", scopedDirectorUsername, scopedDirectorEmployeeId],
  );
  const scopedDirector = signToken({ id: scopedDirectorId, username: scopedDirectorUsername, role: "direktur", branch: "Samarinda", v: 0 });
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
    // ADR-0018: gudang menyetujui dulu; stok masih 0 sehingga permintaan menunggu PO.
    await post(dir, `/api/material-requests/${mrId}/approval`, { decision: "approve" });
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

    // PO konsolidasi tanpa perincian baris ditolak; PO lama tanpa qty tetap bisa diterima penuh.
    const multi = await post(dir, "/api/purchaseOrders", { data: {
      poType: "Besar", item: "Campuran", itemId, vendor: "PT Vendor A Probe", qty: 5, amount: 500000, status: "Dikirim", date: "2026-10-10",
      lines: [{ name: "Probe Valve", qty: 3, unit: "pcs", price: 100000 }, { name: "Probe Gasket", qty: 2, unit: "pcs", price: 100000 }],
    } });
    const multiId = (multi.json().data as { id: string }).id;
    poIds.push(multiId);
    const multiRecv = await post(dir, `/api/purchaseOrders/${multiId}/receive`, { qty: 1 });
    assert("PO multi-barang tanpa baris → 422 (tidak mencampur stok)", multiRecv.statusCode === 422, multiRecv.body);

    // ================= Issue #106: Uji alur proyek vs stok gudang, multi-item, penerimaan per baris, dan pencegahan penerimaan ganda =================
    // 1. Alur proyek vs stok gudang
    const poProjRes = await post(dir, "/api/purchaseOrders", { data: {
      poType: "Besar", tujuan: "kapal", project: project.id, vessel: "TB. PROBE 01", vendor: "PT Vendor A Probe",
      qty: 1, amount: 100000, status: "Draft", date: "2026-10-10", lines: [{ name: "Item Proyek", qty: 1, unit: "pcs", price: 100000 }],
    } });
    const poProjId = (poProjRes.json().data as { id: string }).id;
    poIds.push(poProjId);
    const poProjData = await poOf(poProjId);
    assert("PO tujuan kapal menyimpan project & vessel", poProjData.tujuan === "kapal" && poProjData.project === project.id && poProjData.vessel === "TB. PROBE 01", JSON.stringify(poProjData));

    const poStockRes = await post(dir, "/api/purchaseOrders", { data: {
      poType: "Besar", tujuan: "stok", warehouse: "Gudang Utama", project: "-", vessel: "", vendor: "PT Vendor A Probe",
      qty: 1, amount: 100000, status: "Draft", date: "2026-10-10", lines: [{ name: "Item Stok", qty: 1, unit: "pcs", price: 100000 }],
    } });
    const poStockId = (poStockRes.json().data as { id: string }).id;
    poIds.push(poStockId);
    const poStockData = await poOf(poStockId);
    assert("PO tujuan stok gudang menyimpan warehouse dan project '-'", poStockData.tujuan === "stok" && poStockData.warehouse === "Gudang Utama" && poStockData.project === "-", JSON.stringify(poStockData));

    // 2. PO multi-item & penerimaan per baris
    const poMultiBarisRes = await post(dir, "/api/purchaseOrders", { data: {
      poType: "Besar", vendor: "PT Vendor Multi Probe", qty: 15, amount: 1000000, status: "Dikirim", date: "2026-10-10",
      lines: [
        { name: "Probe Multi Item 1", itemId: multiItem1Id, qty: 10, unit: "pcs", price: 50000, receivedQty: 0 },
        { name: "Probe Multi Item 2", itemId: multiItem2Id, qty: 5, unit: "meter", price: 100000, receivedQty: 0 },
      ],
    } });
    const poMultiBarisId = (poMultiBarisRes.json().data as { id: string }).id;
    poIds.push(poMultiBarisId);

    // Penerimaan baris melebihi sisa baris ditolak 422
    const overLineRecv = await post(dir, `/api/purchaseOrders/${poMultiBarisId}/receive`, {
      lines: [{ itemId: multiItem1Id, qty: 11 }],
    });
    assert("terima baris melebihi sisa item → 422", overLineRecv.statusCode === 422, overLineRecv.body);

    // Penerimaan sebagian per baris (item 1 terima 6, item 2 terima 5)
    const rPartMulti = await post(dir, `/api/purchaseOrders/${poMultiBarisId}/receive`, {
      lines: [
        { itemId: multiItem1Id, qty: 6 },
        { itemId: multiItem2Id, qty: 5 },
      ],
      noFaktur: "010.000-26.00000088",
      tglFaktur: "2026-10-10",
    });
    const poAfterPart = await poOf(poMultiBarisId);
    const stock1AfterPart = Number((JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [multiItem1Id]))[0]?.data ?? "{}") as { stock: number }).stock);
    const stock2AfterPart = Number((JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [multiItem2Id]))[0]?.data ?? "{}") as { stock: number }).stock);
    assert("penerimaan per baris sebagian → PO Diterima Sebagian, stok masing-masing naik (0→6, 0→5)",
      rPartMulti.statusCode === 200 && poAfterPart.status === "Diterima Sebagian" && poAfterPart.receivedQty === 11 && stock1AfterPart === 6 && stock2AfterPart === 5,
      rPartMulti.body);

    // Penerimaan sisa baris (item 1 terima 4)
    const rFullMulti = await post(dir, `/api/purchaseOrders/${poMultiBarisId}/receive`, {
      lines: [{ itemId: multiItem1Id, qty: 4 }],
    });
    const poAfterFull = await poOf(poMultiBarisId);
    const stock1AfterFull = Number((JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [multiItem1Id]))[0]?.data ?? "{}") as { stock: number }).stock);
    assert("penerimaan sisa baris → PO Diterima, stok item 1 naik (6→10)",
      rFullMulti.statusCode === 200 && poAfterFull.status === "Diterima" && poAfterFull.receivedQty === 15 && stock1AfterFull === 10,
      rFullMulti.body);

    // 3. Pencegahan penerimaan ganda (PO yang sudah "Diterima" ditolak 409)
    const dupRecv = await post(dir, `/api/purchaseOrders/${poMultiBarisId}/receive`, {
      lines: [{ itemId: multiItem1Id, qty: 1 }],
    });
    assert("pencegahan penerimaan ganda: PO sudah Diterima ditolak → 409", dupRecv.statusCode === 409, dupRecv.body);

    const legacy = await post(dir, "/api/purchaseOrders", { data: { item: "Probe Valve", itemId, vendor: "PT Vendor A Probe", amount: 300000, status: "Dikirim", date: "2026-10-10" } });
    const legacyId = (legacy.json().data as { id: string }).id;
    poIds.push(legacyId);
    const legacyRecv = await post(dir, `/api/purchaseOrders/${legacyId}/receive`, { qty: 3 });
    assert("PO lama tanpa qty → diterima penuh", legacyRecv.statusCode === 200 && (await poOf(legacyId)).status === "Diterima", legacyRecv.body);

    const returnPoRes = await post(dir, "/api/purchaseOrders", { branch: "Samarinda", data: {
      poType: "Besar", item: "Probe Return Valve", itemId: returnItemId, vendor: "PT Vendor Retur Probe", qty: 5,
      receivedQty: 5, returnedQty: 0, amount: 500000, status: "Diterima", date: "2026-10-10",
    } });
    const returnPoId = (returnPoRes.json().data as { id: string }).id;
    poIds.push(returnPoId);
    const deniedReturn = await post(viewer, `/api/purchaseOrders/${returnPoId}/return`, { qty: 1, itemId: returnItemId, note: "probe" });
    assert("viewer tidak boleh memproses retur PO → 403", deniedReturn.statusCode === 403, deniedReturn.body);
    const returned = await post(dir, `/api/purchaseOrders/${returnPoId}/return`, { qty: 2, itemId: returnItemId, note: "Probe retur" });
    const returnData = returned.json().data as { movementId: string } | undefined;
    const returnPoAfter = await poOf(returnPoId);
    const returnStockAfter = Number((JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [returnItemId]))[0]?.data ?? "{}") as { stock: number }).stock);
    const returnMovement = returnData?.movementId
      ? await q<{ branch: string; data: string }>("SELECT branch, data FROM movements WHERE id = ?", [returnData.movementId])
      : [];
    const returnMovementData = returnMovement[0] ? JSON.parse(returnMovement[0].data) as Record<string, unknown> : {};
    assert("retur 2 atomik: stok turun 5→3, PO returnedQty=2, movement tercatat", returned.statusCode === 200
      && returnStockAfter === 3 && returnPoAfter.returnedQty === 2
      && returnMovementData.type === "Retur" && returnMovementData.qty === 2
      && returnMovementData.itemId === returnItemId && returnMovement[0]?.branch === "Samarinda", returned.body);

    const overReturn = await post(dir, `/api/purchaseOrders/${returnPoId}/return`, { qty: 4, itemId: returnItemId, note: "Over retur" });
    const unchangedPo = await poOf(returnPoId);
    const unchangedStock = Number((JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [returnItemId]))[0]?.data ?? "{}") as { stock: number }).stock);
    assert("over-return ditolak tanpa mutasi stok atau PO → 422", overReturn.statusCode === 422 && unchangedStock === 3 && unchangedPo.returnedQty === 2, overReturn.body);

    const wrongSku = await post(dir, `/api/purchaseOrders/${returnPoId}/return`, { qty: 1, itemId, note: "SKU salah" });
    assert("SKU berbeda dari item PO ditolak → 422", wrongSku.statusCode === 422, wrongSku.body);

    const awayPoRes = await post(dir, "/api/purchaseOrders", { branch: "Banjarmasin", data: {
      poType: "Besar", item: "Probe Away Return Valve", itemId: awayReturnItemId, vendor: "PT Vendor Retur Probe", qty: 2,
      receivedQty: 2, returnedQty: 0, amount: 200000, status: "Diterima", date: "2026-10-10",
    } });
    const awayPoId = (awayPoRes.json().data as { id: string }).id;
    poIds.push(awayPoId);
    const branchDeniedReturn = await post(scopedDirector, `/api/purchaseOrders/${awayPoId}/return`, { qty: 1, itemId: awayReturnItemId, note: "Lintas cabang" });
    const awayStock = Number((JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [awayReturnItemId]))[0]?.data ?? "{}") as { stock: number }).stock);
    assert("retur lintas cabang ditolak tanpa mengubah stok → 404", branchDeniedReturn.statusCode === 404 && awayStock === 2, branchDeniedReturn.body);

    // 4. PO Kecil dengan lampiran nota/bukti transaksi (#107)
    const smallProofUrl = `/files/2026-10/nota-probe-${Date.now().toString(36)}.pdf`;
    const smallPoRes = await post(dir, "/api/purchaseOrders", {
      branch: "Samarinda",
      data: {
        poType: "Kecil",
        item: "Probe Oli Mesin 20L",
        workshop: "Workshop Samarinda",
        requester: "Rudi H.",
        vendor: "Workshop Internal",
        req: "-",
        amount: 450000,
        qty: 1,
        unit: "pail",
        receivedQty: 0,
        returnedQty: 0,
        status: "Diajukan",
        date: "2026-10-12",
        eta: "2026-10-14",
        project: "-",
        vessel: "",
        nota: "NT-PRB-2026",
        notaUrl: smallProofUrl,
        buktiUrl: smallProofUrl,
        lines: [{ name: "Probe Oli Mesin 20L", qty: 1, unit: "pail", price: 450000, spec: "SAE 40", need: "Genset B" }],
      },
    });
    assert("buat PO Kecil dengan nota & lampiran bukti → 201", smallPoRes.statusCode === 201, smallPoRes.body);
    const smallPoId = (smallPoRes.json().data as { id: string }).id;
    poIds.push(smallPoId);
    const smallPoData = await poOf(smallPoId);
    assert(
      "PO Kecil menyimpan nomor nota dan notaUrl/buktiUrl dengan utuh",
      smallPoData.nota === "NT-PRB-2026" && smallPoData.notaUrl === smallProofUrl && smallPoData.buktiUrl === smallProofUrl,
      JSON.stringify(smallPoData),
    );

    // Buka file lampiran tanpa token ditolak 401
    const unauthProof = await app.inject({ method: "GET", url: smallProofUrl });
    assert("buka lampiran bukti tanpa login → 401", unauthProof.statusCode === 401, unauthProof.body);

    // Pengguna berwenang (dengan JWT) lolos autentikasi (404 karena berkas disk uji coba)
    const authProof = await app.inject({ method: "GET", url: smallProofUrl, headers: auth(dir) });
    assert("peran berwenang membuka lampiran bukti → lolos auth (404 berkas simulasi)", authProof.statusCode === 404, authProof.body);

    // Perbarui PO Kecil (update nota / bukti)
    const updatedProofUrl = `/files/2026-10/nota-probe-rev-${Date.now().toString(36)}.pdf`;
    const patchSmall = await app.inject({
      method: "PATCH",
      url: `/api/purchaseOrders/${smallPoId}`,
      headers: auth(dir),
      payload: {
        data: {
          ...smallPoData,
          nota: "NT-PRB-2026-REV",
          notaUrl: updatedProofUrl,
          buktiUrl: updatedProofUrl,
        },
      },
    });
    assert("ubah PO Kecil memperbarui nota dan buktiUrl → 200", patchSmall.statusCode === 200, patchSmall.body);
    const updatedSmallPo = await poOf(smallPoId);
    assert(
      "perubahan nota & lampiran bukti tersimpan setelah dimuat ulang",
      updatedSmallPo.nota === "NT-PRB-2026-REV" && updatedSmallPo.notaUrl === updatedProofUrl,
      JSON.stringify(updatedSmallPo),
    );
  } finally {
    for (const id of poIds) await exec("DELETE FROM purchaseOrders WHERE id = ?", [id]);
    for (const id of poIds) await exec("DELETE FROM audit_log WHERE row_id = ?", [id]);
    await exec("DELETE FROM movements WHERE data LIKE ?", [`%${itemId}%`]);
    await exec("DELETE FROM movements WHERE data LIKE ?", [`%${returnItemId}%`]);
    await exec("DELETE FROM movements WHERE data LIKE ?", [`%${awayReturnItemId}%`]);
    await exec("DELETE FROM movements WHERE data LIKE ?", [`%${multiItem1Id}%`]);
    await exec("DELETE FROM movements WHERE data LIKE ?", [`%${multiItem2Id}%`]);
    await exec("DELETE FROM materialRequests WHERE data LIKE ?", [`%${itemId}%`]);
    await exec("DELETE FROM requisitions WHERE data LIKE ?", [`%${itemId}%`]);
    if (mrId) await exec("DELETE FROM audit_log WHERE row_id = ?", [mrId]);
    await exec("DELETE FROM audit_log WHERE action = 'material_request' AND diff LIKE ?", [`%${itemId}%`]);
    await exec("DELETE FROM inventory WHERE id = ?", [itemId]);
    await exec("DELETE FROM inventory WHERE id = ?", [returnItemId]);
    await exec("DELETE FROM inventory WHERE id = ?", [awayReturnItemId]);
    await exec("DELETE FROM inventory WHERE id = ?", [multiItem1Id]);
    await exec("DELETE FROM inventory WHERE id = ?", [multiItem2Id]);
    await exec("DELETE FROM employees WHERE id = ?", [scopedDirectorEmployeeId]);
    await exec("DELETE FROM users WHERE id = ?", [scopedDirectorId]);
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
