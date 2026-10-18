/* Setiap halaman hanya menarik koleksi yang terdaftar di useModuleSync(...).
   Resync penuh tidak lagi berjalan saat boot, dan AppShell melewatinya bila
   halaman baru saja menarik batch-nya sendiri - jadi koleksi yang DIPAKAI
   halaman tetapi tidak DIDAFTARKAN tidak pernah diambil dari server: tampil
   kosong/basi (mis. BoQ & WO di detail proyek setelah login di perangkat baru).
   Test ini menelusuri graf impor tiap halaman dan gagal bila ada `data.<koleksi>`
   yang tidak ikut di-sync (revisi 18 Okt: "tidak dapat GET data dari model lain"). */
import { describe, expect, it } from "vitest";

/* Isi file dibaca lewat import.meta.glob (fitur Vite, bertipe lewat vite/client)
   supaya tidak perlu @types/node. Kunci dinormalkan menjadi "pages/...". */
const RAW = {
  ...import.meta.glob("../../pages/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("../../components/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("../store.tsx", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("../moduleCollections.ts", { query: "?raw", import: "default", eager: true }),
} as Record<string, string>;

function normalize(path: string): string {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}
const FILES = new Map(Object.entries(RAW).map(([k, v]) => [normalize(`data/__tests__/${k}`), v]));
const read = (p: string): string => FILES.get(p) ?? "";
const dirname = (p: string): string => p.split("/").slice(0, -1).join("/");
const existsSync = (p: string): boolean => FILES.has(p);

const store = read("data/store.tsx");
const prefixStart = store.indexOf("const PREFIX: Record<string, string> = {");
const COLLECTIONS = new Set([...store.slice(prefixStart, store.indexOf("}", prefixStart)).matchAll(/\b([A-Za-z]+):\s*"/g)].map((m) => m[1] as string));

const listIn = (src: string, name: string): string[] | null => {
  const m = new RegExp(`(?:const|let)\\s+${name}\\s*(?::[^=]*)?=\\s*(?:\\{|\\[)([\\s\\S]*?)(?:\\n\\};|\\];)`).exec(src);
  return m ? [...(m[1] ?? "").matchAll(/"([A-Za-z]+)"/g)].map((x) => x[1] as string) : null;
};
const moduleCollections = read("data/moduleCollections.ts");
const SHELL = new Set(listIn(moduleCollections, "SHELL_ALERT_COLLECTIONS") ?? []);

function resolve(from: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  const base = normalize(`${dirname(from)}/${spec}`);
  for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) if (existsSync(base + ext)) return base + ext;
  return null;
}

/** Daftar koleksi yang di-sync halaman (literal lokal, impor, atau fungsi per-tab Keuangan). */
function syncedBy(page: string, src: string): Set<string> {
  const arg = /useModuleSync\(\s*([A-Za-z_]+)/.exec(src)?.[1] ?? "";
  if (arg === "financeCollectionsForTab") {
    // Keuangan memuat per tab: gabungan semua daftar tab + ringkasan + settings.
    return new Set(["settings", ...[...moduleCollections.matchAll(/"([A-Za-z]+)"/g)].map((m) => m[1] as string)]);
  }
  const local = listIn(src, arg);
  if (local) return new Set(local);
  const imp = new RegExp(`import\\s*\\{[^}]*\\b${arg}\\b[^}]*\\}\\s*from\\s*"([^"]+)"`).exec(src);
  const file = imp ? resolve(page, imp[1] ?? "") : null;
  return new Set((file && listIn(read(file), arg)) ?? []);
}

function usedBy(page: string): Map<string, Set<string>> {
  const used = new Map<string, Set<string>>();
  const seen = new Set<string>();
  const stack = [page];
  while (stack.length) {
    const f = stack.pop() as string;
    if (seen.has(f)) continue;
    seen.add(f);
    const src = read(f);
    if (f !== page && src.includes("useModuleSync(")) continue; // halaman lain mengurus sync-nya sendiri
    for (const m of src.matchAll(/\bdata\.([A-Za-z]+)\b/g)) {
      const c = m[1] as string;
      if (COLLECTIONS.has(c)) used.set(c, (used.get(c) ?? new Set()).add(f.replace(/^pages\//, "")));
    }
    for (const m of src.matchAll(/from\s+"(\.[^"]+)"/g)) {
      const g = resolve(f, m[1] ?? "");
      if (g && (g.startsWith("pages/") || g.startsWith("components/"))) stack.push(g);
    }
  }
  return used;
}

describe("cakupan sync koleksi per halaman", () => {
  const pages = [...FILES.keys()].filter((p) => p.startsWith("pages/") && p.endsWith(".tsx") && !p.includes("__tests__") && read(p).includes("useModuleSync(")).sort();
  it("ada halaman yang diperiksa", () => expect(pages.length).toBeGreaterThan(10));
  for (const page of pages) {
    it(`${page} men-sync semua koleksi yang dipakainya`, () => {
      const synced = syncedBy(page, read(page));
      const missing = [...usedBy(page)].filter(([c]) => !synced.has(c) && !SHELL.has(c)).map(([c, files]) => `${c} (${[...files].join(", ")})`);
      expect(missing, `tambahkan ke daftar useModuleSync halaman ${page}`).toEqual([]);
    });
  }
});
