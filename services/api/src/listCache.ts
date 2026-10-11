/* Cache respons daftar (GET koleksi) di memori + ETag, supaya banyak tab /
 * polling / sinkron berulang tidak membebani DB dan jaringan.
 *
 * - Entri dihapus begitu ada tulis ke tabelnya (dbEvents) dan kedaluwarsa
 *   sendiri setelah TTL pendek.
 * - Setiap invalidasi menaikkan generasi tabel. GET menangkap generasi sebelum
 *   query DB dan hanya boleh mengisi cache jika generasi belum berubah, sehingga
 *   respons GET in-flight pra-tulis tidak dapat menghidupkan kembali cache basi.
 * - Commit transaksi juga menginvalidasi ulang: GET yang dimulai setelah event
 *   tulis pre-commit tetap tidak dapat menyimpan snapshot sebelum commit.
 * - ETag memungkinkan balasan 304 tanpa badan bila isi belum berubah.
 * ponytail: Map di memori = satu instans API; pakai Redis bila diskalakan. */
import { createHash } from "node:crypto";
import { dbEvents } from "./db.js";

const TTL_MS = 5000;
const MAX_ENTRIES = 400;

interface Entry { at: number; table: string; etag: string; json: string }
export interface CacheGeneration { readonly cacheEpoch: number; readonly tableEpoch: number }
const cache = new Map<string, Entry>();
const tableEpochs = new Map<string, number>();
let cacheEpoch = 0;
let hits = 0;
let misses = 0;

/* Tabel yang isinya memengaruhi daftar tabel lain (lingkup tim menyaring projects). */
const ALSO: Record<string, string[]> = { team_by_project: ["projects"], employees: ["projects"] };

function invalidateTables(table: string): void {
  const targets = new Set([table, ...(ALSO[table] ?? [])]);
  for (const target of targets) {
    tableEpochs.set(target, (tableEpochs.get(target) ?? 0) + 1);
    for (const [key, entry] of cache) if (entry.table === target) cache.delete(key);
  }
}

dbEvents.on("write", invalidateTables);
/* `write` fires inside transactions before commit; this second event closes the
   window where a GET begun after that early invalidation could cache old rows. */
dbEvents.on("write-commit", invalidateTables);

export function cacheGeneration(table: string): CacheGeneration {
  return { cacheEpoch, tableEpoch: tableEpochs.get(table) ?? 0 };
}

function sameGeneration(a: CacheGeneration, b: CacheGeneration): boolean {
  return a.cacheEpoch === b.cacheEpoch && a.tableEpoch === b.tableEpoch;
}

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

export function cachePut(
  key: string,
  table: string,
  body: unknown,
  generationAtStart?: CacheGeneration,
): Entry {
  const json = JSON.stringify(body);
  const entry: Entry = { at: Date.now(), table, etag: `"${createHash("sha1").update(json).digest("base64url")}"`, json };
  const stillCurrent = generationAtStart === undefined
    || sameGeneration(generationAtStart, cacheGeneration(table));
  if (stillCurrent) {
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    cache.set(key, entry);
  }
  return entry;
}

export function cacheStats(): { entries: number; hits: number; misses: number } {
  return { entries: cache.size, hits, misses };
}

/** Untuk probe. Invalidasi epoch juga membatalkan cachePut yang sedang in-flight. */
export function cacheClear(): void {
  cache.clear();
  cacheEpoch += 1;
  hits = 0;
  misses = 0;
}
