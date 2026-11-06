/* purge-seed-demo.ts — #335: buang data demo (seed sintetis) dari server produksi.
 *
 * Yang DIHAPUS: baris ber-ID seed (buildSeedRows) pada tabel transaksi/demo,
 * semua baris yang memuat kata "Contoh" (nama sintetis pengganti nama riil),
 * dan baris non-seed yang merujuk baris terhapus lewat REFS (kaskade).
 * Yang DIPERTAHANKAN: data master dari file klien (KEEP_TABLES) dan users.
 *
 * Default dry-run (hanya laporan). `--apply` menjalankan pemetaan, backup
 * JSON (semua kolom, mode 600, di luar repo), dan penghapusan dalam SATU
 * transaksi. Baris yang pernah disentuh pengguna (ada di audit_log) dilaporkan
 * terpisah dan ikut dihapus hanya bila `--include-touched`. */
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
const SIDE_TABLES = ["wbs_by_project", "team_by_project"];
const CONTOH = /contoh/i;

type Row = Record<string, unknown> & { id: string; data: string };

/** Hanya "tabel tidak ada" yang boleh dilewati; galat lain menggagalkan purge. */
function missingTable(err: unknown): boolean {
  return /no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(err instanceof Error ? `${err.message} ${(err as { code?: string }).code ?? ""}` : String(err));
}
async function selectAll<T>(sql: string): Promise<T[] | null> {
  try { return await q<T>(sql); } catch (err) { if (missingTable(err)) return null; throw err; }
}

async function run(): Promise<void> {
  const seedIds = new Map<string, Set<string>>();
  for (const r of buildSeedRows()) {
    if (!seedIds.has(r.table)) seedIds.set(r.table, new Set());
    seedIds.get(r.table)!.add(r.id);
  }
  const rows = new Map<string, Row[]>();
  for (const t of COLLECTIONS) {
    const list = await selectAll<Row>(`SELECT * FROM ${t}`);
    if (list) rows.set(t, list);
  }

  // 1. Kandidat awal: seed-id + baris "Contoh" di tabel non-master.
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
    const audit = await q<{ row_id: string }>("SELECT row_id FROM audit_log WHERE table_name = ?", [t]);
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
  console.log(`Total ${total} baris + wbs/team untuk ${doomed.get("projects")?.size ?? 0} proyek.`);
  if (!APPLY) return;

  const del = new Map<string, string[]>();
  for (const [t, ids] of doomed) del.set(t, [...ids].filter((id) => INCLUDE_TOUCHED || !touched.get(t)?.has(id)));
  // WBS/tim hanya untuk proyek yang BENAR-BENAR dihapus (ikut filter tersentuh).
  const projIds = new Set(del.get("projects") ?? []);
  const backup: Record<string, Record<string, unknown>[]> = {};
  for (const [t, ids] of del) { const s = new Set(ids); backup[t] = (rows.get(t) ?? []).filter((r) => s.has(r.id)); }
  for (const side of SIDE_TABLES) {
    const list = await selectAll<Record<string, unknown>>(`SELECT * FROM ${side}`);
    if (list) backup[side] = list.filter((r) => projIds.has(String(r.project_id)));
  }
  // Backup berisi data produksi: ditulis di luar repo (repo publik), hanya pemilik.
  const file = join(process.env.BACKUP_DIR ?? homedir(), `backup-purge-demo-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(backup), { mode: 0o600 });
  console.log(`Backup ditulis: ${file}`);
  for (const [t, ids] of del) for (const id of ids) await exec(`DELETE FROM ${t} WHERE id = ?`, [id]);
  for (const side of SIDE_TABLES) {
    if (!backup[side]) continue;
    for (const id of projIds) await exec(`DELETE FROM ${side} WHERE project_id = ?`, [id]);
  }
  console.log(`Selesai: ${[...del.values()].reduce((s, l) => s + l.length, 0)} baris dihapus.`);
}

// --apply: pemetaan, backup, dan hapus dalam satu transaksi agar tidak ada perubahan di sela-selanya.
await (APPLY ? withTx(run) : run());
await closeDb();
