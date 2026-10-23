/* rbac-modules-probe.ts — notulen 23 Okt (#287 #288 #289): akses modul per role,
 * pengaturan oleh developer, setting pajak untuk role Pajak, laporan/analitik
 * hanya pimpinan, dan dokumen hanya untuk role terkait. */
import { randomUUID } from "node:crypto";
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, exec, q } from "../src/db.js";
import { DEFAULT_ACCESS } from "../src/moduleAccess.js";

let passed = 0, total = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  total++;
  if (cond) { passed++; console.log(`[PASS] ${name}`); } else { process.exitCode = 1; console.error(`[FAIL] ${name} ${detail}`); }
};

const app = await buildApp();
const made: string[] = [];
const tok = async (role: string): Promise<Record<string, string>> => {
  let u = (await q<{ id: string; username: string; token_version: number }>("SELECT id, username, token_version FROM users WHERE role = ? AND is_active = 1 LIMIT 1", [role]))[0];
  if (!u) {
    const id = `probe-rbac-${role}-${randomUUID().slice(0, 6)}`;
    await exec("INSERT INTO users (id, username, pass_hash, name, role, email, is_active, token_version) VALUES (?, ?, 'x', ?, ?, ?, 1, 0)", [id, `${id}@probe.local`, `Probe ${role}`, role, `${id}@probe.local`]);
    made.push(id);
    u = { id, username: `${id}@probe.local`, token_version: 0 };
  }
  return { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role, branch: "SEMUA", v: u.token_version ?? 0 })}` };
};
const me = async (role: string) => (await app.inject({ method: "GET", url: "/api/auth/me", headers: await tok(role) })).json().data as { modules: { deny: string[]; finTabs: string[] | null } };

try {
  // #289 default notulen
  const com = await me("commercial");
  ok("commercial: tanpa SDM/QC/Procurement/Inventori/Equipment, Keuangan hanya Invoice", ["sdm", "qc", "procurement", "inventori", "equipment"].every((m) => com.modules.deny.includes(m)) && JSON.stringify(com.modules.finTabs) === '["Invoice"]', JSON.stringify(com.modules));
  ok("procurement & gudang: tanpa Proyek/Monitoring", (await me("procurement")).modules.deny.includes("monitoring") && (await me("gudang")).modules.deny.includes("proyek"));
  ok("finance & pajak: tanpa Monitoring", (await me("finance")).modules.deny.includes("monitoring") && (await me("pajak")).modules.deny.includes("monitoring"));
  ok("analisis & laporan hanya direktur", (await me("manager")).modules.deny.includes("laporan") && !(await me("direktur")).modules.deny.includes("laporan"));

  // Laporan PDF hanya pimpinan
  const lapFin = await app.inject({ method: "POST", url: "/api/pdf/render", headers: await tok("finance"), payload: { kind: "laporan", branch: "Samarinda", filters: { mode: "Mingguan" } } });
  ok("PDF laporan oleh finance → 403", lapFin.statusCode === 403, String(lapFin.statusCode));
  const lapDir = await app.inject({ method: "POST", url: "/api/pdf/render", headers: await tok("direktur"), payload: { kind: "laporan", branch: "Samarinda", filters: { mode: "Mingguan" } } });
  ok("PDF laporan oleh direktur → 200", lapDir.statusCode === 200, `${lapDir.statusCode} ${lapDir.body.slice(0, 160)}`);

  // Pajak: hanya setting grup Pajak
  const ppn = (await q<{ id: string }>("SELECT id FROM settings WHERE id = 'SET-PPN'"))[0];
  if (ppn) {
    const r = await app.inject({ method: "PATCH", url: "/api/settings/SET-PPN", headers: await tok("pajak"), payload: { data: { value: 12 } } });
    ok("pajak ubah tarif PPN → 200", r.statusCode === 200, r.body.slice(0, 120));
  }
  const kop = (await q<{ id: string }>("SELECT id FROM settings WHERE id = 'SET-KOP'"))[0];
  if (kop) {
    const r = await app.inject({ method: "PATCH", url: "/api/settings/SET-KOP", headers: await tok("pajak"), payload: { data: { label: "x" } } });
    ok("pajak ubah setting non-pajak → 403", r.statusCode === 403, String(r.statusCode));
  }
  const fin = await app.inject({ method: "PATCH", url: "/api/settings/SET-PPN", headers: await tok("finance"), payload: { data: { value: 12 } } });
  ok("finance ubah setting → 403 (tetap seperti sebelumnya)", fin.statusCode === 403, String(fin.statusCode));

  // #287 developer mengatur akses
  ok("GET /api/rbac oleh direktur → 403", (await app.inject({ method: "GET", url: "/api/rbac", headers: await tok("direktur") })).statusCode === 403);
  const dev = await tok("developer");
  const g = await app.inject({ method: "GET", url: "/api/rbac", headers: dev });
  ok("GET /api/rbac oleh developer → 200", g.statusCode === 200, g.body.slice(0, 120));
  const put = await app.inject({ method: "PUT", url: "/api/rbac", headers: dev, payload: { override: { procurement: { deny: ["proyek", "monitoring", "crm"], finTabs: null } } } });
  ok("PUT /api/rbac → 200", put.statusCode === 200, put.body.slice(0, 120));
  ok("override berlaku: procurement kini tanpa CRM", (await me("procurement")).modules.deny.includes("crm"));
  await app.inject({ method: "PUT", url: "/api/rbac", headers: dev, payload: { override: {} } });
  ok("reset override → kembali ke default", JSON.stringify((await me("procurement")).modules.deny) === JSON.stringify(DEFAULT_ACCESS.procurement.deny));

  // #288 dokumen per role
  const ids = { inv: `DOC-PRB-INV-${Date.now()}`, sj: `DOC-PRB-SJ-${Date.now()}`, none: `DOC-PRB-NT-${Date.now()}` };
  const now = new Date().toISOString();
  await exec("INSERT INTO documents (id, branch, data, updated_at) VALUES (?, 'Samarinda', ?, ?)", [ids.inv, JSON.stringify({ title: "Probe invoice", type: "Invoice" }), now]);
  await exec("INSERT INTO documents (id, branch, data, updated_at) VALUES (?, 'Samarinda', ?, ?)", [ids.sj, JSON.stringify({ title: "Probe SJ", type: "Surat Jalan" }), now]);
  await exec("INSERT INTO documents (id, branch, data, updated_at) VALUES (?, 'Samarinda', ?, ?)", [ids.none, JSON.stringify({ title: "Probe tanpa jenis" }), now]);
  const list = async (role: string): Promise<string[]> => {
    const d = (await app.inject({ method: "GET", url: "/api/documents?limit=5000", headers: await tok(role) })).json().data as unknown;
    const rows = (Array.isArray(d) ? d : ((d as { rows?: unknown[]; items?: unknown[] }).rows ?? (d as { items?: unknown[] }).items ?? [])) as { id: string }[];
    return rows.map((x) => x.id);
  };
  const com2 = await list("commercial");
  ok("commercial: tidak melihat Surat Jalan, melihat Invoice & tanpa jenis", !com2.includes(ids.sj) && com2.includes(ids.inv) && com2.includes(ids.none));
  ok("commercial GET Surat Jalan langsung → 404", (await app.inject({ method: "GET", url: `/api/documents/${ids.sj}`, headers: await tok("commercial") })).statusCode === 404);
  const finDocs = await list("finance");
  ok("finance: melihat dokumen Invoice", finDocs.includes(ids.inv));
  ok("direktur: melihat semua", (await list("direktur")).filter((x) => Object.values(ids).includes(x)).length === 3);
  for (const id of Object.values(ids)) await exec("DELETE FROM documents WHERE id = ?", [id]);
} finally {
  for (const id of made) await exec("DELETE FROM users WHERE id = ?", [id]);
  await app.close();
  await closeDb();
}
console.log(`\n${passed}/${total} pemeriksaan RBAC modul lolos.`);
