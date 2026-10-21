/* Hutang (AP) otomatis dari Purchase Order (K17-PROC-05, jawaban klien Q23:
 * "invoice otomatis dibuat saat PO disetujui").
 *
 * - PO Besar: hutang dibuat SEKALI saat status berubah ke Disetujui (semua jalur:
 *   persetujuan berjenjang, ubah status langsung, API). Penerimaan barang di
 *   klien melihat hutang ini lewat kunci `po` dan tidak membuat hutang ganda.
 * - PO Kecil (Q27, 21 Okt): invoice juga terbit saat Disetujui, nilainya 0 sampai
 *   nota dilengkapi lewat Ubah PO (nilai nota → nilai invoice, selama invoice
 *   belum disetujui/dibayar).
 * - Invoice dari PO menunggu persetujuan Keuangan (`persetujuan: "Menunggu"`);
 *   barang baru bisa diterima setelah invoice Disetujui atau Lunas (Q27).
 *   Hutang lama tanpa field `persetujuan` tidak ikut dikunci.
 * - Vendor tidak sanggup memenuhi sebagian: hutang yang BELUM dibayar ikut
 *   dikurangi sebesar qty yang batal; yang sudah dibayar tidak disentuh.
 * Kunci `po` sama dengan yang dipakai modul Procurement: "<id> / <docNo>". */
import { randomUUID } from "node:crypto";
import { exec, q } from "./db.js";
import { jsonEq } from "./refs.js";
import { writeAudit } from "./audit.js";
import { DEFAULT_BRANCH } from "./routes/crud.js";

type Data = Record<string, unknown>;
const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function poKeyOf(id: string, po: Data): string {
  const docNo = String(po.docNo ?? "").trim();
  return docNo ? `${id} / ${docNo}` : id;
}

async function payableOf(id: string, po: Data): Promise<{ id: string; data: Data; updated_at: string } | null> {
  const rows = await q<{ id: string; data: string; updated_at: string }>(
    `SELECT id, data, updated_at FROM payables WHERE ${jsonEq("poId")} OR ${jsonEq("po")} OR ${jsonEq("po")} LIMIT 1`,
    [id, poKeyOf(id, po), id],
  );
  const r = rows[0];
  return r ? { id: r.id, data: JSON.parse(r.data) as Data, updated_at: r.updated_at } : null;
}

const addDays = (iso: string, days: number): string => {
  const t = Date.parse(iso);
  return new Date((Number.isNaN(t) ? Date.now() : t) + days * 86400000).toISOString().slice(0, 10);
};

/** Nilai PO: `amount`, atau jumlah qty × harga baris bila `amount` kosong
 *  (PO dari pemenang RFQ pernah tersimpan tanpa amount sehingga invoice tak terbit). */
export function poAmountOf(po: Data): number {
  const kecil = String(po.poType ?? "") === "Kecil";
  if (kecil) return num(po.notaAmount) || num(po.amount);
  if (num(po.amount) > 0) return num(po.amount);
  const lines = Array.isArray(po.lines) ? (po.lines as Data[]) : [];
  return lines.reduce((s, l) => s + (num(l.qty) || 1) * num(l.price), 0);
}

