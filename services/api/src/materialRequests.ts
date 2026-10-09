/* Permintaan material proyek (F3-D-01, ADR-0007, alur ETC-03).
 *
 * Mekanik/proyek meminta barang untuk sebuah proyek (dari WBS atau tab
 * Sparepart). Server yang memutuskan dalam SATU transaksi:
 *   - stok cukup        → barang keluar (movement OUT) penuh
 *   - stok kurang       → keluarkan yang ada + Purchase Request (PR) untuk sisanya
 *   - stok kosong       → seluruhnya jadi PR
 * Stok tidak pernah negatif. Bila diminta sebagai sparepart, baris sparepart
 * dicatat dengan status pemenuhan supaya tim tahu barang mana yang menunggu PO.
 *
 * Kenapa di server: versi frontend melakukan 3–4 tulis terpisah; dua perangkat
 * yang meminta barang sama bersamaan bisa membuat stok minus. */
import { randomUUID } from "node:crypto";
import { exec, q, withTx } from "./db.js";
import { DEFAULT_BRANCH } from "./routes/crud.js";

export class MaterialError extends Error {
  constructor(public status: 404 | 409 | 422, message: string, public code: string) {
    super(message);
  }
}

export interface MaterialRequestInput {
  projectId: string;
  itemId: string;
  qty: number;
  actor: string;
  purpose: "wbs" | "sparepart";
  wbsTask?: string;
  note?: string;
  sparepart?: {
    category?: string;
    technician?: string;
    notes?: string;
    warrantyUntil?: string;
  };
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
  status: "Dari stok" | "Sebagian" | "Menunggu PO";
}

interface Row { id: string; branch: string; data: string; updated_at: string }
type Data = Record<string, unknown>;

function parse(row: Row): Data {
  try { return JSON.parse(row.data) as Data; } catch { return {}; }
}

function newId(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function insert(table: string, id: string, data: Data, now: string): Promise<void> {
  await exec(`INSERT INTO ${table} (id, branch, data, updated_at) VALUES (?, ?, ?, ?)`, [
    id, DEFAULT_BRANCH, JSON.stringify(data), now,
  ]);
}

export async function requestMaterial(input: MaterialRequestInput): Promise<MaterialRequestResult> {
  const qty = Number(input.qty);
  if (!Number.isFinite(qty) || qty <= 0) throw new MaterialError(422, "Jumlah harus lebih dari 0", "UNPROCESSABLE");

  return withTx(async () => {
    const proj = await q<Row>("SELECT id, branch, data, updated_at FROM projects WHERE id = ?", [input.projectId]);
    if (proj.length === 0) throw new MaterialError(404, `Proyek ${input.projectId} tidak ada`, "NOT_FOUND");
    const inv = await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [input.itemId]);
    const row = inv[0];
    if (!row) throw new MaterialError(404, `Item inventori ${input.itemId} tidak ada`, "NOT_FOUND");

    const item = parse(row);
    const itemName = String(item.name ?? input.itemId);
    const unit = String(item.unit ?? "pcs");
    const stock = Math.max(0, Number(item.stock ?? 0) || 0);
    const issued = Math.min(stock, qty);
    const shortage = qty - issued;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const ref = { projectId: input.projectId, ...(input.wbsTask ? { wbsId: input.wbsTask, wbsTask: input.wbsTask } : {}) };
    const by = input.wbsTask ? `${input.actor} (WBS: ${input.wbsTask})` : input.actor;

    let movementId: string | null = null;
    if (issued > 0) {
      /* Kurangi stok dengan syarat stok belum berubah sejak dibaca: pada MySQL
         dua permintaan bersamaan tidak bisa sama-sama lolos. */
      const nextItem = { ...item, stock: stock - issued };
      const res = await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [
        JSON.stringify(nextItem), now, row.id, row.updated_at,
      ]);
      /* Pakai jumlah baris terubah, bukan membaca ulang updated_at: dua
         permintaan di milidetik yang sama punya `now` identik. */
      if (res.changes !== 1) {
        throw new MaterialError(409, "Stok berubah oleh permintaan lain — coba lagi", "STALE");
      }
      movementId = newId("M");
      await insert("movements", movementId, {
        item: itemName, itemId: row.id, type: "Pengeluaran", qty: issued, unit, by,
        date: today, tone: "out", ref, note: input.note ?? "",
      }, now);
    }

    // Harga satuan: inventori menyimpan `cost`; `price`/`unitPrice` untuk data lama.
    const unitPrice = Number(item.cost ?? item.price ?? item.unitPrice ?? 0) || 0;
    let requisitionId: string | null = null;
    if (shortage > 0) {
      requisitionId = newId("PR");
      await insert("requisitions", requisitionId, {
        projectId: input.projectId, item: itemName, itemId: row.id, qty: shortage, unit,
        status: "Diajukan", date: today, requestedBy: input.actor, by: input.actor, project: input.projectId,
        amount: Math.round(unitPrice * shortage), ref,
        note: `Permintaan material proyek ${input.projectId}${input.wbsTask ? ` / WBS ${input.wbsTask}` : ""}: butuh ${qty}, stok ${stock}`,
      }, now);
    }

    const status: MaterialRequestResult["status"] = shortage === 0 ? "Dari stok" : issued > 0 ? "Sebagian" : "Menunggu PO";

    let sparepartId: string | null = null;
    if (input.purpose === "sparepart") {
      sparepartId = newId("SP");
      await insert("spareparts", sparepartId, {
        name: itemName,
        partNumber: String(item.sku ?? item.code ?? row.id),
        category: input.sparepart?.category ?? String(item.category ?? "Lainnya"),
        status: shortage === 0 ? "Sedang" : "Akan",
        cost: Math.round(unitPrice * qty),
        notes: input.sparepart?.notes ?? "",
        technician: input.sparepart?.technician ?? "-",
        usedDate: shortage === 0 ? today : "-",
        warrantyUntil: input.sparepart?.warrantyUntil ?? "-",
        projectId: input.projectId,
        vesselId: "",
        requestDate: today,
        inventoryItemId: row.id,
        qty,
        unit,
        fulfillment: { status, issued, shortage, movementId, requisitionId },
      }, now);
    }

    return {
      itemId: row.id, itemName, requested: qty, issued, shortage,
      stockAfter: stock - issued, movementId, requisitionId, sparepartId, status,
    };
  });
}
