/* Invoice susulan untuk PO yang SUDAH disetujui sebelum invoice otomatis
 * berlaku untuk semua PO (Q27, 21 Okt) dan barangnya belum diterima penuh.
 * Memakai ensurePayableOnApproval yang sama dengan alur persetujuan
 * (sekali per PO, invoice "Menunggu" persetujuan Keuangan). PO Besar tanpa
 * nilai dilewati.
 *   npm run sync:po-invoices                        dry-run, tidak menulis
 *   npm run sync:po-invoices -- --apply             tulis semua kandidat
 *   npm run sync:po-invoices -- --apply --ids=A,B   hanya PO tertentu */
import { closeDb, q } from "../src/db.js";
import { ensurePayableOnApproval, poAmountOf } from "../src/poPayable.js";
import { jsonEq } from "../src/refs.js";

const OPEN = new Set(["Disetujui", "Dikirim", "Dalam Pengiriman", "Diterima Sebagian"]);
const apply = process.argv.includes("--apply");
const idsArg = process.argv.find((a) => a.startsWith("--ids="));
const only = idsArg ? new Set(idsArg.slice(6).split(",").map((s) => s.trim()).filter(Boolean)) : null;

const rows = await q<{ id: string; data: string }>("SELECT id, data FROM purchaseOrders", []);
let n = 0;
for (const r of rows) {
  const po = JSON.parse(r.data) as Record<string, unknown>;
  if (!OPEN.has(String(po.status ?? "")) || (only && !only.has(r.id))) continue;
  const docNo = String(po.docNo ?? "").trim();
  const has = await q("SELECT id FROM payables WHERE " + `${jsonEq("poId")} OR ${jsonEq("po")} OR ${jsonEq("po")} LIMIT 1`, [r.id, docNo ? `${r.id} / ${docNo}` : r.id, r.id]);
  if (has.length) continue;
  const amt = poAmountOf(po);
  if (amt <= 0 && String(po.poType ?? "") !== "Kecil") { console.log(`${r.id}: dilewati (nilai PO kosong)`); continue; }
  console.log(`${r.id}: ${String(po.poType ?? "-")} ${String(po.status)} → invoice Rp${Math.round(amt).toLocaleString("id-ID")}`);
  if (apply) {
    // "Sebelum" diberi status kosong supaya diperlakukan sebagai baru disetujui.
    const id = await ensurePayableOnApproval(r.id, { status: "" }, { ...po, status: "Disetujui" }, "sync:po-invoices");
    console.log(`  → ${id ?? "tidak dibuat"}`);
  }
  n++;
}
console.log(`${apply ? "Dibuat" : "[dry-run] Akan dibuat"}: ${n} invoice.`);
await closeDb();
