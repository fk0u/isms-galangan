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

/** JSON tanpa `actorRole`: cap itu milik server (stampRole), jadi salinan klien
 *  yang belum resync tidak memilikinya dan tidak boleh dianggap berbeda. */
export const withoutRole = (v: unknown): string => JSON.stringify(v, (k, val: unknown) => (k === "actorRole" ? undefined : val));

// Schema rute menerima anggota array apa pun; yang bukan objek dianggap tahapan kosong.
const stages = (v: unknown): Data[] => (Array.isArray(v) ? v : []).map((s) => (typeof s === "object" && s !== null ? s as Data : {}));
const photoUrls = (stage: Data): string[] => (Array.isArray(stage.photos) ? stage.photos : [])
  .map((p) => (typeof p === "object" && p !== null ? str((p as Data).url) : "")).filter((u) => u !== "");
/** Riwayat lama harus utuh sebagai awalan dan foto lama tidak boleh hilang. */
function keepsRecord(old: Data, next: Data): boolean {
  const before = Array.isArray(old.history) ? old.history : [];
  const after = Array.isArray(next.history) ? next.history : [];
  // Cap peran ditambahkan server (stampRole), jadi salinan klien yang belum resync tidak memilikinya.
  if (after.length < before.length || before.some((h, i) => withoutRole(h) !== withoutRole(after[i]))) return false;
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
  const prevList = stages(before);
  const prev = new Map(prevList.map((s) => [str(s.task), s]));
  const names = new Set(stages(after).map((s) => str(s.task)));
  return after.map((stage) => {
    if (typeof stage !== "object" || stage === null || !Array.isArray((stage as Data).history)) return stage;
    const s = stage as Data;
    // Tahapan yang diganti nama: riwayat lamanya dicari lewat isi, supaya peran lama tidak tertimpa.
    const old = prev.get(str(s.task)) ?? prevList.find((o) => !names.has(str(o.task)) && len(o.history) > 0 && keepsRecord(o, s));
    return { ...s, history: stampRole(old?.history, s.history, role) };
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

/** #92: pembuatan material lewat katalog tidak boleh membuat stok awal.
 *  Stok hanya bertambah lewat penerimaan barang masuk / PO. */
export function catalogStockGuardError(table: string, data: Data): string | null {
  if (table !== "inventory") return null;
  if (data.stock !== undefined && Number(data.stock) > 0) {
    return "Material baru tidak boleh memiliki stok awal lewat katalog; stok diisi melalui penerimaan barang PO";
  }
  return null;
}

/** BOM per proyek (ADR-0020): kebutuhan > 0 dan satu material hanya sekali per
 *  proyek - tambah kebutuhan dengan mengubah baris yang ada, bukan menduplikasi. */
/** Alokasi material per tahapan WBS (catatan klien 17 Okt, K17-PM-03):
 *  `alokasi` opsional, berisi {wbsTask, qty}; tahapan wajib & unik, qty > 0,
 *  dan total alokasi tidak boleh melebihi kebutuhan BOM proyek. */
export function bomAllocationError(alokasi: unknown, need: number): string | null {
  if (alokasi === undefined || alokasi === null) return null;
  if (!Array.isArray(alokasi)) return "Alokasi BOM harus berupa daftar tahapan";
  const seen = new Set<string>();
  let total = 0;
  for (const a of alokasi) {
    const row = (typeof a === "object" && a !== null ? a : {}) as Data;
    const task = str(row.wbsTask);
    const qty = Number(row.qty);
    if (task === "") return "Alokasi BOM wajib menyebut tahapan WBS";
    if (!Number.isFinite(qty) || qty <= 0) return `Jumlah material untuk tahapan "${task}" harus lebih dari 0`;
    if (seen.has(task)) return `Tahapan "${task}" tercatat dua kali pada material yang sama`;
    seen.add(task);
    total += qty;
  }
  return total > need + 1e-9 ? `Total alokasi per tahapan (${total}) melebihi kebutuhan BOM (${need})` : null;
}

export async function bomItemError(table: string, id: string | null, data: Data): Promise<string | null> {
  if (table !== "bomItems") return null;
  const need = Number(data.need);
  if (!Number.isFinite(need) || need <= 0) return "Kebutuhan BOM harus lebih dari 0";
  if (str(data.projectId) === "" || str(data.itemId) === "") return "BOM wajib menyebut proyek dan material";
  const allocErr = bomAllocationError(data.alokasi, need);
  if (allocErr) return allocErr;
  const rows = await q<{ id: string; data: string }>("SELECT id, data FROM bomItems", []);
  const dup = rows.some((r) => {
    if (r.id === id) return false;
    const d = JSON.parse(r.data) as Data;
    return str(d.projectId) === str(data.projectId) && str(d.itemId) === str(data.itemId);
  });
  return dup ? "Material ini sudah ada di BOM proyek tersebut; ubah kebutuhannya saja" : null;
}

/** Fee proyek untuk pihak ketiga (K17-PM-15, jawaban klien Q22): dasar hitung
 *  persen ATAU nominal dari nilai proyek, dan baru boleh ditagihkan/dibayar
 *  setelah proyek Selesai. `fees` disimpan di baris proyek. */
export function projectFeeError(table: string, before: Data | null, after: Data): string | null {
  if (table !== "projects" || after.fees === undefined) return null;
  if (!Array.isArray(after.fees)) return "Fee proyek harus berupa daftar";
  const old = new Map((Array.isArray(before?.fees) ? (before?.fees as Data[]) : []).map((f) => [str(f.id), f]));
  for (const f of after.fees as Data[]) {
    if (typeof f !== "object" || f === null) return "Baris fee tidak valid";
    if (str(f.penerima) === "") return "Penerima fee wajib diisi";
    const nilai = Number(f.nilai);
    if (str(f.basis) === "persen") {
      if (!Number.isFinite(nilai) || nilai <= 0 || nilai > 100) return "Persentase fee harus di antara 0 dan 100";
    } else if (str(f.basis) === "nominal") {
      if (!Number.isFinite(nilai) || nilai <= 0) return "Nominal fee harus lebih dari 0";
    } else {
      return "Dasar fee harus persen atau nominal";
    }
    const status = str(f.status) || "Belum";
    const was = str(old.get(str(f.id))?.status) || "Belum";
    if (status !== "Belum" && status !== was && str(after.status) !== "Selesai") {
      return "Fee proyek baru bisa ditagihkan setelah proyek Selesai";
    }
  }
  return null;
}

/** Persetujuan invoice PO (Q27): hanya dari Menunggu ke Disetujui, dan nilainya
 *  harus sudah ada (PO Kecil menunggu nilai nota). */
export function payableApprovalError(table: string, before: Data, after: Data): string | null {
  if (table !== "payables") return null;
  /* Invoice PO dibayar setelah disetujui Keuangan (alur: terbit → disetujui → dibayar). */
  const paid = (d: Data): number => (Number(d.pay1) || 0) + (Number(d.pay2) || 0);
  if (after.persetujuan === "Menunggu" && (paid(after) > paid(before) || (after.st === "Lunas" && before.st !== "Lunas"))) {
    return "Invoice PO belum disetujui Keuangan: setujui dulu sebelum dibayar";
  }
  if (before.persetujuan === after.persetujuan) return null;
  if (before.persetujuan === "Disetujui") return "Invoice yang sudah disetujui tidak bisa dikembalikan ke Menunggu";
  if (after.persetujuan === "Disetujui" && !(Number(after.amt) > 0)) return "Invoice bernilai 0 belum bisa disetujui: lengkapi nilai nota/PO dulu";
  if (after.persetujuan !== "Disetujui") return "Status persetujuan invoice tidak dikenal";
  return null;
}
