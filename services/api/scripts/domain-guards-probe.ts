/* domain-guards-probe.ts — audit issue 12 Okt: aturan #67 (hapus tahapan WBS),
   #82 (Project Manager), #93 (transfer gudang) ditegakkan server, bukan hanya UI. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";
import { wbsRemovalError } from "../src/domainGuards.js";

async function main(): Promise<void> {
  console.log("=== ISMS Domain Guards Probe (#67 #82 #93) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ?", ["direktur"]))[0]!;
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
    assert("tahapan berpenugasan terlindungi", wbsRemovalError([{ task: "A", progress: 0, assignee: { type: "internal", id: "E1" } }], []) !== null);
    assert("tahapan berfoto terlindungi", wbsRemovalError([{ task: "A", progress: 0, photos: [{ url: "x" }] }], []) !== null);

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
    const jumlah = async (): Promise<number> => (await q<{ n: number }>("SELECT COUNT(*) AS n FROM movements"))[0]!.n;
    const awal = await jumlah();
    const mv = { item: "Probe", itemId: "X", type: "Transfer", qty: 1, by: "A → A", date: "2026-10-12", tone: "in" };
    const sama = await call("POST", "/api/movements", { data: { ...mv, fromWh: "Gudang A", toWh: " gudang a " } });
    assert("transfer ke gudang asal → 422", sama.status === 422, JSON.stringify(sama.body));
    assert("transfer tanpa gudang tujuan → 422", (await call("POST", "/api/movements", { data: { ...mv, fromWh: "Gudang A" } })).status === 422);
    assert("pergerakan tidak tercatat saat ditolak", (await jumlah()) === awal);
  } finally {
    for (const id of made) await exec("DELETE FROM projects WHERE id = ?", [id]);
    await exec("DELETE FROM wbs_by_project WHERE project_id = ?", [pid]);
    await exec("DELETE FROM projects WHERE id = ?", [pid]);
    await exec("DELETE FROM employees WHERE id IN (?, ?)", [empPm, empFin]);
  }
  console.log(`\n${passed}/${total} pemeriksaan guard domain lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
