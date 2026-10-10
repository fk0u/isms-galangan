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
import { can, normalizeRole } from "./policy.js";

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

/* Field milik endpoint persetujuan — tidak boleh ditulis lewat CRUD. */
const SERVER_OWNED = ["approval", "approvedBy", "approvedAt", "approvalNote"] as const;

function hasProject(d: Data): boolean {
  return String(d.projectId ?? "").trim() !== "";
}

/** Service proyek baru dari CRUD: selalu menunggu persetujuan. Service kapal
 *  (tanpa proyek) tidak memakai alur persetujuan procurement. */
export function normalizeNewService(data: Data): Data {
  const clean: Data = { ...data };
  for (const k of SERVER_OWNED) delete clean[k];
  return hasProject(clean) ? { ...clean, status: "Scheduled", approval: "Diajukan" } : clean;
}

/* WBS proyek tersimpan di wbs_by_project; proyek tanpa baris WBS tidak divalidasi. */
async function wbsTaskError(projectId: string, task: string): Promise<string | null> {
  const rows = await q<{ data: string }>("SELECT data FROM wbs_by_project WHERE project_id = ?", [projectId]);
  if (!rows[0]) return null;
  try {
    const tasks = (JSON.parse(rows[0].data) as { task?: unknown }[]).map((w) => String(w.task ?? ""));
    return tasks.includes(task) ? null : `Pekerjaan WBS "${task}" tidak ada di proyek ${projectId}`;
  } catch { return null; }
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
  if (table === "materialRequests") {
    // Riwayat pemenuhan barang tidak boleh diubah/dihapus lewat CRUD generik.
    return after ? "Permintaan barang hanya dibuat/diubah lewat endpoint material request"
      : before ? "Permintaan barang tidak bisa dihapus — riwayat pemenuhan harus utuh" : null;
  }
  if (table !== "services" || !after) return null;

  if (before && SERVER_OWNED.some((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))) {
    return "Persetujuan service hanya lewat POST /api/services/:id/approval";
  }
  const projectId = String(after.projectId ?? "").trim();
  const wbsTask = String(after.wbsTask ?? "").trim();
  const wbsTouched = !before || before.wbsTask !== after.wbsTask || before.projectId !== after.projectId;
  if (projectId && wbsTouched) {
    if (!wbsTask) return "Service proyek wajib memilih pekerjaan WBS";
    const err = await wbsTaskError(projectId, wbsTask);
    if (err) return err;
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
export async function setServiceApproval(
  id: string, next: ServiceApproval, role: string | undefined, actor: string, note: string,
  audit: (svc: Data) => Promise<void>,
): Promise<Data> {
  return withTx(async () => {
    const rows = await q<Row>("SELECT id, data, updated_at FROM services WHERE id = ?", [id]);
    const row = rows[0];
    if (!row) throw new ServiceError(404, `Service ${id} tidak ada`, "NOT_FOUND");
    const data = JSON.parse(row.data) as Data;
    const cur = approvalOf(data);
    if (next === "Diajukan") {
      // Pengajuan ulang oleh pihak yang boleh mengubah service (proyek/manager) atau approver.
      if (!can(role, "services", "w") && !canApproveService(role)) throw new ServiceError(403, "Peran ini tidak boleh mengajukan service", "FORBIDDEN");
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
    // Audit di transaksi yang sama: gagal tulis audit = keputusan dibatalkan.
    await audit({ id, ...updated });
    return { id, ...updated };
  });
}
