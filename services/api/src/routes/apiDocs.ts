/* Dokumentasi REST API interaktif (Swagger UI) di /api/docs.
 *
 *   GET /api/docs               halaman Swagger UI
 *   GET /api/docs/init.js       skrip inisialisasi (bukan inline, supaya CSP tetap ketat)
 *   GET /api/docs/openapi.json  spesifikasi OpenAPI 3.0
 *
 * Spesifikasi dibangkitkan dari rute yang benar-benar terdaftar (routeList),
 * sama seperti koleksi Bruno - rute baru otomatis muncul. Swagger UI dimuat
 * dari jsDelivr dengan versi terkunci, jadi tidak menambah dependensi npm.
 * Halaman & spesifikasi publik (repo juga publik); "Try it out" tetap butuh
 * token lewat tombol Authorize. */
import type { FastifyInstance } from "fastify";
import { COLLECTIONS } from "./crud.js";
import { allLinks } from "./relations.js";
import { isPublicRoute, routeList, type RouteEntry } from "../routeList.js";

const SWAGGER = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14";
/** CSP khusus halaman docs: skrip hanya dari server sendiri + jsDelivr. */
export const DOCS_CSP = `default-src 'none'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net; connect-src 'self'; frame-ancestors 'self'`;

type Json = Record<string, unknown>;

