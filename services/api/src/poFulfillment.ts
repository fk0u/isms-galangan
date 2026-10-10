/* PO terpenuhi sebagian & pengalihan vendor (F3-J-02, ETC-04).
 *
 * Model PO di ISMS per-PO (satu itemId, qty, receivedQty), jadi kuantitas
 * dilacak di level PO:
 *   qty           dipesan
 *   receivedQty   sudah diterima gudang
 *   cancelledQty  dinyatakan vendor tidak sanggup
 *   reassignedQty bagian cancelledQty yang sudah dialihkan ke PO vendor lain
 *
 * Alur: vendor A kirim sebagian → "vendor tidak sanggup" untuk sisanya →
 * "alihkan ke vendor lain" membuat PO baru (Diajukan) untuk qty itu →
 * saat barang diterima, permintaan barang proyek (materialRequests) yang
 * menunggu PR/PO ini otomatis dipenuhi dari stok yang baru masuk. */
import { randomUUID } from "node:crypto";
import { exec, q, withTx } from "./db.js";
import { DEFAULT_BRANCH } from "./routes/crud.js";
import { fulfillMaterialRequest, type FulfillResult } from "./materialRequests.js";

type Data = Record<string, unknown>;
interface Row { id: string; branch: string; data: string; updated_at: string }

export class PoError extends Error {
  constructor(public status: 404 | 409 | 422, message: string, public code: string) {
    super(message);
  }
}

const RECEIVABLE = new Set(["Dikirim", "Dalam Pengiriman", "Diterima Sebagian"]);
const CANCELLABLE = new Set(["Disetujui", "Dikirim", "Dalam Pengiriman", "Diterima Sebagian"]);

function parse(row: Row): Data {
  try { return JSON.parse(row.data) as Data; } catch { return {}; }
}
const num = (v: unknown): number => Number(v ?? 0) || 0;

async function loadPo(id: string): Promise<Row> {
  const rows = await q<Row>("SELECT id, branch, data, updated_at FROM purchaseOrders WHERE id = ?", [id]);
  if (!rows[0]) throw new PoError(404, `PO ${id} tidak ada`, "NOT_FOUND");
  return rows[0];
}

async function savePo(row: Row, data: Data, now: string): Promise<void> {
  // CAS pada updated_at DAN isi: dua tulis di milidetik yang sama tetap terdeteksi.
  const res = await exec("UPDATE purchaseOrders SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
    JSON.stringify(data), now, row.id, row.updated_at, row.data,
  ]);
  if (res.changes !== 1) throw new PoError(409, "PO berubah oleh pengguna lain — muat ulang", "STALE");
}

/** Sisa yang masih ditunggu dari vendor PO ini. PO lama tanpa qty → tak terbatas. */
export function openQty(po: Data): number {
  if (num(po.qty) <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, num(po.qty) - num(po.receivedQty) - num(po.cancelledQty));
}

/* PO konsolidasi/multi-baris berisi beberapa barang berbeda; penerimaan &
   pengalihan level-PO akan mencampur stok antar barang, jadi ditolak. */
function multiItem(po: Data): boolean {
  const lines = Array.isArray(po.lines) ? (po.lines as Data[]) : [];
  const names = new Set(lines.map((l) => String(l.name ?? "").trim().toLowerCase()).filter((n) => n !== ""));
  const prs = Array.isArray(po.prIds) ? (po.prIds as unknown[]).length : 0;
  return names.size > 1 || prs > 1;
}
const MULTI_MSG = "PO berisi beberapa barang (konsolidasi) — terima/alihkan per barang belum didukung; gunakan PO per barang";

/* Status setelah perubahan kuantitas. Semua qty sudah tuntas (diterima atau
   dibatalkan) → Diterima / Dibatalkan Sebagian; selain itu masih berjalan. */
function statusAfter(po: Data, current: string): string {
  const ordered = num(po.qty);
  const received = num(po.receivedQty);
  const cancelled = num(po.cancelledQty);
  if (ordered > 0 && received + cancelled >= ordered) return cancelled > 0 ? "Dibatalkan Sebagian" : "Diterima";
  return received > 0 ? "Diterima Sebagian" : current;
}

function prIdsOf(po: Data): string[] {
  const ids = [String(po.req ?? ""), ...(Array.isArray(po.prIds) ? (po.prIds as unknown[]).map(String) : [])];
  return [...new Set(ids.filter((x) => x !== "" && x !== "-"))];
}

export interface ReceiveInput {
  qty: number;
  itemId?: string;
  noFaktur?: string;
  tglFaktur?: string;
  dendaRp?: number;
}

export interface ReceiveResult {
  po: Data & { id: string };
  movementId: string;
  fulfilled: FulfillResult[];
}

