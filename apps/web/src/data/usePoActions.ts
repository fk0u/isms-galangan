/* Aksi PO terpenuhi sebagian & pengalihan vendor (F3-J-02).
 * Tersambung server → endpoint transaksional /api/purchaseOrders/:id/*.
 * Mode lokal (demo tanpa backend) → logika setara di store, termasuk
 * pemenuhan otomatis permintaan barang proyek saat barang diterima. */
import { useCallback } from "react";
import { useStore, type StoreItem } from "./store";
import { apiFetch, getJwt, isBackendConfigured } from "../services/http";
import { todayISO } from "../utils/format";
import { mrStatus } from "./useMaterialRequest";

const num = (v: unknown): number => Number(v ?? 0) || 0;
const SYNC = ["purchaseOrders", "inventory", "movements", "materialRequests", "spareparts", "requisitions", "activities"] as const;

/** Sisa qty PO yang masih ditunggu dari vendor. */
export function poOpenQty(po: StoreItem): number {
  return Math.max(0, num(po.qty) - num(po.receivedQty) - num(po.cancelledQty));
}
/** Qty yang dinyatakan vendor tidak sanggup dan belum dialihkan. */
export function poPendingReassign(po: StoreItem): number {
  return Math.max(0, num(po.cancelledQty) - num(po.reassignedQty));
}

function statusAfter(po: StoreItem, current: string): string {
  const ordered = num(po.qty);
  const done = num(po.receivedQty) + num(po.cancelledQty);
  if (ordered > 0 && done >= ordered) return num(po.cancelledQty) > 0 ? "Dibatalkan Sebagian" : "Diterima";
  return num(po.receivedQty) > 0 ? "Diterima Sebagian" : current;
}

const prIdsOf = (po: StoreItem): string[] =>
  [...new Set([String(po.req ?? ""), ...(Array.isArray(po.prIds) ? (po.prIds as unknown[]).map(String) : [])].filter((x) => x !== "" && x !== "-"))];

export interface ReceiveArgs { qty: number; itemId: string; noFaktur?: string; tglFaktur?: string; dendaRp?: number; actor?: string }
export interface ReceiveOutcome { status: string; fulfilled: { id: string; given?: number }[] }

