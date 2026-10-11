/* Cache respons daftar (GET koleksi) di memori + ETag, supaya banyak tab /
 * polling / sinkron berulang tidak membebani DB dan jaringan.
 *
 * - Entri dihapus begitu ada tulis ke tabelnya (dbEvents) dan kedaluwarsa
 *   sendiri setelah TTL pendek. TTL pendek itu sengaja: event tulis dipancarkan
 *   sebelum transaksi commit, jadi entri yang terisi di sela itu bisa basi
 *   sampai TTL habis.
 * - ETag memungkinkan balasan 304 tanpa badan bila isi belum berubah.
 * ponytail: Map di memori = satu instans API; pakai Redis bila diskalakan. */
import { createHash } from "node:crypto";
import { dbEvents } from "./db.js";

const TTL_MS = 5000;
const MAX_ENTRIES = 400;

interface Entry { at: number; table: string; etag: string; json: string }
const cache = new Map<string, Entry>();
let hits = 0;
let misses = 0;

/* Tabel yang isinya memengaruhi daftar tabel lain (lingkup tim menyaring projects). */
const ALSO: Record<string, string[]> = { team_by_project: ["projects"], employees: ["projects"] };

dbEvents.on("write", (table: string) => {
  const targets = new Set([table, ...(ALSO[table] ?? [])]);
  for (const [k, v] of cache) if (targets.has(v.table)) cache.delete(k);
});

export function cacheGet(key: string): Entry | null {
  const e = cache.get(key);
  if (!e || Date.now() - e.at > TTL_MS) {
    if (e) cache.delete(key);
    misses += 1;
    return null;
  }
  hits += 1;
  return e;
}

export function cachePut(key: string, table: string, body: unknown): Entry {
  const json = JSON.stringify(body);
  const entry: Entry = { at: Date.now(), table, etag: `"${createHash("sha1").update(json).digest("base64url")}"`, json };
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, entry);
  return entry;
}

export function cacheStats(): { entries: number; hits: number; misses: number } {
  return { entries: cache.size, hits, misses };
}

/** Untuk probe. */
export function cacheClear(): void { cache.clear(); hits = 0; misses = 0; }
