/* domain-guards-probe.ts — audit issue 12 Okt: aturan #67 (hapus tahapan WBS),
   #82 (Project Manager), #93 (transfer gudang) ditegakkan server, bukan hanya UI. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";
import { wbsRuleError } from "../src/domainGuards.js";
import { findRecipe, prepareModel } from "../src/pdf/registry.js";

async function main(): Promise<void> {
  console.log("=== ISMS Domain Guards Probe (#67 #82 #93) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ? AND is_active = 1", ["direktur"]))[0]!;
  const headers = { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version })}` };
  const call = async (method: "POST" | "PUT" | "PATCH", url: string, payload: unknown) => {
    const res = await app.inject({ method, url, headers, payload: payload as object });
    return { status: res.statusCode, body: res.json() as { data?: { id?: string }; error?: { code?: string; message?: string } } };
  };
  const tag = Date.now().toString(36).toUpperCase();
  const pid = `PRJ-GUARD-${tag}`;
  const empPm = `EMP-GPM-${tag}`;
  const empFin = `EMP-GFN-${tag}`;
  const now = new Date().toISOString();
  const made: string[] = [];
  const cleanup: Array<() => Promise<unknown>> = [];
  await exec("INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [pid, "Samarinda", JSON.stringify({ vessel: "TB Probe", client: "PT Probe", manager: "Orang Lama", status: "Dalam Proses" }), now]);
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empPm, "Samarinda", JSON.stringify({ name: `PM Probe ${tag}`, role: "Project Manager", status: "Aktif" }), now]);
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empFin, "Samarinda", JSON.stringify({ name: `Fin Probe ${tag}`, role: "Finance Manager", status: "Aktif" }), now]);
  try {
    /* #67 */
    const kosong = { task: "Persiapan", start: "-", end: "-", progress: 0, weight: 50 };
    const isi = { task: "Blasting", start: "-", end: "-", progress: 40, weight: 50, history: [{ date: "2026-10-01", actor: "probe", from: 0, to: 40 }] };
    const wbsUrl = `/api/projects/${pid}/wbs`;
    assert("simpan WBS awal → 200", (await call("PUT", wbsUrl, { wbs: [kosong, isi] })).status === 200);
    const tolak = await call("PUT", wbsUrl, { wbs: [kosong] });
    assert("hapus tahapan berprogres → 409 STAGE_IN_USE", tolak.status === 409 && tolak.body.error?.code === "STAGE_IN_USE", JSON.stringify(tolak.body));
    const sisa = JSON.parse((await q<{ data: string }>("SELECT data FROM wbs_by_project WHERE project_id = ?", [pid]))[0]!.data) as unknown[];
    assert("WBS di server tidak berubah setelah ditolak", sisa.length === 2);
    assert("hapus lalu tambah tahapan kosong bukan rename → ditolak", (await call("PUT", wbsUrl, { wbs: [kosong, { ...kosong, task: "Baru" }] })).status === 409);
    assert("ganti nama tahapan berprogres (riwayat ikut) → 200", (await call("PUT", wbsUrl, { wbs: [kosong, { ...isi, task: "Sandblasting" }] })).status === 200);
    assert("hapus tahapan kosong → 200", (await call("PUT", wbsUrl, { wbs: [{ ...isi, task: "Sandblasting" }] })).status === 200);
    /* #77 */
    const kini = { ...isi, task: "Sandblasting" };
    const tanpaFoto = await call("PUT", wbsUrl, { wbs: [{ ...kini, progress: 60 }] });
    assert("ubah progres tanpa foto → 422 PHOTO_REQUIRED", tanpaFoto.status === 422 && tanpaFoto.body.error?.code === "PHOTO_REQUIRED", JSON.stringify(tanpaFoto.body));
    assert("penugasan tanpa ubah progres tidak butuh foto → 200", (await call("PUT", wbsUrl, { wbs: [{ ...kini, assignee: { type: "internal", id: empPm } }] })).status === 200);
    assert("ubah progres dengan foto baru → 200", (await call("PUT", wbsUrl, { wbs: [{ ...kini, progress: 60, photos: [{ url: "/files/2026-10/probe.jpg", note: "", date: "2026-10-12" }] }] })).status === 200);
    assert("tahapan berpenugasan terlindungi", wbsRuleError([{ task: "A", progress: 0, assignee: { type: "internal", id: "E1" } }], [])?.code === "STAGE_IN_USE");
    assert("tahapan berfoto terlindungi", wbsRuleError([{ task: "A", progress: 0, photos: [{ url: "x" }] }], [])?.code === "STAGE_IN_USE");
    const lama = { task: "A", progress: 40, history: [{ date: "d", from: 0, to: 40 }], photos: [{ url: "/f/1.jpg" }] };
    assert("mengosongkan riwayat tahapan bernama sama → ditolak", wbsRuleError([lama], [{ ...lama, history: [] }])?.code === "STAGE_IN_USE");
    assert("membuang foto lama → ditolak", wbsRuleError([lama], [{ ...lama, photos: [] }])?.code === "STAGE_IN_USE");
    assert("rename dengan riwayat lain sepanjang sama → ditolak", wbsRuleError([lama], [{ ...lama, task: "B", history: [{ date: "x", from: 0, to: 1 }] }])?.code === "STAGE_IN_USE");
    assert("menggandakan URL foto lama bukan bukti baru", wbsRuleError([lama], [{ ...lama, progress: 60, photos: [...lama.photos, { url: "/f/1.jpg" }] }])?.code === "PHOTO_REQUIRED");
    assert("rename sambil ubah progres tanpa foto → ditolak", wbsRuleError([lama], [{ ...lama, task: "B", progress: 60 }])?.code === "PHOTO_REQUIRED");
    assert("anggota WBS bukan objek tidak membuat galat", wbsRuleError([null], [null, 5]) === null);

    /* #90: peran updater dicap server dari token */
    const tersimpan = JSON.parse((await q<{ data: string }>("SELECT data FROM wbs_by_project WHERE project_id = ?", [pid]))[0]!.data) as Array<{ history?: Array<{ actorRole?: string }> }>;
    const palsu = await call("PUT", wbsUrl, { wbs: [{ ...tersimpan[0], history: [...(tersimpan[0]!.history ?? []), { date: "2026-10-12", actor: "probe", from: 60, to: 60, actorRole: "developer" }] }] });
    const cap = JSON.parse((await q<{ data: string }>("SELECT data FROM wbs_by_project WHERE project_id = ?", [pid]))[0]!.data) as Array<{ history: Array<{ actorRole?: string }> }>;
    assert("entri riwayat baru dicap peran dari token, bukan dari klien", palsu.status === 200 && cap[0]!.history.at(-1)?.actorRole === "direktur", JSON.stringify(cap[0]!.history.at(-1)));
    const lagi = await call("PUT", wbsUrl, { wbs: [{ ...tersimpan[0], history: [...(tersimpan[0]!.history ?? []), { date: "2026-10-12", actor: "probe", from: 60, to: 60 }], station: "A" }], baseData: [{ ...tersimpan[0], history: [...(tersimpan[0]!.history ?? []), { date: "2026-10-12", actor: "probe", from: 60, to: 60 }] }] });
    assert("simpan berikutnya dengan baseline klien tanpa cap peran tidak dianggap STALE", lagi.status === 200, JSON.stringify(lagi.body).slice(0, 160));
    assert("entri riwayat lama tidak diubah", JSON.stringify(cap[0]!.history[0]) === JSON.stringify(tersimpan[0]!.history?.[0]));

    /* #94: SPK mengambil NPWP/alamat dari profil subkon lewat NAMA di WO */
    const subA = `SUB-GA-${tag}`; const subB = `SUB-GB-${tag}`; const woA = `WO-GA-${tag}`; const woB = `WO-GB-${tag}`;
    await exec("INSERT INTO subcontractors (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [subA, "Samarinda", JSON.stringify({ name: `PT Probe Lengkap ${tag}`, npwp: "00.000.000.0-000.000", address: "Jl. Sintetis 1", contract: 999 }), now]);
    await exec("INSERT INTO subcontractors (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [subB, "Samarinda", JSON.stringify({ name: `PT Probe Kosong ${tag}`, contract: 555 }), now]);
    await exec("INSERT INTO workOrders (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [woA, "Samarinda", JSON.stringify({ sub: `PT Probe Lengkap ${tag}`, project: pid, scope: "Uji", value: 12345 }), now]);
    await exec("INSERT INTO workOrders (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [woB, "Samarinda", JSON.stringify({ sub: `PT Probe Kosong ${tag}`, project: pid, scope: "Uji" }), now]);
    cleanup.push(() => exec("DELETE FROM subcontractors WHERE id IN (?, ?)", [subA, subB]), () => exec("DELETE FROM workOrders WHERE id IN (?, ?)", [woA, woB]));
    const recipe = findRecipe("spk")!;
    const ctx = { locale: "id", branch: "Samarinda" } as Parameters<typeof prepareModel>[2];
    const a = await prepareModel(recipe, woA, ctx) as Record<string, unknown>;
    const b = await prepareModel(recipe, woB, ctx) as Record<string, unknown>;
    assert("SPK: NPWP, alamat, nilai dari profil & WO yang benar", a.subcontractorNPWP === "00.000.000.0-000.000" && a.subcontractorAddress === "Jl. Sintetis 1" && a.contractValue === 12345, JSON.stringify(a).slice(0, 300));
    assert("SPK: profil tanpa NPWP/alamat & WO tanpa nilai tetap kosong, tidak meminjam data lain", b.subcontractorNPWP === undefined && b.subcontractorAddress === undefined && b.contractValue === 0, JSON.stringify(b).slice(0, 300));

    /* #91: batas dimensi dock */
    const dockId = `DD-G-${tag}`; const slotId = `SL-G-${tag}`;
    await exec("INSERT INTO drydocks (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [dockId, "Samarinda", JSON.stringify({ name: `Dock Probe ${tag}`, maxLoa: 60, maxBeam: 12 }), now]);
    cleanup.push(() => exec("DELETE FROM dockSlots WHERE id = ?", [slotId]), () => exec("DELETE FROM drydocks WHERE id = ?", [dockId]));
    assert("batas dock negatif → 422", (await call("PATCH", `/api/drydocks/${dockId}`, { data: { maxLoa: -5 } })).status === 422);
    assert("batas dock bukan angka → 422", (await call("PATCH", `/api/drydocks/${dockId}`, { data: { maxLoa: "abc" } })).status === 422 && (await call("PATCH", `/api/drydocks/${dockId}`, { data: { maxBeam: true } })).status === 422);
    assert("hapus batas dock tanpa booking → 200", (await call("PATCH", `/api/drydocks/${dockId}`, { data: { maxBeam: 0 } })).status === 200);
    await exec("INSERT INTO dockSlots (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [slotId, "Samarinda", JSON.stringify({ dockId, project: pid, from: 1, to: 5 }), now]);
    const hapusBatas = await call("PATCH", `/api/drydocks/${dockId}`, { data: { maxLoa: 0 } });
    assert("hapus batas dock yang punya booking → 409 dengan penjelasan", hapusBatas.status === 409 && /booking/.test(hapusBatas.body.error?.message ?? ""), JSON.stringify(hapusBatas.body));
    assert("ubah nilai batas dock yang punya booking → 200", (await call("PATCH", `/api/drydocks/${dockId}`, { data: { maxLoa: 70 } })).status === 200);

    /* ADR-0020: BOM per proyek + barang masuk/keluar additional lewat server */
    const invId = `INV-G-${tag}`;
    await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [invId, "Samarinda", JSON.stringify({ name: `Material Probe ${tag}`, unit: "pcs", stock: 5, warehouse: "Gudang Probe" }), now]);
    cleanup.push(() => exec("DELETE FROM movements WHERE data LIKE ?", [`%${invId}%`]), () => exec("DELETE FROM bomItems WHERE data LIKE ?", [`%${invId}%`]), () => exec("DELETE FROM inventory WHERE id = ?", [invId]));
    const bom = await call("POST", "/api/bomItems", { data: { projectId: pid, itemId: invId, need: 10, unit: "pcs" } });
    assert("tambah BOM proyek → 201", bom.status === 201, JSON.stringify(bom.body));
    assert("material sama dua kali di BOM proyek → 422", (await call("POST", "/api/bomItems", { data: { projectId: pid, itemId: invId, need: 3 } })).status === 422);
    assert("kebutuhan BOM 0 → 422", (await call("POST", "/api/bomItems", { data: { projectId: pid, itemId: "INV-001", need: 0 } })).status === 422);
    assert("BOM dengan proyek tak dikenal → ditolak", (await call("POST", "/api/bomItems", { data: { projectId: "PRJ-TIDAK-ADA", itemId: invId, need: 1 } })).status >= 400);
    /* K17-PM-03: alokasi material per tahapan WBS. */
    const bomId = String((bom.body as { data?: { id?: string } }).data?.id ?? "");
    const alloc = (alokasi: unknown) => call("PATCH", `/api/bomItems/${bomId}`, { data: { alokasi } });
    assert("alokasi per tahapan dalam batas kebutuhan → 200", (await alloc([{ wbsTask: "Fabrikasi", qty: 6 }, { wbsTask: "Outfitting", qty: 4 }])).status === 200);
    assert("total alokasi melebihi kebutuhan → 422", (await alloc([{ wbsTask: "Fabrikasi", qty: 8 }, { wbsTask: "Outfitting", qty: 4 }])).status === 422);
    assert("tahapan ganda dalam alokasi → 422", (await alloc([{ wbsTask: "Fabrikasi", qty: 1 }, { wbsTask: "Fabrikasi", qty: 1 }])).status === 422);
    assert("alokasi tanpa tahapan atau jumlah 0 → 422", (await alloc([{ wbsTask: "", qty: 1 }])).status === 422 && (await alloc([{ wbsTask: "Fabrikasi", qty: 0 }])).status === 422);
    const masuk = await call("POST", `/api/inventory/${invId}/additional`, { direction: "in", qty: 7, reason: "sisa proyek lain", warehouse: "Gudang Baru" });
    const stokMasuk = JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [invId]))[0]!.data) as { stock: number; warehouse: string };
    assert("penerimaan additional: stok +7 dan gudang ditetapkan", masuk.status === 200 && stokMasuk.stock === 12 && stokMasuk.warehouse === "Gudang Baru", JSON.stringify(masuk.body));
    const lebih = await call("POST", `/api/inventory/${invId}/additional`, { direction: "out", qty: 99, reason: "uji stok kurang" });
    const stokTetap = JSON.parse((await q<{ data: string }>("SELECT data FROM inventory WHERE id = ?", [invId]))[0]!.data) as { stock: number };
    assert("pengeluaran additional melebihi stok → 409 tanpa mengubah stok", lebih.status === 409 && stokTetap.stock === 12);
    assert("pengeluaran additional tanpa alasan → 400", (await call("POST", `/api/inventory/${invId}/additional`, { direction: "out", qty: 1, reason: "" })).status === 400);
    const keluar = await call("POST", `/api/inventory/${invId}/additional`, { direction: "out", qty: 2, reason: "pemakaian bengkel", projectId: pid });
    const mvs = await q<{ n: number }>("SELECT COUNT(*) AS n FROM movements WHERE data LIKE ? AND data LIKE ?", [`%${invId}%`, "%Additional:%"]);
    assert("pengeluaran additional: stok -2 dan 2 movement tercatat", keluar.status === 200 && (keluar.body.data as { stock?: number } | undefined)?.stock === 10 && mvs[0]!.n === 2, JSON.stringify(keluar.body));

    /* #82 */
    const bukanPm = await call("PATCH", `/api/projects/${pid}`, { data: { manager: `Fin Probe ${tag}` } });
    assert("manager non-PM → 422", bukanPm.status === 422, JSON.stringify(bukanPm.body));
    assert("manager nama asal-asalan → 422", (await call("PATCH", `/api/projects/${pid}`, { data: { manager: "Tidak Ada Orangnya" } })).status === 422);
    assert("edit field lain tanpa menyentuh manager lama → 200", (await call("PATCH", `/api/projects/${pid}`, { data: { status: "Selesai" } })).status === 200);
    assert("manager berjabatan PM → 200", (await call("PATCH", `/api/projects/${pid}`, { data: { manager: `PM Probe ${tag}` } })).status === 200);
    const buat = await call("POST", "/api/projects", { data: { vessel: "TB Probe", client: "PT Probe", manager: `Fin Probe ${tag}`, status: "Perencanaan" } });
    assert("buat proyek dengan manager non-PM → 422", buat.status === 422, JSON.stringify(buat.body));
    if (buat.body.data?.id) made.push(buat.body.data.id);

    /* #93 */
    // Hanya baris bertanda probe ini yang dihitung, agar tidak terganggu penulis lain.
    const jumlah = async (): Promise<number> => (await q<{ n: number }>("SELECT COUNT(*) AS n FROM movements WHERE data LIKE ?", [`%"item":"Probe ${tag}"%`]))[0]!.n;
    const mv = { item: `Probe ${tag}`, itemId: "X", type: "Transfer", qty: 1, by: "A → A", date: "2026-10-12", tone: "in" };
    const sama = await call("POST", "/api/movements", { data: { ...mv, fromWh: "Gudang A", toWh: " gudang a " } });
    assert("transfer ke gudang asal → 422", sama.status === 422, JSON.stringify(sama.body));
    assert("transfer tanpa gudang tujuan → 422", (await call("POST", "/api/movements", { data: { ...mv, fromWh: "Gudang A" } })).status === 422);
    assert("pergerakan tidak tercatat saat ditolak", (await jumlah()) === 0);

    /* #92: stok awal material lewat katalog ditolak */
    const invStockBaru = await call("POST", "/api/inventory", { data: { name: `Material Probe ${tag}`, category: "Baja", sku: `SKU-G-${tag}`, stock: 50, unit: "pcs" } });
    assert("tambah material baru dengan stok awal > 0 → 422", invStockBaru.status === 422, JSON.stringify(invStockBaru.body));
    const invNol = await call("POST", "/api/inventory", { data: { name: `Material Probe ${tag}`, category: "Baja", sku: `SKU-G-${tag}`, stock: 0, unit: "pcs" } });
    assert("tambah material baru dengan stok 0 → 200/201", invNol.status === 200 || invNol.status === 201, JSON.stringify(invNol.body));
    if (invNol.body.data?.id) made.push(invNol.body.data.id);
  } finally {
    for (const undo of cleanup) await undo();
    await exec("DELETE FROM movements WHERE data LIKE ?", [`%Probe ${tag}%`]);
    for (const id of made) {
      await exec("DELETE FROM projects WHERE id = ?", [id]);
      await exec("DELETE FROM inventory WHERE id = ?", [id]);
    }
    await exec("DELETE FROM wbs_by_project WHERE project_id = ?", [pid]);
    await exec("DELETE FROM projects WHERE id = ?", [pid]);
    await exec("DELETE FROM employees WHERE id IN (?, ?)", [empPm, empFin]);
  }
  console.log(`\n${passed}/${total} pemeriksaan guard domain lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
