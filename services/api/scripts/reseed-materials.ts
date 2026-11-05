/* Seed ulang tabel inventory dari 562 item Excel gudang (#320).
 *   npm run seed:materials            → dry-run (hanya laporan)
 *   npm run seed:materials -- --apply [--drop-orphan-movements] → backup DB, lalu ganti inventory
 * Sumber = baris inventory di seedFeMirror (hasil `seed:mirror` dari FE), jadi
 * satu sumber dengan seed frontend. Rujukan (movements, bomItems, dst.) ke id
 * lama dipindah ke id baru lewat nama; yang tak cocok dilaporkan, tidak dihapus. */
import fs from "node:fs";
import path from "node:path";
import { closeDb, exec, q, withTx } from "../src/db.js";
import { createBackup } from "../src/backup.js";
import { REFS } from "../src/refs.js";
import { FE_MIRROR_ROWS } from "../src/seedFeMirror.js";
import { buildRemap } from "../src/reseedMaterials.js";

const apply = process.argv.includes("--apply");
/* Riwayat movements impor 2024 untuk item yang tidak ada di Excel: hapus (dicadangkan ke JSON). */
const dropOrphanMovements = process.argv.includes("--drop-orphan-movements");
/* Izinkan sisa rujukan menggantung di tabel selain movements (tidak disarankan). */
const allowDangling = process.argv.includes("--allow-dangling");
const nameOf = (d: string): string => String((JSON.parse(d) as { name?: unknown }).name ?? "");

async function main(): Promise<void> {
  const fresh = FE_MIRROR_ROWS.filter((r) => r.table === "inventory");
  if (fresh.length !== 562) throw new Error(`Seed inventory harus 562 baris, ditemukan ${fresh.length}; jalankan npm run seed:mirror`);
  const old = await q<{ id: string; branch: string; data: string }>("SELECT id, branch, data FROM inventory");
  const newIds = new Set(fresh.map((r) => r.id));
  const stale = old.filter((r) => !newIds.has(r.id));
  const { remap, orphans } = buildRemap(stale.map((r) => ({ id: r.id, name: nameOf(r.data) })), fresh.map((r) => ({ id: r.id, name: String(r.data.name ?? "") })));
  const negative = old.filter((r) => Number((JSON.parse(r.data) as { stock?: unknown }).stock) < 0).length;
  console.log(`[reseed] lama=${old.length} (usang=${stale.length}, stok minus=${negative}) → baru=${fresh.length}; dipetakan=${remap.size}, yatim=${orphans.length}`);

  const orphanSet = new Set(orphans);
  const refFields: Array<[string, string]> = [];
  for (const [table, fields] of Object.entries(REFS)) for (const [f, def] of Object.entries(fields)) if (def.target === "inventory") refFields.push([table, f]);
  /* Baris demo beridentik sama (BOM-NB12-*, MR-2026-*, PR-2026-*) sudah dimutakhirkan di seed baru
     dengan itemId STK-MAT-*; ganti seluruh isinya agar item, satuan, dan jumlahnya konsisten. */
  const mirror = new Map(FE_MIRROR_ROWS.map((r) => [`${r.table}:${r.id}`, r.data]));
  const refUpdates: Array<{ table: string; id: string; data: Record<string, unknown> }> = [];
  const refOrphans: string[] = [];
  const orphanRows: Array<{ table: string; id: string; data: Record<string, unknown> }> = [];
  const byTable = new Map<string, number>();
  for (const [table, field] of refFields) {
    const rows = await q<{ id: string; data: string }>(`SELECT id, data FROM ${table}`);
    for (const r of rows) {
      const d = JSON.parse(r.data) as Record<string, unknown>;
      const v = String(d[field] ?? "");
      const fresh = mirror.get(`${table}:${r.id}`);
      if (orphanSet.has(v) && fresh) refUpdates.push({ table, id: r.id, data: fresh });
      else if (remap.has(v)) refUpdates.push({ table, id: r.id, data: { ...d, [field]: remap.get(v) } });
      else if (orphanSet.has(v)) {
        refOrphans.push(`${table}.${field}:${r.id}→${v}`);
        orphanRows.push({ table, id: r.id, data: d });
        byTable.set(`${table}.${field}`, (byTable.get(`${table}.${field}`) ?? 0) + 1);
      }
    }
  }
  console.log(`[reseed] rujukan dipindah=${refUpdates.length}, rujukan yatim=${refOrphans.length}`);
  for (const [k, n] of byTable) console.log(`  yatim per tabel: ${k} = ${n}`);
  for (const o of refOrphans.slice(0, 5)) console.log(`  contoh yatim ${o}`);
  const nonMovement = orphanRows.filter((o) => o.table !== "movements");
  const dropRows = dropOrphanMovements ? orphanRows.filter((o) => o.table === "movements") : [];
  const dangling = refOrphans.length - dropRows.length;
  if (!apply) { console.log("[reseed] dry-run; tambahkan --apply untuk menjalankan."); return; }

  if (dangling > 0 && !allowDangling) {
    throw new Error(`${dangling} rujukan akan menggantung (${nonMovement.length} di luar movements). Pakai --drop-orphan-movements untuk riwayat movements, atau --allow-dangling.`);
  }
  const backup = await createBackup({ prune: false });
  fs.writeFileSync(path.join(backup.outDir, "inventory-before-reseed.json"), JSON.stringify(old.map((r) => ({ id: r.id, branch: r.branch, data: JSON.parse(r.data) })), null, 1));
  console.log(`[reseed] backup: ${backup.outDir}`);

  fs.writeFileSync(path.join(backup.outDir, "orphan-rows-dropped.json"), JSON.stringify(dropRows, null, 1));
  const now = new Date().toISOString();
  await withTx(async () => {
    for (const d of dropRows) await exec(`DELETE FROM ${d.table} WHERE id = ?`, [d.id]);
    for (const u of refUpdates) await exec(`UPDATE ${u.table} SET data = ?, updated_at = ? WHERE id = ?`, [JSON.stringify(u.data), now, u.id]);
    for (const r of stale) await exec("DELETE FROM inventory WHERE id = ?", [r.id]);
    const have = new Set(old.map((r) => r.id));
    for (const r of fresh) {
      if (have.has(r.id)) await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(r.data), now, r.id]);
      else await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [r.id, r.branch || "Samarinda", JSON.stringify(r.data), now]);
    }
  });
  const [{ n }] = await q<{ n: number }>("SELECT COUNT(*) AS n FROM inventory");
  console.log(`[reseed] selesai: inventory=${n}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => { void closeDb(); });