const HTML = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ISMS Galangan API</title>
  <link rel="stylesheet" href="${SWAGGER}/swagger-ui.css" />
  <style>body{margin:0;background:#fafafa}.topbar{display:none}</style>
</head>
<body>
  <div id="swagger"></div>
  <script src="${SWAGGER}/swagger-ui-bundle.js"></script>
  <script src="/api/docs/init.js"></script>
</body>
</html>`;

const INIT = `window.ui = SwaggerUIBundle({
  url: "/api/docs/openapi.json",
  dom_id: "#swagger",
  deepLinking: true,
  persistAuthorization: true,
  docExpansion: "none",
  filter: true,
  tagsSorter: "alpha",
});`;

const ok = (data: Json): Json => ({ type: "object", properties: { ok: { type: "boolean", example: true }, data } });
const ERR = { type: "object", properties: { ok: { type: "boolean", example: false }, error: { type: "object", properties: { message: { type: "string" }, code: { type: "string" } } } } };
const ROW = { type: "object", properties: { id: { type: "string" }, branch: { type: "string" }, data: { type: "object", additionalProperties: true }, updated_at: { type: "string", format: "date-time" } } };
const WRITE = { type: "object", required: ["data"], properties: { data: { type: "object", additionalProperties: true, description: "Field baris (bebas, divalidasi server)" }, branch: { type: "string", description: "Hanya direktur/developer" } } };

function tagOf(path: string): string {
  if (path === "/health") return "system";
  const seg = path.split("/")[2] ?? "system";
  return seg.startsWith(":") ? "system" : seg;
}

function operation(r: RouteEntry, collections: Set<string>): Json {
  const tag = tagOf(r.path);
  const crud = collections.has(tag);
  const params: Json[] = [...r.path.matchAll(/:([A-Za-z]+)/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } }));
  const tail = r.path.replace(/^\/api\/[^/]+/, "");
  let summary = `${r.method} ${r.path}`;
  const op: Json = { tags: [tag], operationId: `${r.method.toLowerCase()}${r.path.replace(/[^A-Za-z0-9]+/g, "_")}` };
  if (crud) {
    summary = ({
      "GET ": `Daftar ${tag}`, "POST ": `Buat ${tag}`, "GET /:id": `Ambil satu ${tag}`, "PATCH /:id": `Ubah ${tag} (merge sebagian)`,
      "DELETE /:id": `Hapus ${tag}`, "GET /:id/related": "Data lain yang merujuk baris ini", "GET /:id/expand": "Baris + data induk",
      "POST /:id/related/:child": "Buat data anak, field relasi terisi otomatis",
    } as Record<string, string>)[`${r.method} ${tail}`] ?? summary;
    if (r.method === "GET" && tail === "") {
      params.push(
        { name: "limit", in: "query", required: false, schema: { type: "integer" } },
        { name: "offset", in: "query", required: false, schema: { type: "integer" } },
        { name: "after", in: "query", required: false, schema: { type: "string" }, description: "cursor paginasi" },
        { name: "q", in: "query", required: false, schema: { type: "string" }, description: "cari teks" },
        { name: "branch", in: "query", required: false, schema: { type: "string" } },
      );
      op.description = "Filter persis per field: tambahkan `where.<field>=<nilai>` (boleh berulang), mis. `?where.projectId=NB-2025-012`.";
    }
    if (tail === "/:id/expand") params.push({ name: "fields", in: "query", required: false, schema: { type: "string", example: "*" } });
    if (tail === "/:id/related/:child") params.push({ name: "field", in: "query", required: false, schema: { type: "string" }, description: "wajib bila anak punya >1 relasi ke koleksi ini" });
  }
  op.summary = summary;
  if (params.length) op.parameters = params;
  if (["POST", "PUT", "PATCH"].includes(r.method)) {
    const schema = r.path === "/api/auth/login"
      ? { type: "object", required: ["username", "password"], properties: { username: { type: "string" }, password: { type: "string", format: "password" } } }
      : crud && (tail === "" || tail === "/:id" || tail === "/:id/related/:child") ? WRITE : { type: "object", additionalProperties: true };
    op.requestBody = { required: true, content: { "application/json": { schema } } };
  }
  op.responses = {
    200: { description: "Berhasil", content: { "application/json": { schema: ok(crud && tail === "/:id" ? ROW : { type: "object", additionalProperties: true }) } } },
    ...(r.method === "POST" ? { 201: { description: "Dibuat", content: { "application/json": { schema: ok(ROW) } } } } : {}),
    400: { description: "Permintaan tidak valid", content: { "application/json": { schema: ERR } } },
    ...(isPublicRoute(r.path) ? {} : { 401: { description: "Belum login / token tidak sah" }, 403: { description: "Peran tidak berizin" } }),
    404: { description: "Tidak ditemukan" },
    409: { description: "Konflik (data basi, terkunci, atau masih dipakai)" },
    422: { description: "Validasi domain / referensi gagal", content: { "application/json": { schema: ERR } } },
  };
  if (isPublicRoute(r.path)) op.security = [];
  return op;
}

export function buildOpenApi(routes: RouteEntry[]): Json {
  const collections = new Set(COLLECTIONS);
  const paths: Record<string, Json> = {};
  for (const r of routes) {
    if (r.path.startsWith("/api/docs") || r.method === "OPTIONS") continue;
    const key = r.path.replace(/:([A-Za-z]+)/g, "{$1}");
    (paths[key] ??= {})[r.method.toLowerCase()] = operation(r, collections);
  }
  const links = allLinks();
  const tags = [...new Set(routes.map((r) => tagOf(r.path)))].sort().map((name) => {
    const out = links.filter((l) => l.child === name).map((l) => `\`${l.field}\` → ${l.target}${l.soft ? " (id/nama)" : ""}`);
    const inn = links.filter((l) => l.target === name).map((l) => `${l.child}.${l.field}`);
    const desc = [collections.has(name) ? "Koleksi CRUD generik." : "", out.length ? `Relasi: ${out.join(", ")}.` : "", inn.length ? `Dirujuk oleh: ${inn.join(", ")}.` : ""].filter(Boolean).join(" ");
    return desc ? { name, description: desc } : { name };
  });
  return {
    openapi: "3.0.3",
    info: {
      title: "ISMS Galangan API",
      version: "1",
      description: "REST API ISMS. Login lewat `POST /api/auth/login`, salin `data.token`, lalu klik **Authorize**. Respons berbentuk `{ ok, data }` atau `{ ok: false, error: { message, code } }`. Koleksi Bruno lengkap ada di `docs/api/bruno`.",
    },
    servers: [{ url: "/" }],
    components: { securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
    security: [{ bearer: [] }],
    tags,
    paths,
  };
}

export function registerApiDocs(app: FastifyInstance): void {
  let cached: Json | null = null;
  app.get("/api/docs", async (_req, reply) => reply.type("text/html; charset=utf-8").send(HTML));
  app.get("/api/docs/init.js", async (_req, reply) => reply.type("application/javascript; charset=utf-8").send(INIT));
  app.get("/api/docs/openapi.json", async () => (cached ??= buildOpenApi(routeList(app))));
}
