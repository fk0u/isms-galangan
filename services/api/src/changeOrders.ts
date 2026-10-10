/* Change Order lewat owner & terhubung BoQ (F3-C-05, PRJ-21).
 *
 * Alur: Diajukan → Disetujui owner (direktur/developer; ownerApproval dicatat)
 * → Diterapkan. Menerapkan CO yang menunjuk surat BoQ otomatis membuat revisi
 * surat itu berisi perubahan item (tambah/ubah/hapus), menyetujuinya atas nama
 * owner yang sudah menyetujui CO, dan memperbarui anggaran proyek dengan
 * selisih total revisi. Semua dalam satu transaksi.
 *
 * Status Disetujui/Diterapkan dan field ownerApproval/resultBoqDocId TIDAK
 * bisa ditulis lewat CRUD generik (lihat changeOrderGuardError). */
import { randomUUID } from "node:crypto";
import { exec, q, withTx } from "./db.js";
import { normalizeRole } from "./policy.js";
import { docTotal, reviseDoc, setDocStatus } from "./boqDocs.js";

type Data = Record<string, unknown>;
interface Row { id: string; branch: string; data: string; updated_at: string }

export class CoError extends Error {
  constructor(public status: 403 | 404 | 409 | 422, message: string, public code: string) { super(message); }
}

const OWNER_ROLES = new Set(["direktur", "developer"]);
const SERVER_OWNED = ["ownerApproval", "resultBoqDocId", "appliedAt", "appliedBy"] as const;
const parse = (r: Row): Data => { try { return JSON.parse(r.data) as Data; } catch { return {}; } };
const num = (v: unknown): number => Number(v ?? 0) || 0;

export interface CoChange { op: "add" | "update" | "remove"; itemId?: string; name?: string; description?: string; category?: string; quantity?: number; unit?: string; unitPrice?: number }

/** CO baru selalu Diajukan; field milik server dibuang. */
export function normalizeNewChangeOrder(data: Data): Data {
  const clean: Data = { ...data, status: "Diajukan" };
  for (const k of SERVER_OWNED) delete clean[k];
  return clean;
}

/** Guard CRUD: status Disetujui/Diterapkan & field server hanya lewat endpoint. */
export function changeOrderGuardError(table: string, before: Data | null, after: Data | null): string | null {
  if (table !== "changeOrders" || !before || !after) return null;
  if (SERVER_OWNED.some((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))) {
    return "Persetujuan owner & hasil penerapan CO hanya lewat endpoint change order";
  }
  const from = String(before.status ?? "");
  const to = String(after.status ?? "");
  if (from !== to && (to === "Disetujui" || to === "Diterapkan" || from === "Diterapkan")) {
    return "Status Disetujui/Diterapkan hanya lewat POST /api/changeOrders/:id/decision atau /apply";
  }
  if (from === "Diterapkan" && JSON.stringify(before.changes ?? null) !== JSON.stringify(after.changes ?? null)) {
    return "CO yang sudah diterapkan tidak bisa diubah";
  }
  return null;
}

async function loadCo(id: string): Promise<{ row: Row; data: Data }> {
  const rows = await q<Row>("SELECT id, branch, data, updated_at FROM changeOrders WHERE id = ?", [id]);
  if (!rows[0]) throw new CoError(404, `Change order ${id} tidak ada`, "NOT_FOUND");
  return { row: rows[0], data: parse(rows[0]) };
}

async function saveCo(row: Row, data: Data, now: string): Promise<void> {
  const res = await exec("UPDATE changeOrders SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
    JSON.stringify(data), now, row.id, row.updated_at, row.data,
  ]);
  if (res.changes !== 1) throw new CoError(409, "Change order berubah oleh pengguna lain — muat ulang", "STALE");
}

/** Keputusan owner: Disetujui / Ditolak (dari Diajukan). */
export async function decideChangeOrder(id: string, decision: "Disetujui" | "Ditolak", role: unknown, actor: string, note: string): Promise<Data> {
  if (!OWNER_ROLES.has(normalizeRole(role))) throw new CoError(403, "Hanya owner (direktur) yang bisa memutuskan change order", "FORBIDDEN");
  return withTx(async () => {
    const co = await loadCo(id);
    if (String(co.data.status ?? "") !== "Diajukan") throw new CoError(409, `Change order sudah ${String(co.data.status)}`, "INVALID_TRANSITION");
    if (decision === "Ditolak" && note.trim() === "") throw new CoError(422, "Alasan penolakan wajib diisi", "UNPROCESSABLE");
    const now = new Date().toISOString();
    const next: Data = { ...co.data, status: decision, ownerApproval: { decision, by: actor, at: now, note } };
    await saveCo(co.row, next, now);
    return { id, ...next };
  });
}

