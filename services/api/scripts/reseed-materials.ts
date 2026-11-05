/* Seed ulang tabel inventory dari 562 item Excel gudang (#320).
 *   npm run seed:materials            → dry-run (hanya laporan)
 *   npm run seed:materials -- --apply → backup DB, lalu ganti inventory
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

  const refFields: Array<[string, string]> = [];
  for (const [table, fields] of Object.entries(REFS)) for (const [f, def] of Object.entries(fields)) if (def.target === "inventory") refFields.push([table, f]);
  const refUpdates: Array<{ table: string; id: string; data: Record<string, unknown> }> = [];
  const refOrphans: string[] = [];
  for (const [table, field] of refFields) {
    const rows = await q<{ id: string; data: string }>(`SELECT id, data FROM ${table}`);
    for (const r of rows) {
      const d = JSON.parse(r.data) as Record<string, unknown>;
      const v = String(d[field] ?? "");
      if (remap.has(v)) refUpdates.push({ table, id: r.id, data: { ...d, [field]: remap.get(v) } });
      else if (orphans.includes(v)) refOrphans.push(`${table}.${field}:${r.id}→${v}`);
    }
  }
  console.log(`[reseed] rujukan dipindah=${refUpdates.length}, rujukan yatim=${refOrphans.length}`);
  for (const o of refOrphans.slice(0, 20)) console.log(`  yatim ${o}`);
  if (!apply) { console.log("[reseed] dry-run; tambahkan --apply untuk menjalankan."); return; }

  const backup = await createBackup({ prune: false });
  fs.writeFileSync(path.join(backup.outDir, "inventory-before-reseed.json"), JSON.stringify(old.map((r) => ({ id: r.id, branch: r.branch, data: JSON.parse(r.data) })), null, 1));
  console.log(`[reseed] backup: ${backup.outDir}`);

  const now = new Date().toISOString();
  await withTx(async () => {
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
