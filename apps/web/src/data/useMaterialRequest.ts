/* Permintaan material proyek (F3-D-01, ADR-0007).
 *
 * Tersambung server → POST /api/projects/:id/material-requests: server
 * memutuskan barang keluar / PR dalam satu transaksi (stok tidak bisa minus
 * walau dua perangkat meminta bersamaan), lalu koleksi terkait ditarik ulang.
 * Mode lokal (tanpa backend) → logika yang sama dijalankan di store supaya
 * demo offline tetap berperilaku identik. */
import { useCallback } from "react";
import { useStore } from "./store";
import { apiFetch, getJwt, isBackendConfigured } from "../services/http";
import { todayISO } from "../utils/format";

export type MaterialStatus = "Dari stok" | "Sebagian" | "Menunggu PO";

export interface MaterialRequestArgs {
  projectId: string;
  itemId: string;
  qty: number;
  purpose: "wbs" | "sparepart";
  wbsTask?: string;
  note?: string;
  actor?: string;
  sparepart?: { category?: string; technician?: string; notes?: string; warrantyUntil?: string };
}

export interface MaterialRequestResult {
  itemId: string;
  itemName: string;
  requested: number;
  issued: number;
  shortage: number;
  stockAfter: number;
  movementId: string | null;
  requisitionId: string | null;
  sparepartId: string | null;
  status: MaterialStatus;
}

/** Status pemenuhan dari jumlah keluar & kekurangan (sama dengan server). */
export function materialStatus(issued: number, shortage: number): MaterialStatus {
  return shortage === 0 ? "Dari stok" : issued > 0 ? "Sebagian" : "Menunggu PO";
}

export function useMaterialRequest(): (args: MaterialRequestArgs) => Promise<MaterialRequestResult> {
  const { data, add, update, resyncCollections } = useStore();

  return useCallback(async (args: MaterialRequestArgs): Promise<MaterialRequestResult> => {
    if (isBackendConfigured() && getJwt() !== null) {
      const res = await apiFetch<MaterialRequestResult>(`/api/projects/${encodeURIComponent(args.projectId)}/material-requests`, {
        method: "POST",
        body: JSON.stringify({
          itemId: args.itemId, qty: args.qty, purpose: args.purpose,
          ...(args.wbsTask ? { wbsTask: args.wbsTask } : {}),
          ...(args.note ? { note: args.note } : {}),
          ...(args.sparepart ? { sparepart: args.sparepart } : {}),
        }),
      });
      await resyncCollections(["inventory", "movements", "requisitions", "spareparts", "activities"]);
      return res;
    }

    // Mode lokal: logika setara server.
    const item = (data.inventory ?? []).find((i) => String(i.id) === args.itemId);
    if (!item) throw new Error(`Item inventori ${args.itemId} tidak ditemukan`);
    const itemName = String(item.name ?? args.itemId);
    const unit = String(item.unit ?? "pcs");
    const stock = Math.max(0, Number(item.stock ?? 0) || 0);
    const issued = Math.min(stock, args.qty);
    const shortage = args.qty - issued;
    const today = todayISO();
    const actor = args.actor || "Pengguna";
    const ref = { projectId: args.projectId, ...(args.wbsTask ? { wbsId: args.wbsTask, wbsTask: args.wbsTask } : {}) };
    const unitPrice = Number(item.cost ?? item.price ?? item.unitPrice ?? 0) || 0;
    let movementId: string | null = null;
    let requisitionId: string | null = null;
    let sparepartId: string | null = null;
    if (issued > 0) {
      await update("inventory", String(item.id), { stock: stock - issued });
      const mv = await add("movements", {
        item: itemName, itemId: String(item.id), type: "Pengeluaran", qty: issued, unit,
        by: args.wbsTask ? `${actor} (WBS: ${args.wbsTask})` : actor, date: today, tone: "out", ref, note: args.note ?? "",
      }, { action: "pengeluaran material proyek", module: "Inventori" });
      movementId = String(mv.id);
    }
    if (shortage > 0) {
      const pr = await add("requisitions", {
        projectId: args.projectId, item: itemName, itemId: String(item.id), qty: shortage, unit,
        status: "Diajukan", date: today, requestedBy: actor, by: actor, project: args.projectId,
        amount: Math.round(unitPrice * shortage), ref,
        note: `Permintaan material proyek ${args.projectId}: butuh ${args.qty}, stok ${stock}`,
      }, { action: "permintaan pembelian material", module: "Procurement" });
      requisitionId = String(pr.id);
    }
    const status = materialStatus(issued, shortage);
    if (args.purpose === "sparepart") {
      const sp = await add("spareparts", {
        name: itemName, partNumber: String(item.sku ?? item.code ?? item.id),
        category: args.sparepart?.category ?? String(item.category ?? "Lainnya"),
        status: shortage === 0 ? "Sedang" : "Akan", cost: Math.round(unitPrice * args.qty),
        notes: args.sparepart?.notes ?? "", technician: args.sparepart?.technician ?? "-",
        usedDate: shortage === 0 ? today : "-", warrantyUntil: args.sparepart?.warrantyUntil ?? "-",
        projectId: args.projectId, vesselId: "", requestDate: today,
        inventoryItemId: String(item.id), qty: args.qty, unit,
        fulfillment: { status, issued, shortage, movementId, requisitionId },
      }, { action: "menambahkan sparepart dari inventori", module: "Sparepart" });
      sparepartId = String(sp.id);
    }
    return {
      itemId: String(item.id), itemName, requested: args.qty, issued, shortage,
      stockAfter: stock - issued, movementId, requisitionId, sparepartId, status,
    };
  }, [data.inventory, add, update, resyncCollections]);
}
