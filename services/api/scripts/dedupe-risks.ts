/* dedupe-risks.ts — pembersihan sekali jalan: risiko otomatis (source WBS/WO)
 * sempat terbuat berkali-kali akibat balapan di klien (diperbaiki lewat
 * claimAutoRisk). Menyisakan baris TERLAMA per (proyek, sumber, pekerjaan).
 * Default hanya melaporkan; tambah --apply untuk benar-benar menghapus. */
import { q, exec, closeDb } from "../src/db.js";

const apply = process.argv.includes("--apply");
const rows = await q<{ id: string; data: string; updated_at: string }>("SELECT id, data, updated_at FROM risks ORDER BY updated_at ASC, id ASC", []);
const seen = new Set<string>();
const doomed: string[] = [];
for (const r of rows) {
  let d: Record<string, unknown>;
  try { d = JSON.parse(r.data) as Record<string, unknown>; } catch { continue; }
  const source = String(d.source ?? "");
  if (source !== "WBS" && source !== "WO") continue; // risiko manual tidak disentuh
  const key = `${String(d.project ?? "")}|${source}|${String(d.wbsTask ?? "")}`;
  if (seen.has(key)) doomed.push(r.id); else seen.add(key);
}
console.log(`[dedupe-risks] ${rows.length} baris, ${doomed.length} duplikat otomatis${apply ? " — dihapus" : " (laporan saja; pakai --apply)"}`);
if (apply) for (const id of doomed) await exec("DELETE FROM risks WHERE id = ?", [id]);
await closeDb();
