/* Pindahkan proyek skema 7 tahap ke skema 8 tahap (keputusan 21 Okt; Q20 meminta
 * migrasi yang aman: pemetaan jelas, cadangan, bisa dibatalkan).
 *   npm run migrate:project-stages              dry-run, tidak menulis
 *   npm run migrate:project-stages -- --apply   tulis (cadangan JSON dulu)
 *   npm run migrate:project-stages -- --revert  kembalikan dari field tahapV1
 * Cadangan: $BACKUP_DIR (bawaan ../../.isms-data/backups). */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { closeDb, exec, q } from "../src/db.js";
import { migrateStage, revertStage } from "../src/projectStages.js";

const apply = process.argv.includes("--apply");
const revert = process.argv.includes("--revert");
const rows = await q<{ id: string; data: string }>("SELECT id, data FROM projects", []);
const todo = rows
  .map((r) => ({ id: r.id, before: JSON.parse(r.data) as Record<string, unknown> }))
  .map((r) => ({ ...r, after: revert ? revertStage(r.before) : migrateStage(r.before) }))
  .filter((r) => r.after !== null);

for (const r of todo) console.log(`${r.id}: ${String(r.before.tahap ?? "-")} → ${String(r.after?.tahap ?? "-")}`);
if ((apply || revert) && todo.length) {
  const dir = process.env.BACKUP_DIR ?? "../../.isms-data/backups";
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `projects-stages-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(todo.map((r) => ({ id: r.id, data: r.before }))));
  console.log(`Cadangan: ${file}`);
  const now = new Date().toISOString();
  for (const r of todo) await exec("UPDATE projects SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(r.after), now, r.id]);
}
console.log(`${apply || revert ? "Ditulis" : "[dry-run] Akan ditulis"} (${revert ? "revert" : "migrasi"}): ${todo.length} proyek.`);
await closeDb();
