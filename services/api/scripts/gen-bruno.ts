/* gen-bruno.ts — koleksi Bruno (docs/api/bruno) dibangkitkan dari rute Fastify
 * yang benar-benar terdaftar (revisi 18 Okt: "dokumentasi API pakai Bruno").
 *   npm run gen:bruno            tulis ulang koleksi
 *   npm run probe:bruno          (--check) gagal bila ada rute yang belum
 *                                terdokumentasi / dokumentasi basi
 * Isi dibangkitkan penuh supaya tidak pernah tertinggal dari kode; catatan
 * manual taruh di docs/api/README.md, bukan di file .bru. */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "../src/app.js";
import { COLLECTIONS } from "../src/routes/crud.js";
import { allLinks } from "../src/routes/relations.js";
import { isPublicRoute, routeList } from "../src/routeList.js";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../docs/api/bruno");
const CHECK = process.argv.includes("--check");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "isms-local-dev-jwt-secret-key-32chars-minimum-length-ok";
}


const files = new Map<string, string>();
const put = (rel: string, body: string): void => { files.set(rel, body.endsWith("\n") ? body : `${body}\n`); };
const seqOf = new Map<string, number>();
const METHOD_ORDER = ["GET", "POST", "PUT", "PATCH", "DELETE"];


function bru(folder: string, name: string, method: string, path: string, opts: { body?: string; docs?: string; script?: string; query?: Record<string, string> } = {}): void {
  const seq = (seqOf.get(folder) ?? 0) + 1;
  seqOf.set(folder, seq);
  const params = [...path.matchAll(/:([A-Za-z]+)/g)].map((m) => m[1] as string);
  const query = Object.entries(opts.query ?? {});
  const qs = query.length ? `?${query.map(([k, v]) => `${k}=${v}`).join("&")}` : "";
  const isPublic = isPublicRoute(path);
  const hasBody = ["POST", "PUT", "PATCH"].includes(method);
  const parts = [
    `meta {\n  name: ${name}\n  type: http\n  seq: ${seq}\n}`,
    `${method.toLowerCase()} {\n  url: {{baseUrl}}${path}${qs}\n  body: ${hasBody ? "json" : "none"}\n  auth: ${isPublic ? "none" : "inherit"}\n}`,
  ];
  if (query.length) parts.push(`params:query {\n${query.map(([k, v]) => `  ${k}: ${v}`).join("\n")}\n}`);
  if (params.length) parts.push(`params:path {\n${params.map((p) => `  ${p}: {{${p}}}`).join("\n")}\n}`);
  if (hasBody) parts.push(`body:json {\n${(opts.body ?? "{}").split("\n").map((l) => `  ${l}`).join("\n")}\n}`);
  if (opts.script) parts.push(`script:post-response {\n${opts.script.split("\n").map((l) => `  ${l}`).join("\n")}\n}`);
  if (opts.docs) parts.push(`docs {\n${opts.docs.split("\n").map((l) => `  ${l}`).join("\n")}\n}`);
  const fname = `${name.replace(/[^A-Za-z0-9 _-]+/g, "").trim().replace(/\s+/g, "-")}.bru`;
  put(`${folder}/${fname}`, parts.join("\n\n"));
}

