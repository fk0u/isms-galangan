/* Barang keluar eceran/potongan (F3-G-03). Tersambung server → endpoint
 * transaksional /api/inventory/:id/issue; mode lokal → util yang sama. */
import { useCallback } from "react";
import { useStore } from "./store";
import { apiFetch, getJwt, isBackendConfigured } from "../services/http";
import { todayISO } from "../utils/format";
import { unitConversionOf } from "../utils/unitConversion";
import { issueBase, plateCutKg } from "../utils/stockIssue";

export interface StockIssueArgs {
  itemId: string;
  qty?: number;
  cut?: { lengthMm: number; widthMm: number };
  projectId?: string;
  note: string;
  actor?: string;
}

export function useStockIssue(): (a: StockIssueArgs) => Promise<{ baseQty: number; baseUnit: string }> {
  const { data, add, update, resyncCollections } = useStore();
  return useCallback(async (a) => {
    if (isBackendConfigured() && getJwt() !== null) {
      const res = await apiFetch<{ baseQty: number; baseUnit: string }>(`/api/inventory/${encodeURIComponent(a.itemId)}/issue`, {
        method: "POST",
        body: JSON.stringify({ ...(a.cut ? { cut: a.cut } : { qty: a.qty }), note: a.note, ...(a.projectId ? { projectId: a.projectId } : {}) }),
      });
      await resyncCollections(["inventory", "movements", "activities"]);
      return res;
    }
    const item = (data.inventory ?? []).find((i) => String(i.id) === a.itemId);
    if (!item) throw new Error("Item tidak ditemukan");
    const conv = unitConversionOf(item);
    if (!conv) throw new Error("Item belum punya konversi satuan");
    const qty = a.cut ? plateCutKg(conv, a.cut.lengthMm, a.cut.widthMm) : Number(a.qty);
    if (qty === null || !(qty > 0)) throw new Error("Ukuran potongan / jumlah tidak valid");
    const r = issueBase({ stock: Number(item.stock || 0), openBase: Number(item.openBase || 0) }, conv.perUnit, qty);
    if (!r.ok) throw new Error(r.error);
    await update("inventory", String(item.id), { stock: r.next.stock, openBase: r.next.openBase });
    await add("movements", {
      item: String(item.name), itemId: String(item.id), type: "Pengeluaran", qty, unit: conv.baseUnit,
      by: a.actor || "Gudang", date: todayISO(), tone: "out", note: a.note, additional: true,
      ...(a.cut ? { cut: a.cut } : {}), ...(a.projectId ? { ref: { projectId: a.projectId } } : {}),
    }, { action: "barang keluar eceran/potongan", module: "Inventori" });
    return { baseQty: qty, baseUnit: conv.baseUnit };
  }, [data.inventory, add, update, resyncCollections]);
}
