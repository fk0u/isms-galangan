/* Permintaan material proyek (F3-D-01, ADR-0007 → ADR-0018, alur ETC-03).
 *
 * Mekanik/proyek meminta barang untuk sebuah proyek (dari WBS atau tab
 * Sparepart). Sejak ADR-0018 (issue #73) permintaan TIDAK memotong stok:
 *   1. permintaan dicatat "Menunggu Approval Gudang"; bila stok tidak cukup,
 *      kekurangannya langsung jadi Purchase Request (PR)
 *   2. gudang menyetujui → barang keluar sebanyak stok yang ada (movement OUT)
 *      atau menolak dengan alasan → tidak ada pergerakan stok, PR dibatalkan
 *   3. sisa yang menunggu PO dipenuhi setelah barang masuk (fulfill)
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
export type MrStatus = "Dipenuhi dari stok" | "Menunggu PO" | "Sebagian diterima" | "Selesai" | "Menunggu Approval Gudang" | "Ditolak Gudang";

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
    /* ADR-0018: tidak ada barang keluar di sini. `prQty` = bagian yang memang
       tidak ada di gudang dan perlu dibeli; sisanya menunggu persetujuan gudang. */
    const issued = 0;
    const shortage = qty;
    const prQty = Math.max(0, qty - stock);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const ref = { projectId: input.projectId, ...(input.wbsTask ? { wbsId: input.wbsTask, wbsTask: input.wbsTask } : {}) };

    const mrId = newId("MR");
    const movementId: string | null = null;

    // Harga satuan: inventori menyimpan `cost`; `price`/`unitPrice` untuk data lama.
    const unitPrice = Number(item.cost ?? item.price ?? item.unitPrice ?? 0) || 0;
    let requisitionId: string | null = null;
    if (prQty > 0) {
      requisitionId = newId("PR");
      await insert("requisitions", requisitionId, {
        projectId: input.projectId, item: itemName, itemId: row.id, qty: prQty, unit,
        status: "Diajukan", date: today, requestedBy: input.actor, by: input.actor, project: input.projectId,
        amount: Math.round(unitPrice * prQty), ref, sourceRequestIds: [mrId],
        note: `Permintaan material proyek ${input.projectId}${input.wbsTask ? ` / WBS ${input.wbsTask}` : ""}: butuh ${qty}, stok ${stock}`,
      }, now);
    }

    // Rencana pemenuhan (bukan hasil): stok cukup → akan dari stok; kurang → menunggu PO.
    const status: MaterialRequestResult["status"] = prQty === 0 ? "Dari stok" : "Menunggu PO";

    let sparepartId: string | null = null;
    if (input.purpose === "sparepart") {
      sparepartId = newId("SP");
      await insert("spareparts", sparepartId, {
        name: itemName,
        partNumber: String(item.sku ?? item.code ?? row.id),
        category: input.sparepart?.category ?? String(item.category ?? "Lainnya"),
        status: "Akan",
        cost: Math.round(unitPrice * qty),
        notes: input.sparepart?.notes ?? "",
        technician: input.sparepart?.technician ?? "-",
        usedDate: "-",
        warrantyUntil: input.sparepart?.warrantyUntil ?? "-",
        projectId: input.projectId,
        vesselId: "",
        requestDate: today,
        inventoryItemId: row.id,
        materialRequestId: mrId,
        qty,
        unit,
        fulfillment: { status: "Menunggu PO", issued, shortage, movementId, requisitionId },
      }, now);
    }

    await insert("materialRequests", mrId, {
      projectId: input.projectId, itemId: row.id, item: itemName, unit, purpose: input.purpose,
      wbsTask: input.wbsTask ?? "", requested: qty, issued, shortage,
      status: "Menunggu Approval Gudang" satisfies MrStatus, approvalStatus: "Menunggu ACC",
      requestedBy: input.actor, date: today,
      movementIds: [], requisitionId, sparepartId, note: input.note ?? "",
    }, now);

    return {
      itemId: row.id, itemName, requested: qty, issued, shortage,
      stockAfter: stock, movementId, requisitionId, sparepartId, materialRequestId: mrId, status,
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
    /* Permintaan lama (tanpa approvalStatus) dibuat sebelum ADR-0018 dan tetap
       boleh dipenuhi; yang baru wajib sudah disetujui gudang. */
    const approval = String(mr.approvalStatus ?? "");
    if (approval !== "" && approval !== "Disetujui") {
      throw new MaterialError(409, approval === "Ditolak" ? "Permintaan ini ditolak gudang" : "Permintaan belum disetujui gudang", "NOT_APPROVED");
    }
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
    // "Selesai" hanya bila sempat menunggu pembelian; tanpa PR = dipenuhi dari stok.
    const status = mrStatus(issued, shortage, String(mr.requisitionId ?? "") !== "");
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
          ? { ...prData, qty: 0, amount: 0, status: "Dibatalkan", note: `${String(prData.note ?? "")} (dipenuhi dari stok ${id})`.trim() }
          : { ...prData, qty: shortage, amount: Math.round(unitPrice * shortage) };
        const prRes = await exec("UPDATE requisitions SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [
          JSON.stringify(nextPr), now, prId, pr[0].updated_at,
        ]);
        if (prRes.changes !== 1) throw new MaterialError(409, "PR berubah oleh pengguna lain, silakan muat ulang", "STALE");
      }
    }
    return { id, given: give, issued, shortage, status, movementId };
  });
}

