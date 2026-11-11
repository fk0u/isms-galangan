/* relations-probe.ts — REST relasi antar-koleksi (revisi 18 Okt).
 * Untuk SETIAP relasi di REFS (anak.field → induk) yang punya data contoh:
 * baris anak harus muncul di GET /api/<induk>/<id>/related. Ditambah uji
 * filter where.<field>, expand, POST related, dan penolakan tanpa login. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, q } from "../src/db.js";
import { allLinks } from "../src/routes/relations.js";
import { routeList } from "../src/routeList.js";

async function main(): Promise<void> {
  console.log("=== ISMS Relations Probe (revisi 18 Okt) ===");
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
  const headers = { authorization: `Bearer ${signToken({ id: dir.id, username: dir.username, role: dir.role, branch: "SEMUA", v: dir.token_version ?? 0 })}` };
  const call = (method: "GET" | "POST" | "DELETE", url: string, payload?: unknown) =>
    app.inject({ method, url, headers, payload: payload as Record<string, unknown> | undefined });

  /* 1. Setiap relasi (keras REFS + lunak berbasis nama) yang punya data contoh
        harus terbaca dari sisi induk lewat /related. */
  let tested = 0;
  const noSample: string[] = [];
  const parse = (d: string): Record<string, unknown> => JSON.parse(d) as Record<string, unknown>;
  for (const link of allLinks()) {
    const parents = await q<{ id: string; data: string }>(`SELECT id, data FROM ${link.target}`, []);
    const byKey = new Map<string, string>();
    for (const p of parents) {
      byKey.set(p.id, p.id);
      const name = link.soft && link.nameField ? String(parse(p.data)[link.nameField] ?? "").trim() : "";
      if (name && !byKey.has(name)) byKey.set(name, p.id);
    }
    const children = await q<{ id: string; data: string }>(`SELECT id, data FROM ${link.child}`, []);
    const sample = children.map((c) => ({ id: c.id, v: String(parse(c.data)[link.field] ?? "").trim() })).find((c) => byKey.has(c.v));
    const label = `${link.child}.${link.field}${link.soft ? " (lunak)" : ""}`;
    if (!sample) { noSample.push(label); continue; }
    const parentId = byKey.get(sample.v) as string;
    const res = await call("GET", `/api/${link.target}/${encodeURIComponent(parentId)}/related`);
    const rel = res.statusCode === 200 ? (res.json() as { data: { related: Record<string, { rows?: Array<{ id: string }> }> } }).data.related[`${link.child}.${link.field}`] : undefined;
    tested++;
    assert(`${link.target}/${parentId}/related memuat ${link.child} ${sample.id} via ${label}`, Boolean(rel?.rows?.some((r) => r.id === sample.id)), `status ${res.statusCode}`);
  }
  console.log(`Relasi diuji: ${tested}; tanpa data contoh: ${noSample.length}${noSample.length ? ` (${noSample.join(", ")})` : ""}`);
  assert("minimal 50 relasi teruji dari data seed", tested >= 50, `${tested}`);

  /* 2. Filter where.<field>. */
  const proj = (await q<{ id: string }>("SELECT id FROM projects LIMIT 1"))[0]!.id;
  const filtered = await call("GET", `/api/boq?where.projectId=${encodeURIComponent(proj)}`);
  const fRows = (filtered.json() as { data: { rows: Array<{ data: { projectId: string } }> } }).data.rows;
  assert("filter where.projectId hanya mengembalikan baris proyek itu", filtered.statusCode === 200 && fRows.every((r) => r.data.projectId === proj), filtered.body.slice(0, 200));
  assert("nama field filter tidak aman → 400", (await call("GET", "/api/boq?where.a')--=1")).statusCode === 400);

  /* 3. Expand: induk ikut terlampir. */
  const boqRow = (await q<{ id: string }>("SELECT id FROM boq LIMIT 1"))[0];
  if (boqRow) {
    const ex = await call("GET", `/api/boq/${boqRow.id}/expand?fields=projectId`);
    const exp = (ex.json() as { data: { expand: Record<string, { id?: string } | null> } }).data.expand;
    assert("expand projectId melampirkan baris proyek", ex.statusCode === 200 && typeof exp.projectId?.id === "string", ex.body.slice(0, 200));
    assert("expand field tanpa relasi → 400", (await call("GET", `/api/boq/${boqRow.id}/expand?fields=nama`)).statusCode === 400);
  }

  /* 4. POST related: field relasi terisi otomatis, validasi CRUD tetap berlaku. */
  const created = await call("POST", `/api/projects/${encodeURIComponent(proj)}/related/boq`, { data: { name: "Probe relasi", quantity: 1, unitPrice: 1000, totalPrice: 1000, status: "Draft" } });
  const cData = created.statusCode === 201 ? (created.json() as { data: { id: string; data: { projectId: string } } }).data : null;
  assert("POST /projects/:id/related/boq → 201, projectId terisi", cData?.data.projectId === proj, created.body.slice(0, 200));
  if (cData) await call("DELETE", `/api/boq/${cData.id}`);
  assert("POST related ke koleksi tak berelasi → 400", (await call("POST", `/api/projects/${encodeURIComponent(proj)}/related/vendors`, { data: {} })).statusCode === 400);
  const multi = await call("POST", `/api/boqDocs/X/related/boqDocs`, { data: {} });
  assert("relasi ambigu/ke diri tanpa ?field → 400 atau 404", multi.statusCode === 400 || multi.statusCode === 404, String(multi.statusCode));

  /* 5. Keamanan: tanpa login ditolak, induk tak ada → 404. */
  assert("related tanpa login → 401", (await app.inject({ method: "GET", url: `/api/projects/${encodeURIComponent(proj)}/related` })).statusCode === 401);
  assert("related induk tidak ada → 404", (await call("GET", "/api/projects/TIDAK-ADA/related")).statusCode === 404);

  /* 5b. Integritas relasi (audit 11 Nov): relasi lunak lewat nama dijaga saat
         hapus & ganti nama, ref wajib saat create, header seed-import dibatasi. */
  const tag = Date.now().toString(36).toUpperCase();
  const mk = async (table: string, data: Record<string, unknown>): Promise<string> => {
    const r = await call("POST", `/api/${table}`, { data });
    if (r.statusCode !== 201) throw new Error(`POST ${table} gagal: ${r.statusCode} ${r.body.slice(0, 160)}`);
    return (r.json() as { data: { id: string } }).data.id;
  };
  const patch = (url: string, data: Record<string, unknown>) => app.inject({ method: "PATCH", url, headers, payload: { data } });
  const nameA = `Probe Klien ${tag} A`;
  const nameB = `Probe Klien ${tag} B`;
  const cliA = await mk("clients", { name: nameA });
  const cliC = await mk("clients", { name: `Probe Klien ${tag} C` });
  const ves = await mk("vessels", { name: `Probe Kapal ${tag}`, owner: nameA.toUpperCase() });
  const delRef = await call("DELETE", `/api/clients/${cliA}`);
  assert("hapus klien yang namanya masih dipakai kapal → 409 REFERENCED", delRef.statusCode === 409 && delRef.body.includes(ves), delRef.body.slice(0, 200));
  const ren = await patch(`/api/clients/${cliA}`, { name: nameB });
  const vesAfter = (await call("GET", `/api/vessels/${ves}`)).json() as { data: { data: { owner: string } } };
  assert("ganti nama klien → owner kapal ikut berganti", ren.statusCode === 200 && vesAfter.data.data.owner === nameB, `${ren.statusCode} owner=${vesAfter.data?.data?.owner}`);
  const cascAudit = await q<{ diff: string }>("SELECT diff FROM audit_log WHERE table_name = 'vessels' AND row_id = ? ORDER BY created_at DESC LIMIT 1", [ves]);
  assert("kaskade nama tercatat di audit_log", String(cascAudit[0]?.diff ?? "").includes("_cascade"), String(cascAudit[0]?.diff ?? "").slice(0, 160));
  const clash = await patch(`/api/clients/${cliA}`, { name: `probe klien ${tag} c` });
  assert("ganti nama ke nama klien lain → 409 (tautan tidak tercampur)", clash.statusCode === 409, `${clash.statusCode} ${clash.body.slice(0, 160)}`);
  await call("DELETE", `/api/vessels/${ves}`);
  assert("klien tanpa pemakai bisa dihapus", (await call("DELETE", `/api/clients/${cliA}`)).statusCode === 200);
  await call("DELETE", `/api/clients/${cliC}`);

  const noItem = await call("POST", "/api/movements", { data: { item: "Probe tanpa katalog", itemId: "", type: "Penerimaan", qty: 1, date: "2026-11-11" } });
  assert("mutasi baru tanpa itemId → 422", noItem.statusCode === 422, `${noItem.statusCode} ${noItem.body.slice(0, 160)}`);
  const gudang = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'gudang' LIMIT 1"))[0];
  if (gudang) {
    const gh = { authorization: `Bearer ${signToken({ id: gudang.id, username: gudang.username, role: gudang.role, branch: "Samarinda", v: gudang.token_version ?? 0 })}`, "x-seed-import": "1" };
    const forged = await app.inject({ method: "POST", url: "/api/movements", headers: gh, payload: { data: { item: "Probe", itemId: "", type: "Penerimaan", qty: 1 } } });
    assert("header x-seed-import dari peran gudang tidak melewati validasi → 422", forged.statusCode === 422, `${forged.statusCode} ${forged.body.slice(0, 160)}`);
  }

  /* 6. Dokumentasi Swagger UI (/api/docs): publik, CSP longgar hanya di halaman,
        dan setiap rute (kecuali preflight OPTIONS & docs) ada di OpenAPI. */
  const page = await app.inject({ method: "GET", url: "/api/docs" });
  assert("GET /api/docs (tanpa login) → 200 HTML", page.statusCode === 200 && String(page.headers["content-type"]).startsWith("text/html"));
  assert("CSP halaman docs hanya mengizinkan skrip self + jsDelivr", String(page.headers["content-security-policy"]).includes("script-src 'self' https://cdn.jsdelivr.net"));
  const spec = (await app.inject({ method: "GET", url: "/api/docs/openapi.json" })).json() as { openapi: string; paths: Record<string, Record<string, unknown>> };
  const missing = routeList(app).filter((r) => r.method !== "OPTIONS" && !r.path.startsWith("/api/docs"))
    .filter((r) => !spec.paths[r.path.replace(/:([A-Za-z]+)/g, "{$1}")]?.[r.method.toLowerCase()]);
  assert("OpenAPI 3 mencakup semua rute API", spec.openapi.startsWith("3.") && missing.length === 0, missing.slice(0, 5).map((r) => `${r.method} ${r.path}`).join(", "));

  console.log(`\n${passed}/${total} pemeriksaan relasi lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