async function main(): Promise<void> {
  const app = buildApp();
  await app.ready();
  const routes = routeList(app);
  await app.close();

  put("bruno.json", JSON.stringify({ version: "1", name: "ISMS Galangan API", type: "collection", ignore: ["node_modules", ".git"] }, null, 2));
  put("collection.bru", [
    "auth {\n  mode: bearer\n}",
    "auth:bearer {\n  token: {{token}}\n}",
    [
      "docs {",
      "  # ISMS Galangan REST API",
      "  1. Pilih environment (Lokal / Server).",
      "  2. Jalankan Auth/Login - token tersimpan otomatis ke variabel {{token}}.",
      "  3. Semua request lain mewarisi Bearer {{token}}.",
      "  Respons berbentuk { ok, data } atau { ok:false, error:{ message, code } }.",
      "  Koleksi ini DIBANGKITKAN oleh services/api/scripts/gen-bruno.ts - jangan diedit manual.",
      "}",
    ].join("\n"),
  ].join("\n\n"));
  const envVars = (base: string): string => `vars {\n  baseUrl: ${base}\n  username: developer\n  id: \n  child: \n}\nvars:secret [\n  password,\n  token\n]`;
  put("environments/Lokal.bru", envVars("http://localhost:3000"));
  put("environments/Server.bru", envVars("https://galangan.alk-tech.my.id"));

  const covered = new Set<string>();
  const mark = (method: string, path: string): void => { covered.add(`${method} ${path}`); };
  const links = allLinks();

  /* 1. CRUD generik + relasi, satu folder per koleksi. */
  for (const table of [...COLLECTIONS].sort()) {
    const folder = `CRUD/${table}`;
    put(`${folder}/folder.bru`, `meta {\n  name: ${table}\n}`);
    const out = links.filter((l) => l.child === table);
    const inn = links.filter((l) => l.target === table);
    const relDocs = [
      out.length ? `Field relasi (merujuk koleksi lain):\n${out.map((l) => `- ${l.field} -> ${l.target}${l.soft ? " (lunak: id atau nama)" : ""}`).join("\n")}` : "",
      inn.length ? `Dirujuk oleh:\n${inn.map((l) => `- ${l.child}.${l.field}`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");
    const base = `/api/${table}`;
    bru(folder, `List ${table}`, "GET", base, {
      query: { limit: "50" },
      docs: `Daftar baris (terbaru dulu). Query opsional:\n- limit, offset, atau after=<cursor> (paginasi)\n- q (cari teks), branch (filter cabang)\n- where.<field>=<nilai> (filter persis, bisa berulang)\n\n${relDocs}`.trim(),
    });
    bru(folder, `Get ${table}`, "GET", `${base}/:id`);
    bru(folder, `Create ${table}`, "POST", base, { body: "{\n  \"data\": {}\n}", docs: `Field relasi divalidasi (422 bila induk tidak ada).\n\n${relDocs}`.trim() });
    bru(folder, `Update ${table}`, "PATCH", `${base}/:id`, { body: "{\n  \"data\": {}\n}", docs: "Merge sebagian field ke data." });
    bru(folder, `Delete ${table}`, "DELETE", `${base}/:id`, { docs: "409 bila masih dirujuk koleksi lain." });
    bru(folder, `Related ${table}`, "GET", `${base}/:id/related`, { docs: `Semua baris koleksi lain yang merujuk baris ini.\n\n${relDocs}`.trim() });
    bru(folder, `Expand ${table}`, "GET", `${base}/:id/expand`, { query: { fields: "*" }, docs: "Baris + data induk untuk field relasi (fields=a,b atau *)." });
    bru(folder, `Create related from ${table}`, "POST", `${base}/:id/related/:child`, { body: "{\n  \"data\": {}\n}", docs: "Buat baris koleksi :child dengan field relasinya terisi otomatis. Tambah ?field= bila :child punya lebih dari satu relasi ke koleksi ini." });
    for (const m of ["GET", "POST"]) mark(m, base);
    for (const m of ["GET", "PATCH", "DELETE"]) mark(m, `${base}/:id`);
    mark("GET", `${base}/:id/related`);
    mark("GET", `${base}/:id/expand`);
    mark("POST", `${base}/:id/related/:child`);
  }

  /* 2. Rute khusus: dikelompokkan per segmen pertama setelah /api. */
  const special = routes
    .filter((r) => !covered.has(`${r.method} ${r.path}`))
    .sort((a, b) => a.path.localeCompare(b.path) || METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method));
  const folders = new Set<string>();
  for (const r of special) {
    const seg = r.path === "/health" ? "system" : (r.path.split("/")[2] ?? "system").replace(/^:.*/, "system");
    const folder = seg === "auth" ? "Auth" : `Khusus/${seg}`;
    if (!folders.has(folder)) { folders.add(folder); put(`${folder}/folder.bru`, `meta {\n  name: ${folder.split("/").pop()}\n}`); }
    const tail = r.path.replace(/^\/api\/[^/]+/, "").replace(/[/:]+/g, " ").trim();
    const name = `${r.method} ${seg}${tail ? ` ${tail}` : ""}`;
    if (r.path === "/api/auth/login" && r.method === "POST") {
      bru(folder, "Login", r.method, r.path, {
        body: "{\n  \"username\": \"{{username}}\",\n  \"password\": \"{{password}}\"\n}",
        script: "if (res.body?.data?.token) bru.setEnvVar(\"token\", res.body.data.token);",
        docs: "Isi password di environment (variabel rahasia). Token hasil login disimpan ke {{token}}.",
      });
    } else if (r.path === "/api/rbac" && r.method === "PUT") {
      // Contoh body nyata; body kosong ditolak 400 sehingga request tidak bisa langsung dicoba.
      bru(folder, name, r.method, r.path, {
        body: "{\n  \"override\": {\n    \"commercial\": { \"deny\": [\"sdm\", \"payroll\"], \"finTabs\": [\"Invoice\"] }\n  }\n}",
        docs: "Hanya developer. override per peran menggantikan default; {} = kembali ke default. finTabs null = semua tab Keuangan.",
      });
    } else {
      bru(folder, name, r.method, r.path);
    }
    mark(r.method, r.path);
  }

  const missing = routes.filter((r) => !covered.has(`${r.method} ${r.path}`));
  if (missing.length) throw new Error(`Rute belum terdokumentasi: ${missing.map((r) => `${r.method} ${r.path}`).join(", ")}`);

  /* Tulis / bandingkan. */
  const existing = new Map<string, string>();
  const walk = (d: string, rel = ""): void => {
    let entries: string[] = [];
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      const p = join(d, e);
      const r = rel ? `${rel}/${e}` : e;
      if (e.endsWith(".bru") || e.endsWith(".json")) existing.set(r, readFileSync(p, "utf8"));
      else walk(p, r);
    }
  };
  walk(OUT);
  const stale = [...new Set([...files.keys(), ...existing.keys()])].filter((k) => files.get(k) !== existing.get(k)).sort();
  if (CHECK) {
    if (stale.length) {
      console.error(`[FAIL] koleksi Bruno basi (${stale.length} file), jalankan: npm run gen:bruno\n${stale.slice(0, 20).join("\n")}`);
      process.exitCode = 1;
    } else {
      console.log(`[PASS] koleksi Bruno mencakup ${routes.length} rute (${files.size} file).`);
    }
    return;
  }
  rmSync(OUT, { recursive: true, force: true });
  for (const [rel, body] of files) {
    mkdirSync(dirname(join(OUT, rel)), { recursive: true });
    writeFileSync(join(OUT, rel), body);
  }
  console.log(`Koleksi Bruno: ${routes.length} rute, ${files.size} file → docs/api/bruno`);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