export interface DecisionResult { id: string; decision: "approve" | "reject"; status: MrStatus; issued: number; shortage: number; movementId: string | null }

/** Keputusan gudang atas permintaan material (ADR-0018). Setuju = barang keluar
 *  sebanyak stok yang ada; tolak = tanpa pergerakan stok, PR terbuka dibatalkan. */
export async function decideMaterialRequest(id: string, decision: "approve" | "reject", actor: string, note: string): Promise<DecisionResult> {
  return withTx(async () => {
    const rows = await q<Row>("SELECT id, branch, data, updated_at FROM materialRequests WHERE id = ?", [id]);
    const mrRow = rows[0];
    if (!mrRow) throw new MaterialError(404, `Permintaan ${id} tidak ada`, "NOT_FOUND");
    const mr = parse(mrRow);
    if (String(mr.approvalStatus ?? "") !== "Menunggu ACC") throw new MaterialError(409, "Permintaan ini sudah diputuskan", "ALREADY_DECIDED");
    const now = new Date().toISOString();
    const shortage = Number(mr.shortage ?? 0);
    const issued = Number(mr.issued ?? 0);

    if (decision === "reject") {
      if (note.trim() === "") throw new MaterialError(422, "Alasan penolakan wajib diisi", "UNPROCESSABLE");
      const next: Data = { ...mr, status: "Ditolak Gudang" satisfies MrStatus, approvalStatus: "Ditolak", rejectReason: note.trim(), decidedBy: actor, decidedAt: now };
      const res = await exec("UPDATE materialRequests SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [JSON.stringify(next), now, id, mrRow.updated_at]);
      if (res.changes !== 1) throw new MaterialError(409, "Permintaan berubah oleh pengguna lain — muat ulang", "STALE");
      const prId = String(mr.requisitionId ?? "");
      if (prId) {
        const pr = await q<Row>("SELECT id, branch, data, updated_at FROM requisitions WHERE id = ?", [prId]);
        const prData = pr[0] ? parse(pr[0]) : null;
        if (pr[0] && prData && PR_OPEN.has(String(prData.status ?? ""))) {
          await exec("UPDATE requisitions SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [
            JSON.stringify({ ...prData, qty: 0, amount: 0, status: "Dibatalkan", note: `${String(prData.note ?? "")} - permintaan ${id} ditolak gudang`.trim() }), now, prId, pr[0].updated_at,
          ]);
        }
      }
      return { id, decision, status: "Ditolak Gudang", issued, shortage, movementId: null };
    }

    const approved: Data = { ...mr, approvalStatus: "Disetujui", decidedBy: actor, decidedAt: now, status: "Menunggu PO" satisfies MrStatus };
    const res = await exec("UPDATE materialRequests SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [JSON.stringify(approved), now, id, mrRow.updated_at]);
    if (res.changes !== 1) throw new MaterialError(409, "Permintaan berubah oleh pengguna lain — muat ulang", "STALE");
    const inv = await q<Row>("SELECT data FROM inventory WHERE id = ?", [String(mr.itemId ?? "")]);
    const stock = Math.max(0, Number((inv[0] ? parse(inv[0] as Row) : {}).stock ?? 0) || 0);
    if (stock <= 0) return { id, decision, status: "Menunggu PO", issued, shortage, movementId: null };
    const f = await fulfillMaterialRequest(id, actor);
    return { id, decision, status: f.status, issued: f.issued, shortage: f.shortage, movementId: f.movementId };
  });
}
