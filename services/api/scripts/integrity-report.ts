/* integrity-report.ts — laporan rujukan yatim (BACA SAJA, tidak mengubah data).
 *   npm run report:integrity
 * Memeriksa setiap relasi keras (REFS) dan lunak (SOFT_REFS, lewat nama)
 * terhadap isi database saat ini. Dipakai setelah impor/purge/restore untuk
 * memastikan tidak ada data yang menunjuk induk yang sudah tidak ada.
 * Exit code 1 bila ada rujukan keras yang yatim. */
import { closeDb, q } from "../src/db.js";
import { nameKey, REFS, SOFT_REFS } from "../src/refs.js";

type Row = { id: string; data: string };
const parse = (raw: string): Record<string, unknown> => {
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
};
const cache = new Map<string, Row[] | null>();
async function rowsOf(table: string): Promise<Row[] | null> {
  if (!cache.has(table)) {
    try { cache.set(table, await q<Row>(`SELECT id, data FROM ${table}`)); } catch { cache.set(table, null); }
  }
  return cache.get(table) ?? null;
}

async function main(): Promise<void> {
  let hard = 0;
  let soft = 0;
  for (const [child, defs] of Object.entries(REFS)) {
    for (const [field, def] of Object.entries(defs)) {
      if (def.target === "__name__") continue;
      const kids = await rowsOf(child);
      const parents = await rowsOf(def.target);
      if (!kids || !parents) continue;
      const ids = new Set(parents.map((p) => p.id));
      for (const k of kids) {
        const v = String(parse(k.data)[field] ?? "").trim();
        const bad = v === "" ? def.required === true : !(def.allow ?? []).includes(v) && !ids.has(v);
        if (bad) { hard++; console.log(`KERAS  ${child}.${field} ${k.id} → ${v === "" ? "(kosong, wajib)" : v} tidak ada di ${def.target}`); }
      }
    }
  }
  for (const l of SOFT_REFS) {
    const kids = await rowsOf(l.child);
    const parents = await rowsOf(l.target);
    if (!kids || !parents) continue;
    const keys = new Set<string>();
    for (const p of parents) { keys.add(p.id); keys.add(nameKey(parse(p.data)[l.nameField])); }
    for (const k of kids) {
      const raw = parse(k.data)[l.field];
      const v = nameKey(raw);
      if (v !== "" && v !== "-" && !keys.has(v) && !keys.has(String(raw))) { soft++; console.log(`LUNAK  ${l.child}.${l.field} ${k.id} → "${String(raw)}" tidak cocok nama ${l.target}`); }
    }
  }
  console.log(`Ringkasan: rujukan keras yatim = ${hard}, rujukan lunak (nama) tak cocok = ${soft}`);
  if (hard > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => { void closeDb(); });
