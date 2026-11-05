/* Seed ulang inventori dari Excel "Material Stock Gudang" (#320).
 * Bagian murni (tanpa DB) dipisah agar bisa dites; eksekusi ada di
 * scripts/reseed-materials.ts. */

export interface InvRow { id: string; name: string }

const norm = (s: string): string => s.trim().replace(/\s+/g, " ").toLowerCase();

/** Peta id lama → id baru lewat nama sama. Nama ganda di Excel (mis. dua baris
 *  "RING PER 1/2 BIASA") dipetakan ke kemunculan pertama; sisanya dilaporkan
 *  sebagai yatim bila tidak ada nama yang cocok. */
export function buildRemap(oldRows: InvRow[], newRows: InvRow[]): { remap: Map<string, string>; orphans: string[] } {
  const byName = new Map<string, string>();
  for (const r of newRows) if (!byName.has(norm(r.name))) byName.set(norm(r.name), r.id);
  const newIds = new Set(newRows.map((r) => r.id));
  const remap = new Map<string, string>();
  const orphans: string[] = [];
  for (const r of oldRows) {
    if (newIds.has(r.id)) continue;
    const to = byName.get(norm(r.name));
    if (to) remap.set(r.id, to); else orphans.push(r.id);
  }
  return { remap, orphans };
}
