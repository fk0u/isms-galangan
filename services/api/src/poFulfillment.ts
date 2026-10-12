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
import { exec, getDialect, q, withTx } from "./db.js";
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

export interface ReceiveLineInput {
  itemId?: string;
  name?: string;
  qty: number;
  warehouse?: string;
  rack?: string;
  bin?: string;
}

export interface ReceiveInput {
  qty?: number;
  itemId?: string;
  warehouse?: string;
  rack?: string;
  bin?: string;
  noFaktur?: string;
  tglFaktur?: string;
  dendaRp?: number;
  lines?: ReceiveLineInput[];
}

export interface ReceiveResult {
  po: Data & { id: string };
  movementId: string;
  fulfilled: FulfillResult[];
}

/** Terima barang PO: stok naik + movement IN + status PO, lalu penuhi
 *  permintaan barang proyek yang menunggu PR/PO ini (satu transaksi). */
export async function receivePo(id: string, input: ReceiveInput, actor: string): Promise<ReceiveResult> {
  const hasLines = Array.isArray(input.lines) && input.lines.length > 0;
  const qty = Number(input.qty);
  if (!hasLines && (!Number.isFinite(qty) || qty <= 0)) {
    throw new PoError(422, "Jumlah terima harus lebih dari 0", "UNPROCESSABLE");
  }
  return withTx(async () => {
    const row = await loadPo(id);
    const po = parse(row);
    const st = String(po.status ?? "");
    if (!RECEIVABLE.has(st)) throw new PoError(409, `PO berstatus ${st} — belum/tidak bisa diterima`, "INVALID_TRANSITION");

    const now = new Date().toISOString();
    const fulfilled: FulfillResult[] = [];
    let lastMovementId = "";

    if (hasLines) {
      const recvLines = input.lines as ReceiveLineInput[];
      const totalLineQty = recvLines.reduce((s, l) => s + (Number(l.qty) || 0), 0);
      if (totalLineQty <= 0) throw new PoError(422, "Jumlah terima harus lebih dari 0", "UNPROCESSABLE");

      const poLines = (Array.isArray(po.lines) ? (po.lines as Data[]) : []).map((l) => ({ ...l }));
      if (poLines.length === 0) {
        throw new PoError(422, "PO tidak memiliki baris item untuk diterima per baris", "UNPROCESSABLE");
      }

      for (const rl of recvLines) {
        const lineQty = Number(rl.qty);
        if (!Number.isFinite(lineQty) || lineQty <= 0) continue;

        // Cari baris PO yang cocok: berdasarkan itemId atau nama
        const lineIdx = poLines.findIndex((l) =>
          (rl.itemId && String(l.itemId ?? "") === String(rl.itemId)) ||
          (rl.name && String(l.name ?? "").trim().toLowerCase() === String(rl.name).trim().toLowerCase()),
        );
        const targetLine = lineIdx >= 0 ? poLines[lineIdx] : undefined;
        if (!targetLine) {
          throw new PoError(422, `Baris item "${rl.name ?? rl.itemId}" tidak ditemukan di PO`, "UNPROCESSABLE");
        }

        const openLine = Math.max(0, num(targetLine.qty) - num(targetLine.receivedQty));
        if (lineQty > openLine) {
          throw new PoError(422, `Melebihi sisa item ${String(targetLine.name ?? "")} (${openLine})`, "OVER_RECEIVE");
        }

        const lineItemId = String(rl.itemId ?? targetLine.itemId ?? "");
        let invRow: Row | undefined;
        if (lineItemId) {
          const invQuery = await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [lineItemId]);
          invRow = invQuery[0];
        }
        if (!invRow && targetLine.name) {
          // Cari berdasarkan nama item jika itemId belum terikat
          const invByName = await q<Row>("SELECT id, branch, data, updated_at FROM inventory", []);
          invRow = invByName.find((r) => {
            const d = parse(r);
            return String(d.name ?? "").trim().toLowerCase() === String(targetLine.name ?? "").trim().toLowerCase();
          });
        }
        if (!invRow) {
          throw new PoError(422, `Pilih item inventori penerima barang untuk ${String(targetLine.name ?? "")}`, "UNPROCESSABLE");
        }

        const invItem = parse(invRow);
        const resolvedItemId = invRow.id;
        const oldStock = Math.max(0, num(invItem.stock));
        const unitPrice = num(targetLine.price) > 0 ? num(targetLine.price) : (num(po.amount) / Math.max(1, num(po.qty)));
        const oldAvg = num(invItem.avgCost) > 0 ? num(invItem.avgCost) : num(invItem.cost);
        const nextInvItem: Data = { ...invItem, stock: oldStock + lineQty };
        if (unitPrice > 0) nextInvItem.avgCost = Math.round(((oldStock * oldAvg + lineQty * unitPrice) / (oldStock + lineQty)) * 100) / 100;
        const targetWh = rl.warehouse ?? input.warehouse;
        const targetRack = rl.rack ?? input.rack;
        const targetBin = rl.bin ?? input.bin;
        if (targetWh) nextInvItem.warehouse = targetWh;
        if (targetRack) {
          nextInvItem.rack = targetRack;
          nextInvItem.location = targetRack;
        }
        if (targetBin) nextInvItem.bin = targetBin;

        const invRes = await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
          JSON.stringify(nextInvItem), now, invRow.id, invRow.updated_at, invRow.data,
        ]);
        if (invRes.changes !== 1) throw new PoError(409, "Stok berubah oleh pengguna lain — coba lagi", "STALE");

        const mId = `M-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
        lastMovementId = mId;
        await exec("INSERT INTO movements (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
          mId, DEFAULT_BRANCH, JSON.stringify({
            item: String(invItem.name ?? targetLine.name ?? resolvedItemId),
            itemId: resolvedItemId, type: "Penerimaan", qty: lineQty, unit: String(invItem.unit ?? targetLine.unit ?? "pcs"),
            by: id, date: now.slice(0, 10), tone: "in", ref: { poId: id }, note: `Diterima oleh ${actor}`,
          }), now,
        ]);

        targetLine.itemId = resolvedItemId;
        targetLine.receivedQty = num(targetLine.receivedQty) + lineQty;

        // Penuhi permintaan proyek jika ada
        const prIds = prIdsOf(po);
        if (prIds.length > 0) {
          const mrs = (await q<Row>("SELECT id, branch, data, updated_at FROM materialRequests", []))
            .map((r) => ({ id: r.id, d: parse(r) }))
            .filter((m) => prIds.includes(String(m.d.requisitionId ?? "")) && String(m.d.itemId ?? "") === resolvedItemId && num(m.d.shortage) > 0
              && ["", "Disetujui"].includes(String(m.d.approvalStatus ?? "")))
            .sort((a, b) => String(a.d.date ?? "").localeCompare(String(b.d.date ?? "")));
          for (const m of mrs) {
            const stockNow = Math.max(0, num(parse((await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [resolvedItemId]))[0]).stock));
            if (stockNow === 0) break;
            fulfilled.push(await fulfillMaterialRequest(m.id, actor));
          }
        }
      }

      const totalReceived = poLines.reduce((s, l) => s + num(l.receivedQty), 0);
      const totalOrdered = poLines.reduce((s, l) => s + num(l.qty), 0);
      const allCompleted = totalOrdered > 0 && poLines.every((l) => num(l.receivedQty) >= num(l.qty));

      const nextPo: Data = {
        ...po,
        lines: poLines,
        receivedQty: totalReceived,
        ...(input.noFaktur !== undefined ? { noFaktur: input.noFaktur } : {}),
        ...(input.tglFaktur !== undefined ? { tglFaktur: input.tglFaktur } : {}),
        ...(input.dendaRp !== undefined ? { dendaRp: input.dendaRp } : {}),
      };
      nextPo.status = allCompleted ? "Diterima" : "Diterima Sebagian";
      await savePo(row, nextPo, now);

      return { po: { id, ...nextPo }, movementId: lastMovementId, fulfilled };
    }

    // Alur single-item tradisional
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

    // Harga rata-rata bergerak, sama dengan logika penerimaan di frontend.
    const oldStock = Math.max(0, num(item.stock));
    const unitPrice = num(po.qty) > 0 ? num(po.amount) / num(po.qty) : 0;
    const oldAvg = num(item.avgCost) > 0 ? num(item.avgCost) : num(item.cost);
    const nextItem: Data = { ...item, stock: oldStock + qty };
    if (unitPrice > 0) nextItem.avgCost = Math.round(((oldStock * oldAvg + qty * unitPrice) / (oldStock + qty)) * 100) / 100;
    if (input.warehouse) nextItem.warehouse = input.warehouse;
    if (input.rack) {
      nextItem.rack = input.rack;
      nextItem.location = input.rack;
    }
    if (input.bin) nextItem.bin = input.bin;
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

    /* Permintaan proyek yang menunggu PR milik PO ini dipenuhi urut tanggal. */
    const prIds = prIdsOf(nextPo);
    if (prIds.length > 0) {
      const mrs = (await q<Row>("SELECT id, branch, data, updated_at FROM materialRequests", []))
        .map((r) => ({ id: r.id, d: parse(r) }))
        .filter((m) => prIds.includes(String(m.d.requisitionId ?? "")) && String(m.d.itemId ?? "") === itemId && num(m.d.shortage) > 0
          // ADR-0018: yang belum/ditolak gudang tidak ikut dipenuhi otomatis saat barang PO masuk.
          && ["", "Disetujui"].includes(String(m.d.approvalStatus ?? "")))
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

export interface ReturnInput { qty: number; itemId: string; note: string }
export interface ReturnResult { po: Data & { id: string }; movementId: string }

/** Retur barang PO: stok, movement, dan returnedQty berubah atomik. */
export async function returnPo(
  id: string,
  input: ReturnInput,
  actor: string,
  branchScope = "",
): Promise<ReturnResult> {
  const qty = Number(input.qty);
  const itemId = String(input.itemId ?? "").trim();
  const note = String(input.note ?? "").trim();
  if (!Number.isFinite(qty) || qty <= 0) throw new PoError(422, "Jumlah retur harus lebih dari 0", "UNPROCESSABLE");
  if (itemId === "") throw new PoError(422, "Pilih item inventori untuk retur", "UNPROCESSABLE");
  if (note === "") throw new PoError(422, "Catatan retur wajib diisi", "UNPROCESSABLE");

  return withTx(async () => {
    const lockClause = getDialect() === "mysql" ? " FOR UPDATE" : "";
    const poRows = await q<Row>(`SELECT id, branch, data, updated_at FROM purchaseOrders WHERE id = ?${lockClause}`, [id]);
    const poRow = poRows[0];
    if (!poRow) throw new PoError(404, `PO ${id} tidak ada`, "NOT_FOUND");
    if (branchScope !== "" && branchScope !== "SEMUA" && poRow.branch !== branchScope) {
      throw new PoError(404, `PO ${id} tidak ada`, "NOT_FOUND");
    }

    const po = parse(poRow);
    const storedItemId = String(po.itemId ?? "").trim();
    if (storedItemId !== "" && storedItemId !== itemId) {
      throw new PoError(422, `Barang PO sudah ditetapkan (${storedItemId})`, "ITEM_LOCKED");
    }
    const received = po.receivedQty === undefined ? num(po.qty) : num(po.receivedQty);
    const returned = num(po.returnedQty);
    const available = Math.max(0, received - returned);
    if (qty > available) throw new PoError(422, `Melebihi jumlah yang telah diterima dan belum diretur (${available})`, "OVER_RETURN");

    const invRows = await q<Row>(`SELECT id, branch, data, updated_at FROM inventory WHERE id = ?${lockClause}`, [itemId]);
    const invRow = invRows[0];
    if (!invRow) throw new PoError(422, "Item inventori tidak ada", "UNPROCESSABLE");
    if (branchScope !== "" && branchScope !== "SEMUA" && invRow.branch !== branchScope) {
      throw new PoError(404, "Item inventori tidak ada", "NOT_FOUND");
    }
    if (poRow.branch !== "" && invRow.branch !== "" && poRow.branch !== invRow.branch) {
      throw new PoError(422, "PO dan stok inventori berada di cabang berbeda", "BRANCH_MISMATCH");
    }
    const item = parse(invRow);
    const stock = Math.max(0, num(item.stock));
    if (stock < qty) throw new PoError(422, "Stok inventori tidak mencukupi untuk retur", "INSUFFICIENT_STOCK");

    const now = new Date().toISOString();
    const nextItem: Data = { ...item, stock: stock - qty };
    const invUpdate = await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
      JSON.stringify(nextItem), now, itemId, invRow.updated_at, invRow.data,
    ]);
    if (invUpdate.changes !== 1) throw new PoError(409, "Stok berubah oleh pengguna lain — muat ulang", "STALE");

    const movementId = `M-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    await exec("INSERT INTO movements (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      movementId,
      invRow.branch || poRow.branch || DEFAULT_BRANCH,
      JSON.stringify({
        item: String(item.name ?? itemId), itemId, type: "Retur", qty, unit: String(item.unit ?? "pcs"),
        by: `${id} - ${note}`, date: now.slice(0, 10), tone: "out", ref: { poId: id }, note: `Retur oleh ${actor}`,
      }),
      now,
    ]);

    const nextPo: Data = {
      ...po,
      itemId,
      item: String(item.name ?? po.item ?? ""),
      returnedQty: returned + qty,
    };
    await savePo(poRow, nextPo, now);
    return { po: { id, ...nextPo }, movementId };
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
