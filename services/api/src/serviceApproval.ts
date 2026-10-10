/* Persetujuan service proyek oleh procurement (F3-D-02, F3-J-04).
 *
 * Status kerja service tetap Scheduled → In Progress → Done (dipakai juga
 * oleh halaman kapal). Persetujuan disimpan di field terpisah `approval`
 * (Diajukan · Disetujui · Ditolak) supaya data lama tidak perlu migrasi:
 * baris lama tanpa `approval` dianggap sudah disetujui.
 *
 * Aturan server:
 *   - service baru selalu mulai Scheduled + Diajukan;
 *   - service proyek wajib menunjuk pekerjaan WBS;
 *   - `approval` hanya berubah lewat POST /api/services/:id/approval;
 *   - tidak bisa In Progress/Done sebelum Disetujui;
 *   - biaya yang berbeda dari harga item BoQ wajib disertai alasan. */
import { q, exec, withTx } from "./db.js";
import { normalizeRole } from "./policy.js";

type Data = Record<string, unknown>;
interface Row { id: string; data: string; updated_at: string }

export const SERVICE_APPROVALS = ["Diajukan", "Disetujui", "Ditolak"] as const;
export type ServiceApproval = (typeof SERVICE_APPROVALS)[number];
/* Q2: procurement yang menyetujui; direktur & developer sebagai admin. */
const APPROVER_ROLES = new Set(["procurement", "direktur", "developer"]);

export class ServiceError extends Error {
  constructor(public status: 403 | 404 | 409 | 422, message: string, public code: string) {
    super(message);
  }
}

const KNOWN_APPROVALS = new Set<string>(SERVICE_APPROVALS);

export function approvalOf(d: Data): ServiceApproval {
  const a = String(d.approval ?? "");
  return (KNOWN_APPROVALS.has(a) ? a : "Disetujui") as ServiceApproval;
}

export function canApproveService(role: string | undefined): boolean {
  return APPROVER_ROLES.has(normalizeRole(role));
}

/** Service baru dari CRUD: selalu menunggu persetujuan. */
export function normalizeNewService(data: Data): Data {
  return { ...data, status: "Scheduled", approval: "Diajukan" };
}

async function boqPrice(boqRef: string): Promise<number | null> {
  const rows = await q<Row>("SELECT id, data, updated_at FROM boq WHERE id = ?", [boqRef]);
  if (!rows[0]) return null;
  try {
    const d = JSON.parse(rows[0].data) as Data;
    return Number(d.totalPrice ?? 0) || 0;
  } catch { return null; }
}

/** Validasi tulis CRUD untuk services & materialRequests. null = boleh. */
export async function serviceGuardError(table: string, before: Data | null, after: Data | null): Promise<string | null> {
  if (table === "materialRequests" && after) {
    return "Permintaan barang hanya dibuat/diubah lewat endpoint material request";
  }
  if (table !== "services" || !after) return null;

  if (!before && String(after.projectId ?? "").trim() !== "" && String(after.wbsTask ?? "").trim() === "") {
    return "Service proyek wajib memilih pekerjaan WBS";
  }
  if (before && approvalOf(before) !== approvalOf(after)) {
    return "Persetujuan service hanya lewat POST /api/services/:id/approval";
  }
  const st = String(after.status ?? "");
  if ((st === "In Progress" || st === "Done") && approvalOf(after) !== "Disetujui") {
    return "Service belum disetujui procurement — belum boleh dikerjakan";
  }
  const boqRef = String(after.boqRef ?? "").trim();
  const costTouched = !before || before.cost !== after.cost || before.boqRef !== after.boqRef;
  if (boqRef && costTouched) {
    const price = await boqPrice(boqRef);
    if (price !== null && Math.round(Number(after.cost ?? 0)) !== Math.round(price) && String(after.costReason ?? "").trim() === "") {
      return "Biaya berbeda dari harga item BoQ — isi alasan perubahan biaya";
    }
  }
  return null;
}

/** Ubah persetujuan. Approver: Diajukan → Disetujui/Ditolak. Pengaju: Ditolak → Diajukan. */
export async function setServiceApproval(id: string, next: ServiceApproval, role: string | undefined, actor: string, note: string): Promise<Data> {
  return withTx(async () => {
    const rows = await q<Row>("SELECT id, data, updated_at FROM services WHERE id = ?", [id]);
    const row = rows[0];
    if (!row) throw new ServiceError(404, `Service ${id} tidak ada`, "NOT_FOUND");
    const data = JSON.parse(row.data) as Data;
    const cur = approvalOf(data);
    if (next === "Diajukan") {
      if (cur !== "Ditolak") throw new ServiceError(409, `Service berstatus ${cur}; hanya yang Ditolak bisa diajukan ulang`, "INVALID_TRANSITION");
    } else {
      if (!canApproveService(role)) throw new ServiceError(403, "Hanya procurement yang bisa menyetujui/menolak service", "FORBIDDEN");
      if (cur !== "Diajukan") throw new ServiceError(409, `Service sudah ${cur}`, "INVALID_TRANSITION");
      if (next === "Ditolak" && note.trim() === "") throw new ServiceError(422, "Alasan penolakan wajib diisi", "UNPROCESSABLE");
    }
    const now = new Date().toISOString();
    const updated: Data = {
      ...data,
      approval: next,
      approvalNote: note,
      ...(next === "Diajukan" ? {} : { approvedBy: actor, approvedAt: now }),
    };
    const res = await exec("UPDATE services SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ?", [
      JSON.stringify(updated), now, id, row.updated_at,
    ]);
    if (res.changes !== 1) throw new ServiceError(409, "Service berubah oleh pengguna lain — muat ulang", "STALE");
    return { id, ...updated };
  });
}
