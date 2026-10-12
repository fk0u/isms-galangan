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

/** Sisa qty PO yang masih ditunggu dari vendor. PO lama tanpa qty → tak terbatas. */
export function poOpenQty(po: StoreItem): number {
  if (num(po.qty) <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, num(po.qty) - num(po.receivedQty) - num(po.cancelledQty));
}

/** PO konsolidasi berisi beberapa barang — terima/alihkan level-PO ditolak (sama dengan server). */
export function poIsMultiItem(po: StoreItem): boolean {
  const lines = Array.isArray(po.lines) ? (po.lines as Record<string, unknown>[]) : [];
  const names = new Set(lines.map((l) => String(l.name ?? "").trim().toLowerCase()).filter((n) => n !== ""));
  return names.size > 1 || (Array.isArray(po.prIds) ? po.prIds.length : 0) > 1;
}
const MULTI_MSG = "PO berisi beberapa barang (konsolidasi) — terima/alihkan per barang belum didukung";
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

export interface ReceiveLineArgs { itemId?: string; name?: string; qty: number }
export interface ReceiveArgs { qty?: number; itemId?: string; noFaktur?: string; tglFaktur?: string; dendaRp?: number; actor?: string; lines?: ReceiveLineArgs[] }
export interface ReceiveOutcome { status: string; fulfilled: { id: string; given?: number }[] }
export interface ReturnArgs { qty: number; itemId: string; note: string; actor?: string }

