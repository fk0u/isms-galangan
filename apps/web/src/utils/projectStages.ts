/* Tahapan Progress proyek (K17-PM-10). Dipisah dari halaman Projects supaya
   form proyek baru (components/) dan halaman lain bisa memakainya tanpa impor
   melingkar. */
import type { StoreItem } from "../data/store";
import { n_prj } from "../i18n/n_prj";

/* Tahapan Progress proyek.
   - Versi 1 (lama): dipakai proyek yang sudah ada. Tahap & riwayat (`tahapLog`)
     proyek lama TIDAK diubah (jawaban klien Q20, 19 Okt) - perpindahan ke
     skema baru hanya lewat migrasi yang aman, bukan diam-diam di aplikasi.
   - Versi 2 (K17-PM-10): urutan baru untuk proyek yang dibuat sejak 19 Okt,
     ditandai `tahapVersi: 2`. */
export const TAHAP_V1 = ["Inquiry", "Quotation", "Kontrak", "Desain", "Produksi", "Trial", "Handover"];
export const TAHAP_V2 = ["Quotation", "Estimasi", "Kontrak", "Produksi", "Bill", "Invoice", "Sea Trial + Dock Report", "Pelunasan + Handover"];
/** @deprecated nama lama; sama dengan TAHAP_V1. */
export const TAHAP = TAHAP_V1;

export function tahapListOf(p: StoreItem | undefined): string[] {
  return Number(p?.tahapVersi) === 2 ? TAHAP_V2 : TAHAP_V1;
}

/** Tahap terakhir skema proyek - satu-satunya tahap tempat proyek boleh Selesai. */
export function tahapAkhirOf(p: StoreItem): string {
  const list = tahapListOf(p);
  return list[list.length - 1] as string;
}

/** Kolom kanban/filter: semua tahap skema baru + tahap lama yang masih dipakai proyek. */
export function tahapKolom(projects: StoreItem[]): string[] {
  const dipakai = new Set(projects.map((p) => tahapOf(p)));
  const lama = TAHAP_V1.filter((t) => !TAHAP_V2.includes(t) && dipakai.has(t));
  return [...TAHAP_V2.slice(0, 1), ...lama.filter((t) => t === "Inquiry"), ...TAHAP_V2.slice(1, 3), ...lama.filter((t) => t === "Desain"),
    ...TAHAP_V2.slice(3, 6), ...lama.filter((t) => t === "Trial"), TAHAP_V2[6] as string, ...lama.filter((t) => t === "Handover"), TAHAP_V2[7] as string];
}

/** #70: nilai data tetap "Desain"; yang tampil ke pengguna "Perencanaan" / "Planning".
    Tahap skema baru juga diterjemahkan untuk EN. */
export function tahapLabel(tahap: string, locale: string): string {
  const S = n_prj[locale === "en" ? "en" : "id"];
  const map: Record<string, string> = {
    Desain: S.prjStagePlanning, Estimasi: S.stgEstimasi, Bill: S.stgBill, Invoice: S.stgInvoice,
    "Sea Trial + Dock Report": S.stgSeaTrial, "Pelunasan + Handover": S.stgPelunasan,
  };
  return map[tahap] ?? tahap;
}

export function tahapOf(p: StoreItem): string {
  return tahapListOf(p).includes(p.tahap) ? p.tahap : "Produksi";
}
