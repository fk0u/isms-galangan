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
  materialRequestId: string;
  status: MaterialStatus;
}

export type MrStatus = "Dipenuhi dari stok" | "Menunggu PO" | "Sebagian diterima" | "Selesai";

/** Sama dengan mrStatus di server (services/api/src/materialRequests.ts). */
export function mrStatus(issued: number, shortage: number, hadShortage: boolean): MrStatus {
  if (shortage === 0) return hadShortage ? "Selesai" : "Dipenuhi dari stok";
  return issued > 0 ? "Sebagian diterima" : "Menunggu PO";
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
      await resyncCollections(["inventory", "movements", "requisitions", "spareparts", "materialRequests", "activities"]);
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
    const mr = await add("materialRequests", {
      projectId: args.projectId, itemId: String(item.id), item: itemName, unit, purpose: args.purpose,
      wbsTask: args.wbsTask ?? "", requested: args.qty, issued, shortage,
      status: mrStatus(issued, shortage, false), requestedBy: actor, date: today,
      movementIds: [], requisitionId: null, sparepartId: null, note: args.note ?? "",
    }, { action: "permintaan barang proyek", module: "Procurement" });
    const mrId = String(mr.id);
    const ref = { projectId: args.projectId, materialRequestId: mrId, ...(args.wbsTask ? { wbsId: args.wbsTask, wbsTask: args.wbsTask } : {}) };
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
        amount: Math.round(unitPrice * shortage), ref, sourceRequestIds: [mrId],
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
        inventoryItemId: String(item.id), materialRequestId: mrId, qty: args.qty, unit,
        fulfillment: { status, issued, shortage, movementId, requisitionId },
      }, { action: "menambahkan sparepart dari inventori", module: "Sparepart" });
      sparepartId = String(sp.id);
    }
    await update("materialRequests", mrId, { movementIds: movementId ? [movementId] : [], requisitionId, sparepartId });
    return {
      itemId: String(item.id), itemName, requested: args.qty, issued, shortage,
      stockAfter: stock - issued, movementId, requisitionId, sparepartId, materialRequestId: mrId, status,
    };
  }, [data.inventory, add, update, resyncCollections]);
}

export interface FulfillResult {
  id: string;
  given: number;
  issued: number;
  shortage: number;
  status: MrStatus;
}

/* PR yang belum diproses procurement (boleh dikurangi otomatis). */
const PR_OPEN = new Set(["Draft", "Diajukan", "Menunggu Approval"]);

/** Penuhi sisa permintaan dari stok (setelah barang PO masuk gudang). */
export function useFulfillMaterialRequest(): (id: string, actor?: string) => Promise<FulfillResult> {
  const { data, add, update, resyncCollections } = useStore();

  return useCallback(async (id: string, actor?: string): Promise<FulfillResult> => {
    if (isBackendConfigured() && getJwt() !== null) {
      const res = await apiFetch<FulfillResult>(`/api/material-requests/${encodeURIComponent(id)}/fulfill`, { method: "POST" });
      await resyncCollections(["materialRequests", "inventory", "movements", "spareparts", "requisitions", "activities"]);
      return res;
    }
    const mr = (data.materialRequests ?? []).find((m) => String(m.id) === id);
    if (!mr) throw new Error(`Permintaan ${id} tidak ditemukan`);
    const remaining = Number(mr.shortage ?? 0);
    if (remaining <= 0) throw new Error("Permintaan ini sudah terpenuhi");
    const item = (data.inventory ?? []).find((i) => String(i.id) === String(mr.itemId));
    if (!item) throw new Error(`Item inventori ${String(mr.itemId)} tidak ditemukan`);
    const stock = Math.max(0, Number(item.stock ?? 0) || 0);
    const given = Math.min(stock, remaining);
    if (given === 0) throw new Error("Stok gudang masih kosong — tunggu barang PO masuk");
    await update("inventory", String(item.id), { stock: stock - given });
    const mv = await add("movements", {
      item: String(mr.item ?? item.name), itemId: String(item.id), type: "Pengeluaran", qty: given,
      unit: String(mr.unit ?? item.unit ?? "pcs"), by: actor || "Gudang", date: todayISO(), tone: "out",
      ref: { projectId: mr.projectId, materialRequestId: id }, note: `Pemenuhan ${id}`,
    }, { action: "memenuhi permintaan barang", module: "Inventori" });
    const issued = Number(mr.issued ?? 0) + given;
    const shortage = remaining - given;
    const status = mrStatus(issued, shortage, true);
    const mvIds = Array.isArray(mr.movementIds) ? (mr.movementIds as string[]) : [];
    await update("materialRequests", id, { issued, shortage, status, movementIds: [...mvIds, String(mv.id)] });
    const spId = String(mr.sparepartId ?? "");
    const sp = spId ? (data.spareparts ?? []).find((x) => String(x.id) === spId) : undefined;
    if (sp) {
      const f = (sp.fulfillment ?? {}) as Record<string, unknown>;
      await update("spareparts", spId, {
        ...(shortage === 0 ? { status: "Sedang", usedDate: todayISO() } : {}),
        fulfillment: { ...f, issued, shortage, status: shortage === 0 ? "Dari stok" : "Sebagian" },
      });
    }
    // Sama dengan server: PR sumber yang belum diproses ikut dikurangi.
    const prId = String(mr.requisitionId ?? "");
    const pr = prId ? (data.requisitions ?? []).find((x) => String(x.id) === prId) : undefined;
    if (pr && PR_OPEN.has(String(pr.status ?? ""))) {
      const unitPrice = Number(pr.qty) > 0 ? Number(pr.amount ?? 0) / Number(pr.qty) : 0;
      await update("requisitions", prId, shortage === 0
        ? { qty: 0, amount: 0, status: "Dibatalkan", note: `${String(pr.note ?? "")} — dipenuhi dari stok (${id})`.trim() }
        : { qty: shortage, amount: Math.round(unitPrice * shortage) });
    }
    return { id, given, issued, shortage, status };
  }, [data.materialRequests, data.inventory, data.spareparts, data.requisitions, add, update, resyncCollections]);
}
