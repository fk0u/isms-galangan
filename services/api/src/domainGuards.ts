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

// Schema rute menerima anggota array apa pun; yang bukan objek dianggap tahapan kosong.
const stages = (v: unknown): Data[] => (Array.isArray(v) ? v : []).map((s) => (typeof s === "object" && s !== null ? s as Data : {}));
const photoUrls = (stage: Data): string[] => (Array.isArray(stage.photos) ? stage.photos : [])
  .map((p) => (typeof p === "object" && p !== null ? str((p as Data).url) : "")).filter((u) => u !== "");
/** Riwayat lama harus utuh sebagai awalan dan foto lama tidak boleh hilang. */
function keepsRecord(old: Data, next: Data): boolean {
  const before = Array.isArray(old.history) ? old.history : [];
  const after = Array.isArray(next.history) ? next.history : [];
  // Cap peran ditambahkan server (stampRole), jadi salinan klien yang belum resync tidak memilikinya.
  const plain = (h: unknown): string => JSON.stringify(typeof h === "object" && h !== null ? { ...h, actorRole: undefined } : h);
  if (after.length < before.length || before.some((h, i) => plain(h) !== plain(after[i]))) return false;
  const kept = new Set(photoUrls(next));
  return photoUrls(old).every((u) => kept.has(u));
}

/** #67 + #77: aturan penyimpanan WBS.
 *  - Tahapan berisi data tidak boleh hilang. Ganti nama boleh, asal tahapan
 *    bernama baru membawa riwayat & foto tahapan lama secara utuh.
 *  - Tahapan yang tetap ada tidak boleh kehilangan riwayat atau fotonya.
 *  - Progres tahapan yang sudah ada hanya boleh berubah bila ada foto bukti
 *    BARU (URL yang belum pernah tercatat di tahapan itu). */
export function wbsRuleError(before: unknown, after: unknown): { code: "STAGE_IN_USE" | "PHOTO_REQUIRED"; message: string } | null {
  const prev = stages(before);
  const next = stages(after);
  const byName = new Map(next.map((s) => [str(s.task), s]));
  const prevNames = new Set(prev.map((s) => str(s.task)));
  const renamed = next.filter((s) => !prevNames.has(str(s.task)));
  for (const old of prev) {
    const name = str(old.task);
    let now = byName.get(name);
    if (!now) {
      if (!stageHasData(old)) continue;
      const i = renamed.findIndex((s) => keepsRecord(old, s));
      if (i === -1) return { code: "STAGE_IN_USE", message: `Tahapan "${name}" sudah punya progres, riwayat, foto, atau penugasan sehingga tidak bisa dihapus` };
      now = renamed.splice(i, 1)[0] as Data;
    } else if (!keepsRecord(old, now)) {
      return { code: "STAGE_IN_USE", message: `Riwayat atau foto tahapan "${name}" tidak boleh dihapus` };
    }
    if (Number(old.progress ?? 0) !== Number(now.progress ?? 0)) {
      const known = new Set(photoUrls(old));
      if (!photoUrls(now).some((u) => !known.has(u))) return { code: "PHOTO_REQUIRED", message: `Perubahan progres "${name}" wajib disertai minimal satu foto bukti baru` };
    }
  }
  return null;
}

/** #90: entri log progres BARU dicap peran akun dari token, bukan dari isian
 *  klien, supaya label peran di Monitoring tidak bisa dipalsukan. Entri lama
 *  dikembalikan apa adanya (termasuk yang belum punya peran). */
export function stampRole(before: unknown, after: unknown, role: string): unknown {
  if (!Array.isArray(after)) return after;
  const old = Array.isArray(before) ? before : [];
  return after.map((entry, i) => (i < old.length ? old[i] : typeof entry === "object" && entry !== null ? { ...entry, actorRole: role } : entry));
}

/** Cap peran pada riwayat tiap tahapan WBS (dicocokkan lewat nama tahapan). */
export function stampWbsRoles(before: unknown, after: unknown, role: string): unknown {
  if (!Array.isArray(after)) return after;
  const prev = new Map(stages(before).map((s) => [str(s.task), s]));
  return after.map((stage) => {
    if (typeof stage !== "object" || stage === null || !Array.isArray((stage as Data).history)) return stage;
    const s = stage as Data;
    return { ...s, history: stampRole(prev.get(str(s.task))?.history, s.history, role) };
  });
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
    return str(e.name) === manager && isProjectManagerTitle(e.role) && (str(e.status) || "Aktif") === "Aktif";
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
