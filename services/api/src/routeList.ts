/* Daftar rute Fastify yang benar-benar terdaftar, dibaca dari printRoutes().
 * Dipakai generator koleksi Bruno (scripts/gen-bruno.ts) dan spesifikasi
 * OpenAPI di /api/docs - keduanya selalu sama dengan kode, tidak ditulis manual. */
import type { FastifyInstance } from "fastify";

export interface RouteEntry { method: string; path: string }

/** printRoutes({commonPrefix:false}) berbentuk pohon; tiap tingkat 4 karakter. */
export function parseRoutes(tree: string): RouteEntry[] {
  const stack: string[] = [];
  const out: RouteEntry[] = [];
  for (const line of tree.split("\n")) {
    const m = /^([│ ]*)[├└]── (\S+)(?: \(([^)]+)\))?/.exec(line);
    if (!m) continue;
    const depth = (m[1] ?? "").length / 4;
    stack.length = depth;
    stack.push(m[2] as string);
    for (const method of (m[3] ?? "").split(",").map((s) => s.trim()).filter((s) => s && s !== "HEAD")) {
      out.push({ method, path: stack.join("") });
    }
  }
  return out;
}

export function routeList(app: FastifyInstance): RouteEntry[] {
  return parseRoutes(app.printRoutes({ commonPrefix: false }));
}

/** Rute yang bisa dipanggil tanpa token. */
export function isPublicRoute(path: string): boolean {
  return path === "/health" || path === "/api/auth/login" || path === "/api/auth/demo-login" || path.startsWith("/api/public/") || path.startsWith("/api/docs");
}