/** Dipanggil setelah PO tersimpan. Mengembalikan id hutang baru, atau null. */
export async function ensurePayableOnApproval(id: string, before: Data, after: Data, actor: string, ip?: string): Promise<string | null> {
  if (String(after.status ?? "") !== "Disetujui" || String(before.status ?? "") === "Disetujui") return null;
  const kecil = String(after.poType ?? "") === "Kecil";
  const amount = poAmountOf(after);
  // PO Kecil boleh 0 (nota menyusul); PO Besar tanpa nilai tidak bisa jadi invoice.
  if (amount <= 0 && !kecil) return null;
  if (await payableOf(id, after)) return null;
  const today = new Date().toISOString().slice(0, 10);
  const payId = `AP-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const vendor = String(after.vendor ?? "");
  const data: Data = {
    v: vendor, kodePembantu: vendor, po: poKeyOf(id, after), poId: id,
    openAwal: 0, amt: Math.round(amount), due: addDays(String(after.eta || today), 30),
    pph: "2%", st: "Belum Dibayar", vessel: String(after.vessel ?? ""), item: String(after.item ?? ""),
    pay1: 0, pay2: 0, sumber: "PO disetujui", persetujuan: "Menunggu", createdAt: new Date().toISOString(),
    ...(kecil ? { noFaktur: String(after.nota ?? "") } : {}),
  };
  await exec("INSERT INTO payables (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [payId, DEFAULT_BRANCH, JSON.stringify(data), new Date().toISOString()]);
  await writeAudit({ actor, action: "create", table: "payables", rowId: payId, diff: { data, sumber: `auto dari ${id} (PO disetujui)` }, ip: ip ?? "" });
  return payId;
}

/** Vendor tidak sanggup sebagian: kurangi hutang yang belum dibayar. */
export async function shrinkPayableOnCancel(id: string, po: Data, actor: string): Promise<void> {
  const ap = await payableOf(id, po);
  if (!ap || String(ap.data.st ?? "") !== "Belum Dibayar" || num(ap.data.pay1) + num(ap.data.pay2) > 0) return;
  const ordered = num(po.qty);
  if (ordered <= 0) return;
  const remaining = Math.max(0, ordered - num(po.cancelledQty));
  const amt = Math.round((num(po.amount) * remaining) / ordered);
  if (amt === num(ap.data.amt)) return;
  const next = { ...ap.data, amt, catatanBatal: `${ordered - remaining} dari ${ordered} batal (vendor tidak sanggup)` };
  await exec("UPDATE payables SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(next), new Date().toISOString(), ap.id]);
  await writeAudit({ actor, action: "update", table: "payables", rowId: ap.id, diff: { amt: { before: ap.data.amt, after: amt }, sumber: `${id} dibatalkan sebagian` }, ip: "" });
}

/** PO Kecil: nilai & nomor nota dari Ubah PO mengikuti ke invoice yang belum
 *  disetujui/dibayar. */
export async function syncPayableFromNota(id: string, before: Data, after: Data, actor: string): Promise<void> {
  if (String(after.poType ?? "") !== "Kecil") return;
  if (num(after.notaAmount) === num(before.notaAmount) && String(after.nota ?? "") === String(before.nota ?? "")) return;
  const ap = await payableOf(id, after);
  if (!ap || String(ap.data.persetujuan ?? "") !== "Menunggu" || num(ap.data.pay1) + num(ap.data.pay2) > 0) return;
  const next = { ...ap.data, amt: Math.round(num(after.notaAmount)), noFaktur: String(after.nota ?? "") };
  await exec("UPDATE payables SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(next), new Date().toISOString(), ap.id]);
  await writeAudit({ actor, action: "update", table: "payables", rowId: ap.id, diff: { amt: { before: ap.data.amt, after: next.amt }, sumber: `nota ${id}` }, ip: "" });
}

/** Alasan penerimaan barang ditolak (Q27), atau null bila boleh. */
export async function receiveBlocker(id: string, po: Data): Promise<string | null> {
  if (String(po.poType ?? "") === "Kecil") {
    const bukti = String(po.notaUrl ?? po.buktiUrl ?? "").trim();
    if (!String(po.nota ?? "").trim() || !bukti || num(po.notaAmount) <= 0) {
      return "Lengkapi No. nota, lampiran bukti transaksi, dan nilai nota lewat Ubah PO sebelum menerima barang";
    }
  }
  const ap = await payableOf(id, po);
  if (!ap || !("persetujuan" in ap.data)) return null;
  if (String(ap.data.st ?? "") === "Lunas" || String(ap.data.persetujuan) === "Disetujui") return null;
  return `Invoice PO ${ap.id} belum disetujui Keuangan: barang baru bisa diterima setelah invoice disetujui atau lunas`;
}