export function usePoActions() {
  const { data, add, update, resyncCollections } = useStore();
  const remote = () => isBackendConfigured() && getJwt() !== null;

  const receive = useCallback(async (po: StoreItem, a: ReceiveArgs): Promise<ReceiveOutcome> => {
    if (remote()) {
      const res = await apiFetch<{ po: StoreItem; fulfilled: { id: string; given: number }[] }>(
        `/api/purchaseOrders/${encodeURIComponent(String(po.id))}/receive`,
        { method: "POST", body: JSON.stringify({ qty: a.qty, itemId: a.itemId, noFaktur: a.noFaktur, tglFaktur: a.tglFaktur, dendaRp: a.dendaRp }) },
      );
      await resyncCollections([...SYNC]);
      return { status: String(res.po.status ?? ""), fulfilled: res.fulfilled };
    }
    const item = (data.inventory ?? []).find((i) => String(i.id) === a.itemId);
    if (!item) throw new Error("Pilih item inventori penerima barang");
    if (num(po.qty) > 0 && a.qty > poOpenQty(po)) throw new Error(`Melebihi sisa PO (${poOpenQty(po)})`);
    const unitPrice = num(po.qty) > 0 ? num(po.amount) / num(po.qty) : 0;
    const oldStock = Math.max(0, num(item.stock));
    const oldAvg = num(item.avgCost) > 0 ? num(item.avgCost) : num(item.cost);
    let stock = oldStock + a.qty;
    await add("movements", {
      item: String(item.name), itemId: String(item.id), type: "Penerimaan", qty: a.qty, unit: String(item.unit ?? "pcs"),
      by: String(po.id), date: todayISO(), tone: "in", ref: { poId: po.id },
    }, { action: "menerima barang", target: `${String(item.name)} × ${a.qty} (${String(po.id)})`, module: "Procurement" });
    const nextPo: StoreItem = {
      ...po, itemId: String(item.id), item: String(item.name), receivedQty: num(po.receivedQty) + a.qty,
      ...(a.noFaktur !== undefined ? { noFaktur: a.noFaktur } : {}),
      ...(a.tglFaktur !== undefined ? { tglFaktur: a.tglFaktur } : {}),
      ...(a.dendaRp !== undefined ? { dendaRp: a.dendaRp } : {}),
    };
    const st = statusAfter(nextPo, String(po.status) === "Dalam Pengiriman" ? "Dikirim" : String(po.status));
    const { id: _poId, ...poPatch } = nextPo;
    void _poId;
    await update("purchaseOrders", String(po.id), { ...poPatch, status: st });

    // Penuhi permintaan proyek yang menunggu PR milik PO ini (urut tanggal).
    const prIds = prIdsOf(nextPo);
    const fulfilled: { id: string; given: number }[] = [];
    const mrs = (data.materialRequests ?? [])
      .filter((m) => prIds.includes(String(m.requisitionId ?? "")) && String(m.itemId) === String(item.id) && num(m.shortage) > 0)
      .sort((x, y) => String(x.date ?? "").localeCompare(String(y.date ?? "")));
    for (const m of mrs) {
      if (stock <= 0) break;
      const give = Math.min(stock, num(m.shortage));
      stock -= give;
      const mv = await add("movements", {
        item: String(m.item ?? item.name), itemId: String(item.id), type: "Pengeluaran", qty: give, unit: String(m.unit ?? item.unit ?? "pcs"),
        by: a.actor || "Gudang", date: todayISO(), tone: "out", ref: { projectId: m.projectId, materialRequestId: m.id }, note: `Pemenuhan ${String(m.id)}`,
      }, { action: "memenuhi permintaan barang", module: "Inventori" });
      const issued = num(m.issued) + give;
      const shortage = num(m.shortage) - give;
      const mvIds = Array.isArray(m.movementIds) ? (m.movementIds as string[]) : [];
      await update("materialRequests", String(m.id), { issued, shortage, status: mrStatus(issued, shortage, true), movementIds: [...mvIds, String(mv.id)] });
      fulfilled.push({ id: String(m.id), given: give });
    }
    const invPatch: Record<string, unknown> = { stock };
    if (unitPrice > 0) invPatch.avgCost = Math.round(((oldStock * oldAvg + a.qty * unitPrice) / (oldStock + a.qty)) * 100) / 100;
    await update("inventory", String(item.id), invPatch);
    return { status: st, fulfilled };
  }, [data.inventory, data.materialRequests, add, update, resyncCollections]);

  const vendorCannotFulfill = useCallback(async (po: StoreItem, qty: number, reason: string, actor: string): Promise<void> => {
    if (remote()) {
      await apiFetch(`/api/purchaseOrders/${encodeURIComponent(String(po.id))}/vendor-cannot-fulfill`, { method: "POST", body: JSON.stringify({ qty, reason }) });
      await resyncCollections(["purchaseOrders", "activities"]);
      return;
    }
    if (qty <= 0 || qty > poOpenQty(po)) throw new Error(`Jumlah harus 1–${poOpenQty(po)}`);
    if (!reason.trim()) throw new Error("Alasan wajib diisi");
    const issues = Array.isArray(po.vendorIssues) ? (po.vendorIssues as unknown[]) : [];
    const next: StoreItem = { ...po, cancelledQty: num(po.cancelledQty) + qty };
    await update("purchaseOrders", String(po.id), {
      cancelledQty: next.cancelledQty,
      vendorIssues: [...issues, { qty, reason: reason.trim(), by: actor, date: todayISO() }],
      status: statusAfter(next, String(po.status) === "Dalam Pengiriman" ? "Dikirim" : String(po.status)),
    });
  }, [update, resyncCollections]);

  const reassign = useCallback(async (po: StoreItem, vendor: string, unitPrice: number | undefined, actor: string): Promise<string> => {
    if (remote()) {
      const res = await apiFetch<{ to: { id: string } }>(`/api/purchaseOrders/${encodeURIComponent(String(po.id))}/reassign`, {
        method: "POST", body: JSON.stringify({ vendor, ...(unitPrice ? { unitPrice } : {}) }),
      });
      await resyncCollections(["purchaseOrders", "activities"]);
      return res.to.id;
    }
    const pending = poPendingReassign(po);
    if (pending <= 0) throw new Error("Tidak ada qty yang menunggu dialihkan");
    if (vendor.trim().toLowerCase() === String(po.vendor ?? "").trim().toLowerCase()) throw new Error("Vendor pengganti harus berbeda");
    const price = unitPrice && unitPrice > 0 ? unitPrice : (num(po.qty) > 0 ? num(po.amount) / num(po.qty) : 0);
    const created = await add("purchaseOrders", {
      poType: po.poType ?? "Besar", item: po.item, itemId: po.itemId, vendor: vendor.trim(), req: po.req ?? "",
      ...(Array.isArray(po.prIds) ? { prIds: po.prIds } : {}),
      amount: Math.round(price * pending), qty: pending,
      lines: [{ name: String(po.item ?? ""), qty: pending, unit: "pcs", price: Math.round(price) }],
      project: po.project ?? "-", vessel: po.vessel ?? "", eta: "",
      receivedQty: 0, returnedQty: 0, cancelledQty: 0, status: "Diajukan", date: todayISO(),
      approvals: [], amendments: [], reassignedFrom: po.id, note: `Pengalihan dari ${String(po.id)} (${String(po.vendor ?? "")}) oleh ${actor}`,
    }, { action: "mengalihkan PO ke vendor lain", target: String(po.id), module: "Procurement" });
    const prevTo = Array.isArray(po.reassignedTo) ? (po.reassignedTo as string[]) : [];
    await update("purchaseOrders", String(po.id), { reassignedQty: num(po.reassignedQty) + pending, reassignedTo: [...prevTo, String(created.id)] });
    return String(created.id);
  }, [add, update, resyncCollections]);

  return { receive, vendorCannotFulfill, reassign };
}

/** Riwayat harga per vendor untuk item yang sama (bahan pilih vendor pengganti). */
export function vendorPriceHistory(pos: StoreItem[], po: StoreItem): { vendor: string; unitPrice: number; date: string }[] {
  const key = String(po.itemId ?? "") || String(po.item ?? "");
  const rows = pos
    .filter((p) => String(p.id) !== String(po.id) && (String(p.itemId ?? "") || String(p.item ?? "")) === key && num(p.qty) > 0 && num(p.amount) > 0)
    .map((p) => ({ vendor: String(p.vendor ?? ""), unitPrice: Math.round(num(p.amount) / num(p.qty)), date: String(p.date ?? "") }))
    .sort((x, y) => y.date.localeCompare(x.date));
  // Ambil harga terbaru per vendor, urut termurah.
  const latest = new Map<string, { vendor: string; unitPrice: number; date: string }>();
  for (const r of rows) if (r.vendor && !latest.has(r.vendor)) latest.set(r.vendor, r);
  return [...latest.values()].sort((x, y) => x.unitPrice - y.unitPrice);
}
