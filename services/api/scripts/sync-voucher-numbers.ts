/* Beri nomor voucher (VJ/YYYY/MM/NNNN) pada jurnal lama yang belum punya
 * (K17-FIN-08). Jurnal baru sudah dinomori server saat dibuat. Satu transaksi
 * (`dokumen` sama) = satu nomor; urut per bulan menurut tanggal lalu id,
 * melanjutkan nomor tertinggi yang sudah ada. Idempoten.
 * Jalankan: npm run sync:voucher-numbers            (dry-run, tidak menulis)
 *           npm run sync:voucher-numbers -- --apply */
import { closeDb, exec, q } from "../src/db.js";
import { voucherPrefix } from "../src/voucher.js";

type Data = Record<string, unknown>;
const apply = process.argv.includes("--apply");
const rows = (await q<{ id: string; data: string }>("SELECT id, data FROM journals", []))
  .map((r) => ({ id: r.id, d: JSON.parse(r.data) as Data }));
const max = new Map<string, number>();
const byDok = new Map<string, string>();
for (const r of rows) {
  const no = String(r.d.voucherNo ?? "");
  if (!no) continue;
  const prefix = no.slice(0, no.lastIndexOf("/") + 1);
  max.set(prefix, Math.max(max.get(prefix) ?? 0, Number(no.slice(prefix.length)) || 0));
  if (r.d.dokumen) byDok.set(String(r.d.dokumen), no);
}
const todo = rows.filter((r) => !String(r.d.voucherNo ?? ""))
  .sort((a, b) => String(a.d.date ?? "").localeCompare(String(b.d.date ?? "")) || a.id.localeCompare(b.id));
let written = 0;
for (const r of todo) {
  const dok = String(r.d.dokumen ?? "");
  let no = dok ? byDok.get(dok) : undefined;
  if (!no) {
    const prefix = voucherPrefix(r.d.date);
    const n = (max.get(prefix) ?? 0) + 1;
    max.set(prefix, n);
    no = `${prefix}${String(n).padStart(4, "0")}`;
    if (dok) byDok.set(dok, no);
  }
  if (apply) await exec("UPDATE journals SET data = ? WHERE id = ?", [JSON.stringify({ ...r.d, voucherNo: no }), r.id]);
  written++;
}
console.log(`${apply ? "Diberi" : "[dry-run] Akan diberi"} nomor voucher: ${written} baris jurnal, ${new Set(todo.map((r) => String(r.d.dokumen ?? r.id))).size} transaksi.`);
await closeDb();