export function usePoActions() {
  const { data, add, update, resyncCollections, inBranch } = useStore();
  const remote = () => isBackendConfigured() && getJwt() !== null;

  const receive = useCallback(async (po: StoreItem, a: ReceiveArgs): Promise<ReceiveOutcome> => {
    if (remote()) {
      const res = await apiFetch<{ po: StoreItem; fulfilled: { id: string; given: number }[] }>(
        `/api/purchaseOrders/${encodeURIComponent(String(po.id))}/receive`,
        { method: "POST", body: JSON.stringify({ qty: a.qty, itemId: a.itemId, noFaktur: a.noFaktur, tglFaktur: a.tglFaktur, dendaRp: a.dendaRp, lines: a.lines }) },
      );
      await resyncCollections([...SYNC]);
      return { status: String(res.po.status ?? ""), fulfilled: res.fulfilled };
    }
    const hasLines = Array.isArray(a.lines) && a.lines.length > 0;
    if (hasLines) {
      const recvLines = a.lines as ReceiveLineArgs[];
      const poLines = (Array.isArray(po.lines) ? (po.lines as Record<string, unknown>[]) : []).map((l) => ({ ...l }));
      const fulfilled: { id: string; given: number }[] = [];
      const inventoryList = [...(data.inventory ?? [])];

      for (const rl of recvLines) {
        const lineQty = Number(rl.qty);
        if (!Number.isFinite(lineQty) || lineQty <= 0) continue;

        const lineIdx = poLines.findIndex((l) =>
          (rl.itemId && String(l.itemId ?? "") === String(rl.itemId)) ||
          (rl.name && String(l.name ?? "").trim().toLowerCase() === String(rl.name).trim().toLowerCase()),
        );
        const targetLine = lineIdx >= 0 ? poLines[lineIdx] : undefined;
        if (!targetLine) throw new Error(`Baris item "${rl.name ?? rl.itemId}" tidak ditemukan di PO`);

        const openLine = Math.max(0, num(targetLine.qty) - num(targetLine.receivedQty));
        if (lineQty > openLine) throw new Error(`Melebihi sisa item ${String(targetLine.name ?? "")} (${openLine})`);

        const lineItemId = String(rl.itemId ?? targetLine.itemId ?? "");
        let item = inventoryList.find((i) => String(i.id) === lineItemId);
        if (!item && targetLine.name) {
          item = inventoryList.find((i) => String(i.name ?? "").trim().toLowerCase() === String(targetLine.name ?? "").trim().toLowerCase());
        }
        if (!item) throw new Error(`Pilih item inventori penerima barang untuk ${String(targetLine.name ?? "")}`);

        const resolvedItemId = String(item.id);
        const unitPrice = num(targetLine.price) > 0 ? num(targetLine.price) : (num(po.amount) / Math.max(1, num(po.qty)));
        const oldStock = Math.max(0, num(item.stock));
        const oldAvg = num(item.avgCost) > 0 ? num(item.avgCost) : num(item.cost);
        let stock = oldStock + lineQty;

        await add("movements", {
          item: String(item.name ?? targetLine.name), itemId: resolvedItemId, type: "Penerimaan", qty: lineQty, unit: String(item.unit ?? targetLine.unit ?? "pcs"),
          by: String(po.id), date: todayISO(), tone: "in", ref: { poId: po.id },
        }, { action: "menerima barang", target: `${String(item.name)} × ${lineQty} (${String(po.id)})`, module: "Procurement" });

        targetLine.itemId = resolvedItemId;
        targetLine.receivedQty = num(targetLine.receivedQty) + lineQty;

        const prIds = prIdsOf(po);
        const mrs = (data.materialRequests ?? [])
          .filter((m) => prIds.includes(String(m.requisitionId ?? "")) && String(m.itemId) === resolvedItemId && num(m.shortage) > 0)
          .sort((x, y) => String(x.date ?? "").localeCompare(String(y.date ?? "")));
        for (const m of mrs) {
          if (stock <= 0) break;
          const give = Math.min(stock, num(m.shortage));
          stock -= give;
          const mv = await add("movements", {
            item: String(m.item ?? item.name), itemId: resolvedItemId, type: "Pengeluaran", qty: give, unit: String(m.unit ?? item.unit ?? "pcs"),
            by: a.actor || "Gudang", date: todayISO(), tone: "out", ref: { projectId: m.projectId, materialRequestId: m.id }, note: `Pemenuhan ${String(m.id)}`,
          }, { action: "memenuhi permintaan barang", module: "Inventori" });
          const issued = num(m.issued) + give;
          const shortage = num(m.shortage) - give;
          const mvIds = Array.isArray(m.movementIds) ? (m.movementIds as string[]) : [];
          await update("materialRequests", String(m.id), { issued, shortage, status: mrStatus(issued, shortage, true), movementIds: [...mvIds, String(mv.id)] });
          fulfilled.push({ id: String(m.id), given: give });
        }

        const invPatch: Record<string, unknown> = { stock };
        if (unitPrice > 0) invPatch.avgCost = Math.round(((oldStock * oldAvg + lineQty * unitPrice) / (oldStock + lineQty)) * 100) / 100;
        await update("inventory", resolvedItemId, invPatch);
      }

      const totalReceived = poLines.reduce((s, l) => s + num(l.receivedQty), 0);
      const totalOrdered = poLines.reduce((s, l) => s + num(l.qty), 0);
      const allCompleted = totalOrdered > 0 && poLines.every((l) => num(l.receivedQty) >= num(l.qty));
      const st = allCompleted ? "Diterima" : "Diterima Sebagian";

      const nextPo: StoreItem = {
        ...po,
        lines: poLines,
        receivedQty: totalReceived,
        ...(a.noFaktur !== undefined ? { noFaktur: a.noFaktur } : {}),
        ...(a.tglFaktur !== undefined ? { tglFaktur: a.tglFaktur } : {}),
        ...(a.dendaRp !== undefined ? { dendaRp: a.dendaRp } : {}),
      };
      const { id: _poId, ...poPatch } = nextPo;
      void _poId;
      await update("purchaseOrders", String(po.id), { ...poPatch, status: st });
      return { status: st, fulfilled };
    }

    if (poIsMultiItem(po)) throw new Error(MULTI_MSG);
    const item = (data.inventory ?? []).find((i) => String(i.id) === a.itemId);
    if (!item) throw new Error("Pilih item inventori penerima barang");
    const singleQty = Number(a.qty || 0);
    if (singleQty <= 0) throw new Error("Kuantitas terima harus lebih dari 0");
    if (singleQty > poOpenQty(po)) throw new Error(`Melebihi sisa PO (${poOpenQty(po)})`);
    if (num(po.receivedQty) > 0 && String(po.itemId ?? "") !== "" && String(po.itemId) !== a.itemId) {
      throw new Error(`Barang PO sudah ditetapkan (${String(po.itemId)}) sejak penerimaan pertama`);
    }
    const unitPrice = num(po.qty) > 0 ? num(po.amount) / num(po.qty) : 0;
    const oldStock = Math.max(0, num(item.stock));
    const oldAvg = num(item.avgCost) > 0 ? num(item.avgCost) : num(item.cost);
    let stock = oldStock + singleQty;
    await add("movements", {
      item: String(item.name), itemId: String(item.id), type: "Penerimaan", qty: singleQty, unit: String(item.unit ?? "pcs"),
      by: String(po.id), date: todayISO(), tone: "in", ref: { poId: po.id },
    }, { action: "menerima barang", target: `${String(item.name)} × ${singleQty} (${String(po.id)})`, module: "Procurement" });
    const nextPo: StoreItem = {
      ...po, itemId: String(item.id), item: String(item.name), receivedQty: num(po.receivedQty) + singleQty,
      ...(a.noFaktur !== undefined ? { noFaktur: a.noFaktur } : {}),
      ...(a.tglFaktur !== undefined ? { tglFaktur: a.tglFaktur } : {}),
      ...(a.dendaRp !== undefined ? { dendaRp: a.dendaRp } : {}),
    };
    if (num(po.qty) <= 0) nextPo.qty = nextPo.receivedQty; // PO lama tanpa qty: terima = lunas
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
      // Sparepart terkait ikut diperbarui (sama dengan server & pemenuhan manual).
      const sp = m.sparepartId ? (data.spareparts ?? []).find((x) => String(x.id) === String(m.sparepartId)) : undefined;
      if (sp) {
        const f = (sp.fulfillment ?? {}) as Record<string, unknown>;
        await update("spareparts", String(sp.id), {
          ...(shortage === 0 ? { status: "Sedang", usedDate: todayISO() } : {}),
          fulfillment: { ...f, issued, shortage, status: shortage === 0 ? "Dari stok" : "Sebagian" },
        });
      }
      fulfilled.push({ id: String(m.id), given: give });
    }
    const invPatch: Record<string, unknown> = { stock };
    if (unitPrice > 0) invPatch.avgCost = Math.round(((oldStock * oldAvg + singleQty * unitPrice) / (oldStock + singleQty)) * 100) / 100;
    await update("inventory", String(item.id), invPatch);
    return { status: st, fulfilled };
  }, [data.inventory, data.materialRequests, data.spareparts, add, update, resyncCollections]);

  const returnStock = useCallback(async (po: StoreItem, a: ReturnArgs): Promise<void> => {
    if (remote()) {
      await apiFetch(`/api/purchaseOrders/${encodeURIComponent(String(po.id))}/return`, {
        method: "POST",
        body: JSON.stringify({ qty: a.qty, itemId: a.itemId, note: a.note }),
      });
      await resyncCollections(["purchaseOrders", "inventory", "movements"]);
      return;
    }
    const item = inBranch(data.inventory ?? []).find((row) => String(row.id) === a.itemId);
    if (!item) throw new Error("Item inventori tidak ditemukan pada cabang aktif");
    const storedItemId = String(po.itemId ?? "");
    if (storedItemId !== "" && storedItemId !== a.itemId) throw new Error(`Barang PO sudah ditetapkan (${storedItemId})`);
    const received = po.receivedQty === undefined ? num(po.qty) : num(po.receivedQty);
    const available = Math.max(0, received - num(po.returnedQty));
    if (a.qty > available) throw new Error(`Melebihi jumlah yang telah diterima dan belum diretur (${available})`);
    if (num(item.stock) < a.qty) throw new Error("Stok inventori tidak mencukupi untuk retur");
    if (!a.note.trim()) throw new Error("Catatan retur wajib diisi");
    await update("inventory", a.itemId, { stock: num(item.stock) - a.qty });
    await add("movements", {
      item: String(item.name ?? a.itemId), itemId: a.itemId, type: "Retur", qty: a.qty,
      unit: String(item.unit ?? "pcs"), by: `${po.id} - ${a.note.trim()}`, date: todayISO(), tone: "out", ref: { poId: po.id },
    });
    await update("purchaseOrders", String(po.id), {
      ...(storedItemId === "" ? { itemId: a.itemId, item: String(item.name ?? po.item ?? "") } : {}),
      returnedQty: num(po.returnedQty) + a.qty,
    });
  }, [add, data.inventory, inBranch, resyncCollections, update]);

  const vendorCannotFulfill = useCallback(async (po: StoreItem, qty: number, reason: string, actor: string): Promise<void> => {
    if (remote()) {
      await apiFetch(`/api/purchaseOrders/${encodeURIComponent(String(po.id))}/vendor-cannot-fulfill`, { method: "POST", body: JSON.stringify({ qty, reason }) });
      await resyncCollections(["purchaseOrders", "activities"]);
      return;
    }
    if (poIsMultiItem(po)) throw new Error(MULTI_MSG);
    if (num(po.qty) <= 0) throw new Error("PO tanpa jumlah pesanan tidak bisa dibatalkan sebagian");
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
    if (poIsMultiItem(po)) throw new Error(MULTI_MSG);
    const pending = poPendingReassign(po);
    if (pending <= 0) throw new Error("Tidak ada qty yang menunggu dialihkan");
    const unit = String((Array.isArray(po.lines) ? (po.lines as Record<string, unknown>[])[0]?.unit : "") ?? "") || "pcs";
    if (vendor.trim().toLowerCase() === String(po.vendor ?? "").trim().toLowerCase()) throw new Error("Vendor pengganti harus berbeda");
    const price = unitPrice && unitPrice > 0 ? unitPrice : (num(po.qty) > 0 ? num(po.amount) / num(po.qty) : 0);
    const created = await add("purchaseOrders", {
      poType: po.poType ?? "Besar", item: po.item, itemId: po.itemId, vendor: vendor.trim(), req: po.req ?? "",
      ...(Array.isArray(po.prIds) ? { prIds: po.prIds } : {}),
      amount: Math.round(price * pending), qty: pending,
      lines: [{ name: String(po.item ?? ""), qty: pending, unit, price: Math.round(price) }],
      project: po.project ?? "-", vessel: po.vessel ?? "", eta: "",
      receivedQty: 0, returnedQty: 0, cancelledQty: 0, status: "Diajukan", date: todayISO(),
      approvals: [], amendments: [], reassignedFrom: po.id, note: `Pengalihan dari ${String(po.id)} (${String(po.vendor ?? "")}) oleh ${actor}`,
    }, { action: "mengalihkan PO ke vendor lain", target: String(po.id), module: "Procurement" });
    const prevTo = Array.isArray(po.reassignedTo) ? (po.reassignedTo as string[]) : [];
    await update("purchaseOrders", String(po.id), { reassignedQty: num(po.reassignedQty) + pending, reassignedTo: [...prevTo, String(created.id)] });
    return String(created.id);
  }, [add, update, resyncCollections]);

  return { receive, returnStock, vendorCannotFulfill, reassign };
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

/** Riwayat harga satu item dari PO terdahulu (F3-J-03): semua transaksi,
 *  urut tanggal naik, untuk tabel track record + tren kecil di RFQ.
 *  Cocok bila nama item saling mengandung - RFQ sering memakai nama pendek
 *  ("Cat Epoxy") sedangkan PO nama lengkap ("Cat Epoxy Primer"). */
export function itemPriceTrack(pos: StoreItem[], item: string): { po: string; vendor: string; unitPrice: number; qty: number; date: string }[] {
  const key = item.trim().toLowerCase();
  if (!key) return [];
  return pos
    .filter((p) => {
      const name = String(p.item ?? "").trim().toLowerCase();
      return name !== "" && (name.includes(key) || key.includes(name)) && num(p.qty) > 0 && num(p.amount) > 0;
    })
    .map((p) => ({ po: String(p.id), vendor: String(p.vendor ?? ""), unitPrice: Math.round(num(p.amount) / num(p.qty)), qty: num(p.qty), date: String(p.date ?? "") }))
    .sort((x, y) => x.date.localeCompare(y.date));
}