/** Terima barang PO: stok naik + movement IN + status PO, lalu penuhi
 *  permintaan barang proyek yang menunggu PR/PO ini (satu transaksi). */
export async function receivePo(id: string, input: ReceiveInput, actor: string): Promise<ReceiveResult> {
  const qty = Number(input.qty);
  if (!Number.isFinite(qty) || qty <= 0) throw new PoError(422, "Jumlah terima harus lebih dari 0", "UNPROCESSABLE");
  return withTx(async () => {
    const row = await loadPo(id);
    const po = parse(row);
    const st = String(po.status ?? "");
    if (!RECEIVABLE.has(st)) throw new PoError(409, `PO berstatus ${st} — belum/tidak bisa diterima`, "INVALID_TRANSITION");
    if (multiItem(po)) throw new PoError(422, MULTI_MSG, "MULTI_ITEM");
    const open = openQty(po);
    if (qty > open) throw new PoError(422, `Melebihi sisa PO (${open})`, "OVER_RECEIVE");
    const itemId = String(input.itemId ?? po.itemId ?? "");
    // Setelah penerimaan pertama, barang PO terkunci: stok tidak boleh pindah SKU.
    if (num(po.receivedQty) > 0 && String(po.itemId ?? "") !== "" && itemId !== String(po.itemId)) {
      throw new PoError(422, `Barang PO sudah ditetapkan (${String(po.itemId)}) sejak penerimaan pertama`, "ITEM_LOCKED");
    }
    const inv = await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [itemId]);
    if (!inv[0]) throw new PoError(422, "Pilih item inventori penerima barang", "UNPROCESSABLE");
    const item = parse(inv[0]);
    const now = new Date().toISOString();

    // Harga rata-rata bergerak, sama dengan logika penerimaan di frontend.
    const oldStock = Math.max(0, num(item.stock));
    const unitPrice = num(po.qty) > 0 ? num(po.amount) / num(po.qty) : 0;
    const oldAvg = num(item.avgCost) > 0 ? num(item.avgCost) : num(item.cost);
    const nextItem: Data = { ...item, stock: oldStock + qty };
    if (unitPrice > 0) nextItem.avgCost = Math.round(((oldStock * oldAvg + qty * unitPrice) / (oldStock + qty)) * 100) / 100;
    const invRes = await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
      JSON.stringify(nextItem), now, inv[0].id, inv[0].updated_at, inv[0].data,
    ]);
    if (invRes.changes !== 1) throw new PoError(409, "Stok berubah oleh pengguna lain — coba lagi", "STALE");
    const movementId = `M-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    await exec("INSERT INTO movements (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      movementId, DEFAULT_BRANCH, JSON.stringify({
        item: String(item.name ?? itemId), itemId, type: "Penerimaan", qty, unit: String(item.unit ?? "pcs"),
        by: id, date: now.slice(0, 10), tone: "in", ref: { poId: id }, note: `Diterima oleh ${actor}`,
      }), now,
    ]);

    const nextPo: Data = {
      ...po,
      itemId, item: String(item.name ?? po.item ?? ""),
      receivedQty: num(po.receivedQty) + qty,
      ...(input.noFaktur !== undefined ? { noFaktur: input.noFaktur } : {}),
      ...(input.tglFaktur !== undefined ? { tglFaktur: input.tglFaktur } : {}),
      ...(input.dendaRp !== undefined ? { dendaRp: input.dendaRp } : {}),
    };
    // PO lama tanpa qty: satu kali terima dianggap lunas (perilaku lama "terima penuh").
    if (num(po.qty) <= 0) nextPo.qty = nextPo.receivedQty;
    nextPo.status = statusAfter(nextPo, st === "Dalam Pengiriman" ? "Dikirim" : st);
    await savePo(row, nextPo, now);

    /* Permintaan proyek yang menunggu PR milik PO ini (termasuk PO hasil
       pengalihan, yang menyalin PR sumbernya) dipenuhi urut tanggal. */
    const fulfilled: FulfillResult[] = [];
    const prIds = prIdsOf(nextPo);
    if (prIds.length > 0) {
      const mrs = (await q<Row>("SELECT id, branch, data, updated_at FROM materialRequests", []))
        .map((r) => ({ id: r.id, d: parse(r) }))
        .filter((m) => prIds.includes(String(m.d.requisitionId ?? "")) && String(m.d.itemId ?? "") === itemId && num(m.d.shortage) > 0)
        .sort((a, b) => String(a.d.date ?? "").localeCompare(String(b.d.date ?? "")));
      for (const m of mrs) {
        const stockNow = Math.max(0, num(parse((await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [itemId]))[0]).stock));
        if (stockNow === 0) break;
        fulfilled.push(await fulfillMaterialRequest(m.id, actor));
      }
    }
    return { po: { id, ...nextPo }, movementId, fulfilled };
  });
}

/** Vendor tidak sanggup memenuhi sebagian/seluruh sisa PO. */
export async function vendorCannotFulfill(id: string, qty: number, reason: string, actor: string): Promise<Data & { id: string }> {
  if (!Number.isFinite(qty) || qty <= 0) throw new PoError(422, "Jumlah harus lebih dari 0", "UNPROCESSABLE");
  if (reason.trim() === "") throw new PoError(422, "Alasan wajib diisi", "UNPROCESSABLE");
  return withTx(async () => {
    const row = await loadPo(id);
    const po = parse(row);
    const st = String(po.status ?? "");
    if (!CANCELLABLE.has(st)) throw new PoError(409, `PO berstatus ${st} — tidak bisa dibatalkan sebagian`, "INVALID_TRANSITION");
    if (multiItem(po)) throw new PoError(422, MULTI_MSG, "MULTI_ITEM");
    if (num(po.qty) <= 0) throw new PoError(422, "PO tanpa jumlah pesanan tidak bisa dibatalkan sebagian", "UNPROCESSABLE");
    const open = openQty(po);
    if (qty > open) throw new PoError(422, `Melebihi sisa PO yang belum diterima (${open})`, "UNPROCESSABLE");
    const now = new Date().toISOString();
    const notes = Array.isArray(po.vendorIssues) ? (po.vendorIssues as Data[]) : [];
    const next: Data = {
      ...po,
      cancelledQty: num(po.cancelledQty) + qty,
      vendorIssues: [...notes, { qty, reason: reason.trim(), by: actor, date: now.slice(0, 10) }],
    };
    next.status = statusAfter(next, st === "Dalam Pengiriman" ? "Dikirim" : st);
    await savePo(row, next, now);
    return { id, ...next };
  });
}

export interface ReassignInput { vendor: string; unitPrice?: number; eta?: string }

/** Alihkan qty yang tidak sanggup dipenuhi ke vendor lain: PO baru (Diajukan). */
export async function reassignPo(id: string, input: ReassignInput, actor: string): Promise<{ from: Data & { id: string }; to: Data & { id: string } }> {
  const vendor = input.vendor.trim();
  if (vendor === "") throw new PoError(422, "Pilih vendor pengganti", "UNPROCESSABLE");
  return withTx(async () => {
    const row = await loadPo(id);
    const po = parse(row);
    if (multiItem(po)) throw new PoError(422, MULTI_MSG, "MULTI_ITEM");
    const pending = num(po.cancelledQty) - num(po.reassignedQty);
    if (pending <= 0) throw new PoError(409, "Tidak ada qty yang menunggu dialihkan", "NOTHING_TO_REASSIGN");
    if (vendor.toLowerCase() === String(po.vendor ?? "").trim().toLowerCase()) {
      throw new PoError(422, "Vendor pengganti harus berbeda dari vendor asal", "UNPROCESSABLE");
    }
    const now = new Date().toISOString();
    const unitPrice = input.unitPrice !== undefined && input.unitPrice > 0
      ? input.unitPrice
      : (num(po.qty) > 0 ? num(po.amount) / num(po.qty) : 0);
    const newId = `PO-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const to: Data = {
      poType: po.poType ?? "Besar", item: po.item, itemId: po.itemId, vendor,
      req: po.req ?? "", ...(Array.isArray(po.prIds) ? { prIds: po.prIds } : {}),
      amount: Math.round(unitPrice * pending), qty: pending,
      lines: [{ name: String(po.item ?? ""), qty: pending, unit: String((Array.isArray(po.lines) ? (po.lines as Data[])[0]?.unit : "") ?? "pcs") || "pcs", price: Math.round(unitPrice) }],
      project: po.project ?? "-", vessel: po.vessel ?? "", eta: input.eta ?? "",
      receivedQty: 0, returnedQty: 0, cancelledQty: 0, status: "Diajukan", date: now.slice(0, 10),
      approvals: [], amendments: [], reassignedFrom: id,
      note: `Pengalihan dari ${id} (${String(po.vendor ?? "")}) oleh ${actor}`,
    };
    await exec("INSERT INTO purchaseOrders (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      newId, row.branch || DEFAULT_BRANCH, JSON.stringify(to), now,
    ]);
    const prevTo = Array.isArray(po.reassignedTo) ? (po.reassignedTo as string[]) : [];
    const from: Data = { ...po, reassignedQty: num(po.reassignedQty) + pending, reassignedTo: [...prevTo, newId] };
    await savePo(row, from, now);
    return { from: { id, ...from }, to: { id: newId, ...to } };
  });
}
