/* boq-docs-probe.ts — invariant surat BoQ (F3-C-01 / ADR-0006):
 * unik nomor+revisi, kunci item surat Disetujui, transisi status,
 * revisi menyalin item, revisi disetujui menggantikan surat lama. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS BoQ Docs Probe (F3-C-01) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };

  const dir = (await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1",
  ))[0];
  if (!dir) throw new Error("Butuh akun direktur hasil seed (npm run seed)");
  const auth = { authorization: `Bearer ${signToken({ id: dir.id, username: dir.username, role: dir.role, branch: "SEMUA", v: dir.token_version ?? 0 })}` };
  const project = (await q<{ id: string }>("SELECT id FROM projects LIMIT 1"))[0];
  if (!project) throw new Error("Butuh minimal satu proyek hasil seed");

  const call = (method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: unknown) =>
    app.inject({ method, url, headers: auth, payload: payload as Record<string, unknown> | undefined });
  const number = `PROBE/BQ/${Date.now()}`;

  const c1 = await call("POST", "/api/boqDocs", { data: { projectId: project.id, number, status: "Disetujui" } });
  const doc = c1.json().data as { id: string; data: { status: string; revision: number } };
  assert("create surat → 201, status dipaksa Draft, revisi 0", c1.statusCode === 201 && doc.data.status === "Draft" && doc.data.revision === 0, c1.body);

  const dup = await call("POST", "/api/boqDocs", { data: { projectId: project.id, number } });
  assert("nomor + revisi sama pada proyek sama → 409", dup.statusCode === 409, dup.body);

  const item = await call("POST", "/api/boq", { data: { projectId: project.id, boqDocId: doc.id, name: "Probe plat", quantity: 2, unitPrice: 1500000 } });
  const itemId = (item.json().data as { id: string }).id;
  assert("item BoQ ke surat Draft → 201", item.statusCode === 201, item.body);

  const badStatus = await call("PATCH", `/api/boqDocs/${doc.id}`, { data: { status: "Disetujui" } });
  assert("ubah status lewat PATCH → 409", badStatus.statusCode === 409, badStatus.body);

  const skip = await call("POST", `/api/boqDocs/${doc.id}/status`, { status: "Disetujui" });
  assert("Draft → Disetujui langsung → 409", skip.statusCode === 409, skip.body);

  const submit = await call("POST", `/api/boqDocs/${doc.id}/status`, { status: "Diajukan" });
  const approve = await call("POST", `/api/boqDocs/${doc.id}/status`, { status: "Disetujui" });
  const approved = approve.json().data as { status: string; total: number };
  assert("Draft → Diajukan → Disetujui, total dihitung server", submit.statusCode === 200 && approve.statusCode === 200 && approved.status === "Disetujui" && approved.total === 3000000, approve.body);

  const lockPatch = await call("PATCH", `/api/boq/${itemId}`, { data: { quantity: 9 } });
  assert("PATCH item milik surat Disetujui → 409", lockPatch.statusCode === 409, lockPatch.body);
  const lockDelete = await call("DELETE", `/api/boq/${itemId}`);
  assert("DELETE item milik surat Disetujui → 409", lockDelete.statusCode === 409, lockDelete.body);
  const lockAdd = await call("POST", "/api/boq", { data: { projectId: project.id, boqDocId: doc.id, name: "Sisipan", quantity: 1, unitPrice: 1 } });
  assert("tambah item ke surat Disetujui → 409", lockAdd.statusCode === 409, lockAdd.body);
  const lockDoc = await call("PATCH", `/api/boqDocs/${doc.id}`, { data: { note: "ubah" } });
  assert("PATCH surat Disetujui → 409", lockDoc.statusCode === 409, lockDoc.body);

  const rev = await call("POST", `/api/boqDocs/${doc.id}/revise`);
  const revData = rev.json().data as { id: string; revision: number; items: number };
  assert("revise → 201, Rev 1, item tersalin", rev.statusCode === 201 && revData.revision === 1 && revData.items === 1, rev.body);
  const rev2 = await call("POST", `/api/boqDocs/${doc.id}/revise`);
  assert("revise kedua saat revisi masih berjalan → 409", rev2.statusCode === 409, rev2.body);

  await call("POST", `/api/boqDocs/${revData.id}/status`, { status: "Diajukan" });
  const approveRev = await call("POST", `/api/boqDocs/${revData.id}/status`, { status: "Disetujui" });
  const old = (await call("GET", `/api/boqDocs/${doc.id}`)).json().data as { data: { status: string } };
  assert("revisi disetujui → surat lama Digantikan", approveRev.statusCode === 200 && old.data.status === "Digantikan", JSON.stringify(old));

  console.log(`\n${passed}/${total} pemeriksaan BoQ docs lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
