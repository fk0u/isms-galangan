/* change-order-probe.ts — F3-C-05: CO tanpa persetujuan owner tidak bisa
 * diterapkan; menerapkan CO menghasilkan revisi BoQ baru dengan total benar. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Change Order Probe (F3-C-05) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenOf = async (username: string): Promise<string> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE username = ?", [username]))[0];
    if (!u) throw new Error(`Akun ${username} belum ada — jalankan npm run seed`);
    return signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  };
  const dir = await tokenOf("direktur@galangan.com");
  const proyek = await tokenOf("proyek@galangan.com");
  const tag = Date.now().toString(36).toUpperCase();
  const pid = `PRJ-COP-${tag}`;
  const docId = `BQD-COP-${tag}`;
  const now = new Date().toISOString();
  const ins = (table: string, id: string, data: Record<string, unknown>) => exec(`INSERT INTO ${table} (id, branch, data, updated_at) VALUES (?, ?, ?, ?)`, [id, "Samarinda", JSON.stringify(data), now]);
  const h = (t: string) => ({ authorization: `Bearer ${t}` });
  const post = (t: string, url: string, payload: Record<string, unknown> = {}) => app.inject({ method: "POST", url, headers: h(t), payload });
  let coId = "";
  try {
    await ins("projects", pid, { vessel: "Probe Vessel", budget: 1_000_000_000, status: "Dalam Proses" });
    await ins("boqDocs", docId, { projectId: pid, number: `BQ/${pid}/001`, revision: 0, status: "Disetujui", total: 300_000_000 });
    await ins("boq", `BQ-COP-A${tag}`, { projectId: pid, boqDocId: docId, name: "Item A", quantity: 10, unit: "m2", unitPrice: 10_000_000, totalPrice: 100_000_000 });
    await ins("boq", `BQ-COP-B${tag}`, { projectId: pid, boqDocId: docId, name: "Item B", quantity: 1, unit: "ls", unitPrice: 200_000_000, totalPrice: 200_000_000 });

    const created = await post(proyek, "/api/changeOrders", { data: {
      project: pid, title: "Probe CO", impact: 0, requestedBy: "Probe", date: "2026-10-10", status: "Disetujui", ownerApproval: { decision: "Disetujui", by: "Palsu" },
      boqDocId: docId, changes: [
        { op: "update", itemId: `BQ-COP-A${tag}`, quantity: 12 },
        { op: "remove", itemId: `BQ-COP-B${tag}` },
        { op: "add", name: "Item C", quantity: 2, unit: "unit", unitPrice: 75_000_000 },
      ],
    } });
    const cd = created.json().data as { id: string; data?: Record<string, unknown> } & Record<string, unknown>;
    coId = cd.id;
    const cdata = (cd.data ?? cd) as Record<string, unknown>;
    assert("CO baru dipaksa Diajukan, ownerApproval dibuang", created.statusCode === 201 && cdata.status === "Diajukan" && cdata.ownerApproval === undefined, created.body);

    const early = await post(dir, `/api/changeOrders/${coId}/apply`);
    assert("terapkan sebelum disetujui owner → 409", early.statusCode === 409, early.body);
    const sneak = await app.inject({ method: "PATCH", url: `/api/changeOrders/${coId}`, headers: h(proyek), payload: { data: { status: "Disetujui" } } });
    assert("setujui lewat CRUD → 422", sneak.statusCode === 422, sneak.body);
    const byProyek = await post(proyek, `/api/changeOrders/${coId}/decision`, { decision: "Disetujui" });
    assert("peran proyek memutuskan CO → 403", byProyek.statusCode === 403, byProyek.body);
    const approve = await post(dir, `/api/changeOrders/${coId}/decision`, { decision: "Disetujui" });
    assert("owner menyetujui → 200", approve.statusCode === 200, approve.body);

    const apply = await post(dir, `/api/changeOrders/${coId}/apply`);
    const res = apply.json().data as { resultBoqDocId: string; oldTotal: number; newTotal: number; budget: number };
    // 12 × 10 jt + 2 × 75 jt = 270 jt (Item B dihapus).
    assert("revisi BoQ baru: total 270 jt (dari 300 jt)", apply.statusCode === 200 && res.oldTotal === 300_000_000 && res.newTotal === 270_000_000, apply.body);
    const newDoc = JSON.parse((await q<{ data: string }>("SELECT data FROM boqDocs WHERE id = ?", [res.resultBoqDocId]))[0]?.data ?? "{}") as { status: string; revision: number; supersedes: string };
    const oldDoc = JSON.parse((await q<{ data: string }>("SELECT data FROM boqDocs WHERE id = ?", [docId]))[0]?.data ?? "{}") as { status: string };
    assert("revisi Rev 1 Disetujui, surat lama Digantikan", newDoc.status === "Disetujui" && newDoc.revision === 1 && oldDoc.status === "Digantikan", JSON.stringify(newDoc));
    assert("anggaran proyek turun 30 jt", res.budget === 970_000_000, String(res.budget));
    const again = await post(dir, `/api/changeOrders/${coId}/apply`);
    assert("terapkan ulang → 409", again.statusCode === 409, again.body);
  } finally {
    await exec("DELETE FROM boq WHERE data LIKE ?", [`%${pid}%`]);
    await exec("DELETE FROM boqDocs WHERE data LIKE ?", [`%${pid}%`]);
    if (coId) { await exec("DELETE FROM changeOrders WHERE id = ?", [coId]); await exec("DELETE FROM audit_log WHERE row_id = ?", [coId]); }
    await exec("DELETE FROM projects WHERE id = ?", [pid]);
  }
  console.log(`\n${passed}/${total} pemeriksaan change order lolos.`);
  await app.close();
  await closeDb();
}
main().catch(async (err) => { console.error(err); process.exitCode = 1; await closeDb(); });
