/* Guard aturan domain yang sebelumnya hanya ada di UI (audit issue 12 Okt):
 * #67 tahapan WBS berisi data tidak boleh terhapus, #82 Project Manager harus
 * karyawan berjabatan PM, #93 transfer gudang tidak boleh ke gudang asal.
 * Semua mengembalikan null = boleh, selain itu pesan penolakan. */
import { q } from "./db.js";

type Data = Record<string, unknown>;

const len = (v: unknown): number => (Array.isArray(v) ? v.length : 0);
const str = (v: unknown): string => String(v ?? "").trim();

/** Tahapan yang sudah punya progres, riwayat, foto, atau penugasan. */
export function stageHasData(stage: Data): boolean {
  return Number(stage.progress) > 0 || len(stage.history) > 0 || len(stage.photos) > 0
    || str(stage.photoUrl) !== "" || (typeof stage.assignee === "object" && stage.assignee !== null);
}

/** #67: tolak penyimpanan WBS yang menghilangkan tahapan berisi data.
 *  Ganti nama tetap boleh: tahapan bernama baru harus membawa riwayat & foto
 *  tahapan lama, jadi "hapus lalu tambah kosong" tidak lolos sebagai rename. */
export function wbsRemovalError(before: unknown, after: unknown): string | null {
  const prev = (Array.isArray(before) ? before : []) as Data[];
  const next = (Array.isArray(after) ? after : []) as Data[];
  const prevNames = new Set(prev.map((s) => str(s.task)));
  const nextNames = new Set(next.map((s) => str(s.task)));
  const renamed = next.filter((s) => !prevNames.has(str(s.task)));
  for (const stage of prev) {
    if (nextNames.has(str(stage.task)) || !stageHasData(stage)) continue;
    const i = renamed.findIndex((s) => len(s.history) >= len(stage.history) && len(s.photos) >= len(stage.photos));
    if (i === -1) {
      return `Tahapan "${str(stage.task)}" sudah punya progres, riwayat, foto, atau penugasan sehingga tidak bisa dihapus`;
    }
    renamed.splice(i, 1);
  }
  return null;
}

/** #77: progres tahapan yang sudah ada hanya boleh berubah bila disertai foto
 *  bukti baru. Tahapan baru (template/baseline) dan perubahan non-progres
 *  seperti penugasan tidak terkena aturan ini. */
export function wbsPhotoError(before: unknown, after: unknown): string | null {
  const prev = new Map(((Array.isArray(before) ? before : []) as Data[]).map((s) => [str(s.task), s]));
  for (const stage of (Array.isArray(after) ? after : []) as Data[]) {
    const old = prev.get(str(stage.task));
    if (!old || Number(old.progress ?? 0) === Number(stage.progress ?? 0)) continue;
    if (len(stage.photos) <= len(old.photos)) return `Perubahan progres "${str(stage.task)}" wajib disertai minimal satu foto bukti`;
  }
  return null;
}

/** Jabatan Project Manager di data karyawan (HR). Sistem tidak punya peran akun
 *  khusus PM - peran "proyek" mencakup seluruh staf proyek - jadi jabatan HR
 *  adalah satu-satunya sumber; aturan yang sama dipakai picker di web. */
export function isProjectManagerTitle(title: unknown): boolean {
  const t = str(title).toLowerCase();
  return t.includes("project manager") || t.includes("manajer proyek") || /(^|[^a-z])pm([^a-z]|$)/.test(t);
}

/** #82: manager proyek yang baru ditetapkan harus karyawan aktif berjabatan PM.
 *  Hanya saat nilainya berubah - proyek lama dengan manager lain tetap bisa diedit. */
export async function projectManagerError(table: string, before: Data | null, after: Data): Promise<string | null> {
  if (table !== "projects") return null;
  const manager = str(after.manager);
  if (manager === "" || manager === str(before?.manager)) return null;
  // ponytail: memindai seluruh karyawan; beri kolom/indeks nama bila jumlahnya ribuan.
  const rows = await q<{ data: string }>("SELECT data FROM employees");
  const found = rows.some((r) => {
    const e = JSON.parse(r.data) as Data;
    return str(e.name) === manager && isProjectManagerTitle(e.role) && str(e.status || "Aktif") === "Aktif";
  });
  return found ? null : `"${manager}" bukan karyawan aktif berjabatan Project Manager`;
}

/** #93: pergerakan Transfer wajib punya gudang asal & tujuan yang berbeda. */
export function transferError(table: string, data: Data): string | null {
  if (table !== "movements" || str(data.type) !== "Transfer") return null;
  const from = str(data.fromWh).toLowerCase();
  const to = str(data.toWh).toLowerCase();
  if (from === "" || to === "") return "Transfer wajib menyebut gudang asal dan gudang tujuan";
  return from === to ? "Gudang tujuan tidak boleh sama dengan gudang asal" : null;
}
