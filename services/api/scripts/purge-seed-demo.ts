/* purge-seed-demo.ts — #335: buang data demo (seed sintetis) dari server produksi.
 *
 * Yang DIHAPUS: baris ber-ID seed (buildSeedRows) pada tabel transaksi/demo,
 * semua baris yang memuat kata "Contoh" (nama sintetis pengganti nama riil),
 * dan baris non-seed yang merujuk baris terhapus lewat REFS (kaskade).
 * Yang DIPERTAHANKAN: data master dari file klien (KEEP_TABLES) dan users.
 *
 * Default dry-run (hanya laporan). `--apply` menulis backup JSON lalu menghapus
 * dalam satu transaksi. Baris yang pernah disentuh pengguna (ada di audit_log)
 * dilaporkan terpisah dan ikut dihapus hanya bila `--include-touched`. */
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { closeDb, exec, q, withTx } from "../src/db.js";
import { buildSeedRows } from "../src/seedData.js";
import { REFS } from "../src/refs.js";
import { COLLECTIONS } from "../src/routes/crud.js";

const APPLY = process.argv.includes("--apply");
const INCLUDE_TOUCHED = process.argv.includes("--include-touched");
const KEEP_TABLES = new Set(["settings", "coa", "branches", "warehouses", "inventory", "assets", "journals"]);
const CONTOH = /contoh/i;

type Row = { id: string; data: string };
const seedIds = new Map<string, Set<string>>();
for (const r of buildSeedRows()) {
  if (!seedIds.has(r.table)) seedIds.set(r.table, new Set());
  seedIds.get(r.table)!.add(r.id);
}

const rows = new Map<string, Row[]>();
for (const t of COLLECTIONS) {
  try { rows.set(t, await q<Row>(`SELECT id, data FROM ${t}`)); } catch { /* tabel belum ada */ }
}

// 1. Kandidat awal: seed-id di tabel non-master + baris "Contoh" di tabel non-master.
const doomed = new Map<string, Set<string>>();
const mark = (t: string, id: string): boolean => {
  if (!doomed.has(t)) doomed.set(t, new Set());
  const s = doomed.get(t)!;
  if (s.has(id)) return false;
  s.add(id);
  return true;
};
for (const [t, list] of rows) {
  if (KEEP_TABLES.has(t)) continue;
  for (const r of list) if (seedIds.get(t)?.has(r.id) || CONTOH.test(r.data)) mark(t, r.id);
}

// 2. Kaskade lewat REFS sampai stabil.
let grew = true;
while (grew) {
  grew = false;
  for (const [t, fields] of Object.entries(REFS)) {
    if (KEEP_TABLES.has(t)) continue;
    for (const r of rows.get(t) ?? []) {
      if (doomed.get(t)?.has(r.id)) continue;
      let d: Record<string, unknown>;
      try { d = JSON.parse(r.data) as Record<string, unknown>; } catch { continue; }
      for (const [f, def] of Object.entries(fields)) {
        const v = String(d[f] ?? "");
        if (v && doomed.get(def.target)?.has(v) && mark(t, r.id)) grew = true;
      }
    }
  }
}

// 3. Baris yang pernah diubah pengguna (audit_log) dipisahkan.
const touched = new Map<string, Set<string>>();
for (const [t, ids] of doomed) {
  const audit = await q<{ row_id: string; actor: string }>("SELECT row_id, actor FROM audit_log WHERE table_name = ?", [t]);
  for (const a of audit) if (ids.has(a.row_id)) {
    if (!touched.has(t)) touched.set(t, new Set());
    touched.get(t)!.add(a.row_id);
  }
}

let total = 0;
console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — rencana hapus per tabel (tersentuh pengguna di kurung):`);
for (const [t, ids] of [...doomed].sort()) {
  const tc = touched.get(t)?.size ?? 0;
  total += ids.size;
  console.log(`  ${t.padEnd(20)} ${String(ids.size).padStart(5)}  (${tc})${tc ? `  cth: ${[...touched.get(t)!].slice(0, 5).join(", ")}` : ""}`);
}
const projIds = [...(doomed.get("projects") ?? [])];
console.log(`Total ${total} baris + wbs/team untuk ${projIds.length} proyek.`);

if (APPLY) {
  const del = new Map<string, string[]>();
  for (const [t, ids] of doomed) del.set(t, [...ids].filter((id) => INCLUDE_TOUCHED || !touched.get(t)?.has(id)));
  const backup: Record<string, Row[]> = {};
  for (const [t, ids] of del) { const s = new Set(ids); backup[t] = (rows.get(t) ?? []).filter((r) => s.has(r.id)); }
  for (const side of ["wbs_by_project", "team_by_project"]) {
    try { backup[side] = (await q<Row & { project_id: string }>(`SELECT * FROM ${side}`)).filter((r) => projIds.includes(r.project_id)); } catch { /* tidak ada */ }
  }
  // Backup berisi data produksi: ditulis di luar repo (repo publik).
  const file = join(process.env.BACKUP_DIR ?? homedir(), `backup-purge-demo-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(backup));
  console.log(`Backup ditulis: ${file}`);
  await withTx(async () => {
    for (const [t, ids] of del) for (const id of ids) await exec(`DELETE FROM ${t} WHERE id = ?`, [id]);
    for (const side of ["wbs_by_project", "team_by_project"]) for (const id of projIds) await exec(`DELETE FROM ${side} WHERE project_id = ?`, [id]).catch(() => undefined);
  });
  console.log(`Selesai: ${[...del.values()].reduce((s, l) => s + l.length, 0)} baris dihapus.`);
}
await closeDb();
