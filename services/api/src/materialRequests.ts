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
  materialRequestId: string;
  status: "Dari stok" | "Sebagian" | "Menunggu PO";
}

/* Status permintaan barang (F3-J-01). "Menunggu stok" diturunkan di UI dari
   PR yang sudah jadi PO; server menyimpan empat status ini. */
export type MrStatus = "Dipenuhi dari stok" | "Menunggu PO" | "Sebagian diterima" | "Selesai";

export function mrStatus(issued: number, shortage: number, hadShortage: boolean): MrStatus {
  if (shortage === 0) return hadShortage ? "Selesai" : "Dipenuhi dari stok";
  return issued > 0 ? "Sebagian diterima" : "Menunggu PO";
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

/** Kurangi stok + catat movement OUT. Gagal 409 bila stok berubah sejak dibaca. */
async function issueFromStock(
  row: Row, item: Data, stock: number, give: number, now: string,
  movement: { itemName: string; unit: string; by: string; ref: Data; note: string },
): Promise<string> {
  /* Compare-and-set pada updated_at DAN isi data: dua permintaan di milidetik
     yang sama bisa punya updated_at identik, tapi isi stoknya pasti berbeda
     setelah salah satunya menulis. Jumlah baris terubah menentukan menang/kalah. */
  const res = await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
    JSON.stringify({ ...item, stock: stock - give }), now, row.id, row.updated_at, row.data,
  ]);
  if (res.changes !== 1) throw new MaterialError(409, "Stok berubah oleh permintaan lain — coba lagi", "STALE");
  const movementId = newId("M");
  await insert("movements", movementId, {
    item: movement.itemName, itemId: row.id, type: "Pengeluaran", qty: give, unit: movement.unit, by: movement.by,
    date: now.slice(0, 10), tone: "out", ref: movement.ref, note: movement.note,
  }, now);
  return movementId;
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

    const mrId = newId("MR");
    const mvRef = { ...ref, materialRequestId: mrId };
    let movementId: string | null = null;
    if (issued > 0) {
      movementId = await issueFromStock(row, item, stock, issued, now, { itemName, unit, by, ref: mvRef, note: input.note ?? "" });
    }

    // Harga satuan: inventori menyimpan `cost`; `price`/`unitPrice` untuk data lama.
    const unitPrice = Number(item.cost ?? item.price ?? item.unitPrice ?? 0) || 0;
    let requisitionId: string | null = null;
    if (shortage > 0) {
      requisitionId = newId("PR");
      await insert("requisitions", requisitionId, {
        projectId: input.projectId, item: itemName, itemId: row.id, qty: shortage, unit,
        status: "Diajukan", date: today, requestedBy: input.actor, by: input.actor, project: input.projectId,
        amount: Math.round(unitPrice * shortage), ref, sourceRequestIds: [mrId],
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
        materialRequestId: mrId,
        qty,
        unit,
        fulfillment: { status, issued, shortage, movementId, requisitionId },
      }, now);
    }

    await insert("materialRequests", mrId, {
      projectId: input.projectId, itemId: row.id, item: itemName, unit, purpose: input.purpose,
      wbsTask: input.wbsTask ?? "", requested: qty, issued, shortage,
      status: mrStatus(issued, shortage, false), requestedBy: input.actor, date: today,
      movementIds: movementId ? [movementId] : [], requisitionId, sparepartId, note: input.note ?? "",
    }, now);

    return {
      itemId: row.id, itemName, requested: qty, issued, shortage,
      stockAfter: stock - issued, movementId, requisitionId, sparepartId, materialRequestId: mrId, status,
    };
  });
}

/* PR yang belum diproses procurement (boleh dikurangi otomatis). */
const PR_OPEN = new Set(["Draft", "Diajukan", "Menunggu Approval"]);

export interface FulfillResult {
  id: string;
  given: number;
  issued: number;
  shortage: number;
  status: MrStatus;
  movementId: string;
}

