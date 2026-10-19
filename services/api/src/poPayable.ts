/* Hutang (AP) otomatis dari Purchase Order (K17-PROC-05, jawaban klien Q23:
 * "invoice otomatis dibuat saat PO disetujui").
 *
 * - PO Besar: hutang dibuat SEKALI saat status berubah ke Disetujui (semua jalur:
 *   persetujuan berjenjang, ubah status langsung, API). Penerimaan barang di
 *   klien melihat hutang ini lewat kunci `po` dan tidak membuat hutang ganda.
 * - PO Kecil: nilainya baru diketahui dari nota saat barang diterima (Q17),
 *   jadi hutangnya tetap dibuat saat penerimaan.
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

/** Dipanggil setelah PO tersimpan. Mengembalikan id hutang baru, atau null. */
export async function ensurePayableOnApproval(id: string, before: Data, after: Data, actor: string, ip?: string): Promise<string | null> {
  if (String(after.status ?? "") !== "Disetujui" || String(before.status ?? "") === "Disetujui") return null;
  if (String(after.poType ?? "") === "Kecil") return null;
  const amount = num(after.amount);
  if (amount <= 0) return null;
  if (await payableOf(id, after)) return null;
  const today = new Date().toISOString().slice(0, 10);
  const payId = `AP-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const vendor = String(after.vendor ?? "");
  const data: Data = {
    v: vendor, kodePembantu: vendor, po: poKeyOf(id, after), poId: id,
    openAwal: 0, amt: Math.round(amount), due: addDays(String(after.eta || today), 30),
    pph: "2%", st: "Belum Dibayar", vessel: String(after.vessel ?? ""), item: String(after.item ?? ""),
    pay1: 0, pay2: 0, sumber: "PO disetujui", createdAt: new Date().toISOString(),
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