export interface ApplyResult { id: string; status: string; resultBoqDocId: string | null; oldTotal: number; newTotal: number; budget: number | null }

/** Terapkan CO yang sudah disetujui owner. */
export async function applyChangeOrder(id: string, actor: string): Promise<ApplyResult> {
  return withTx(async () => {
    const co = await loadCo(id);
    /* Status Disetujui hanya bisa dicapai lewat keputusan owner (CRUD menolak
       transisi itu), jadi status adalah bukti persetujuan; ownerApproval kosong
       hanya pada data lama yang disetujui sebelum aturan ini. */
    const approval = (co.data.ownerApproval ?? {}) as { decision?: string; by?: string };
    if (String(co.data.status ?? "") !== "Disetujui") {
      throw new CoError(409, "Change order belum disetujui owner — belum bisa diterapkan", "NOT_APPROVED");
    }
    const now = new Date().toISOString();
    const boqDocId = String(co.data.boqDocId ?? "").trim();
    const changes = Array.isArray(co.data.changes) ? (co.data.changes as CoChange[]) : [];
    let resultBoqDocId: string | null = null;
    let oldTotal = 0;
    let newTotal = 0;
    let budget: number | null = null;

    if (boqDocId && changes.length > 0) {
      oldTotal = await docTotal(boqDocId);
      const rev = await reviseDoc(boqDocId); // surat baru (Draft) + salinan item
      resultBoqDocId = rev.id;
      const copies = (await q<Row>("SELECT id, branch, data, updated_at FROM boq")).filter((r) => String(parse(r).boqDocId ?? "") === rev.id);
      const byOrigin = new Map(copies.map((r) => [String(parse(r).copiedFrom ?? ""), r]));
      const docRow = (await q<Row>("SELECT id, branch, data, updated_at FROM boqDocs WHERE id = ?", [rev.id]))[0];
      const projectId = String(parse(docRow).projectId ?? co.data.project ?? "");
      for (const ch of changes) {
        if (ch.op === "add") {
          const qty = num(ch.quantity);
          const price = num(ch.unitPrice);
          if (String(ch.name ?? "").trim() === "" || qty <= 0) throw new CoError(422, "Item tambahan wajib punya nama dan jumlah", "UNPROCESSABLE");
          await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
            `BQ-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`, docRow.branch, JSON.stringify({
              projectId, boqDocId: rev.id, name: String(ch.name).trim(), description: String(ch.description ?? ""), category: String(ch.category ?? "Change Order"),
              quantity: qty, unit: String(ch.unit ?? "ls"), unitPrice: price, totalPrice: Math.round(qty * price), status: "Approved", fromChangeOrder: id,
            }), now,
          ]);
          continue;
        }
        const target = byOrigin.get(String(ch.itemId ?? ""));
        if (!target) throw new CoError(422, `Item BoQ ${String(ch.itemId)} tidak ada di surat ${boqDocId}`, "UNPROCESSABLE");
        if (ch.op === "remove") {
          await exec("DELETE FROM boq WHERE id = ?", [target.id]);
        } else {
          const d = parse(target);
          const qty = ch.quantity !== undefined ? num(ch.quantity) : num(d.quantity);
          const price = ch.unitPrice !== undefined ? num(ch.unitPrice) : num(d.unitPrice);
          await exec("UPDATE boq SET data = ?, updated_at = ? WHERE id = ?", [
            JSON.stringify({ ...d, quantity: qty, unitPrice: price, totalPrice: Math.round(qty * price), fromChangeOrder: id }), now, target.id,
          ]);
        }
      }
      // Revisi disetujui atas nama owner yang menyetujui CO; revisi lama → Digantikan.
      await setDocStatus(rev.id, "Diajukan", actor, `Revisi dari change order ${id}`);
      await setDocStatus(rev.id, "Disetujui", String(approval.by ?? actor), `Revisi dari change order ${id}`);
      newTotal = await docTotal(rev.id);

      // Anggaran proyek mengikuti selisih total revisi.
      const proj = (await q<Row>("SELECT id, branch, data, updated_at FROM projects WHERE id = ?", [projectId]))[0];
      if (proj) {
        const pd = parse(proj);
        budget = Math.max(0, Math.round(num(pd.budget) + (newTotal - oldTotal)));
        await exec("UPDATE projects SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify({ ...pd, budget }), now, proj.id]);
      }
    }
    const next: Data = {
      ...co.data, status: "Diterapkan", appliedAt: now, appliedBy: actor, resultBoqDocId,
      ...(resultBoqDocId ? { impact: newTotal - oldTotal } : {}),
    };
    await saveCo(co.row, next, now);
    return { id, status: "Diterapkan", resultBoqDocId, oldTotal, newTotal, budget };
  });
}