/** Penuhi sisa permintaan dari stok (setelah barang PO masuk gudang). */
export async function fulfillMaterialRequest(id: string, actor: string): Promise<FulfillResult> {
  return withTx(async () => {
    const mrRows = await q<Row>("SELECT id, branch, data, updated_at FROM materialRequests WHERE id = ?", [id]);
    const mrRow = mrRows[0];
    if (!mrRow) throw new MaterialError(404, `Permintaan ${id} tidak ada`, "NOT_FOUND");
    const mr = parse(mrRow);
    const remaining = Number(mr.shortage ?? 0);
    if (remaining <= 0) throw new MaterialError(409, "Permintaan ini sudah terpenuhi", "ALREADY_DONE");
    const inv = await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [String(mr.itemId ?? "")]);
    const row = inv[0];
    if (!row) throw new MaterialError(404, `Item inventori ${String(mr.itemId)} tidak ada`, "NOT_FOUND");
    const item = parse(row);
    const stock = Math.max(0, Number(item.stock ?? 0) || 0);
    const give = Math.min(stock, remaining);
    if (give === 0) throw new MaterialError(409, "Stok gudang masih kosong — tunggu barang PO masuk", "NO_STOCK");

    const now = new Date().toISOString();
    const ref = { projectId: mr.projectId, materialRequestId: id, ...(mr.wbsTask ? { wbsId: mr.wbsTask, wbsTask: mr.wbsTask } : {}) };
    const movementId = await issueFromStock(row, item, stock, give, now, {
      itemName: String(mr.item ?? item.name ?? row.id), unit: String(mr.unit ?? item.unit ?? "pcs"),
      by: actor, ref, note: `Pemenuhan ${id}`,
    });
    const issued = Number(mr.issued ?? 0) + give;
    const shortage = remaining - give;
    const status = mrStatus(issued, shortage, true);
    const mvIds = Array.isArray(mr.movementIds) ? (mr.movementIds as string[]) : [];
    const res = await exec("UPDATE materialRequests SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [
      JSON.stringify({ ...mr, issued, shortage, status, movementIds: [...mvIds, movementId] }), now, id, mrRow.updated_at,
    ]);
    if (res.changes !== 1) throw new MaterialError(409, "Permintaan berubah oleh pengguna lain — muat ulang", "STALE");

    // Sparepart terkait ikut diperbarui supaya tab Sparepart proyek konsisten.
    const spId = String(mr.sparepartId ?? "");
    if (spId) {
      const sp = await q<Row>("SELECT id, branch, data, updated_at FROM spareparts WHERE id = ?", [spId]);
      if (sp[0]) {
        const d = parse(sp[0]);
        const f = (d.fulfillment ?? {}) as Data;
        const spRes = await exec("UPDATE spareparts SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [JSON.stringify({
          ...d,
          ...(shortage === 0 ? { status: "Sedang", usedDate: now.slice(0, 10) } : {}),
          fulfillment: { ...f, issued, shortage, status: shortage === 0 ? "Dari stok" : "Sebagian" },
        }), now, spId, sp[0].updated_at]);
        if (spRes.changes !== 1) throw new MaterialError(409, "Sparepart berubah oleh pengguna lain — muat ulang", "STALE");
      }
    }

    /* PR sumber yang belum diproses procurement dikurangi sesuai sisa, supaya
       barang yang sudah keluar dari stok tidak ikut dibeli. PR yang sudah
       disetujui/RFQ/PO dibiarkan: pengadaan sudah berjalan. */
    const prId = String(mr.requisitionId ?? "");
    if (prId) {
      const pr = await q<Row>("SELECT id, branch, data, updated_at FROM requisitions WHERE id = ?", [prId]);
      const prData = pr[0] ? parse(pr[0]) : null;
      if (pr[0] && prData && PR_OPEN.has(String(prData.status ?? ""))) {
        const unitPrice = Number(prData.qty) > 0 ? Number(prData.amount ?? 0) / Number(prData.qty) : 0;
        const nextPr: Data = shortage === 0
          ? { ...prData, qty: 0, amount: 0, status: "Dibatalkan", note: `${String(prData.note ?? "")} — dipenuhi dari stok (${id})`.trim() }
          : { ...prData, qty: shortage, amount: Math.round(unitPrice * shortage) };
        const prRes = await exec("UPDATE requisitions SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [
          JSON.stringify(nextPr), now, prId, pr[0].updated_at,
        ]);
        if (prRes.changes !== 1) throw new MaterialError(409, "PR berubah oleh pengguna lain — muat ulang", "STALE");
      }
    }
    return { id, given: give, issued, shortage, status, movementId };
  });
}
