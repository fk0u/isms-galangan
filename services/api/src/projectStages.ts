/* Pemetaan tahap proyek skema lama (7 tahap) → skema 8 tahap Q20. Dipakai
 * skrip migrate:project-stages (keputusan 21 Okt: stepper semua proyek ikut
 * 8 tahap). Harus sama dengan TAHAP_V1/TAHAP_V2 di apps/web/src/utils/projectStages.ts. */
export const STAGE_V1_TO_V2: Record<string, string> = {
  Inquiry: "Quotation",
  Quotation: "Quotation",
  Kontrak: "Kontrak",
  // Perencanaan berjalan setelah kontrak dan sebelum produksi: tetap di Kontrak.
  Desain: "Kontrak",
  Produksi: "Produksi",
  Trial: "Sea Trial + Dock Report",
  Handover: "Pelunasan + Handover",
};

type Data = Record<string, unknown>;

/** Data proyek skema baru, atau null bila sudah 8 tahap. Nilai lama disimpan di
 *  `tahapV1` supaya bisa dikembalikan; `tahapLog` tidak disentuh. */
export function migrateStage(d: Data): Data | null {
  if (Number(d.tahapVersi) === 2) return null;
  const old = String(d.tahap ?? "");
  return { ...d, tahapVersi: 2, tahapV1: old, tahap: STAGE_V1_TO_V2[old] ?? "Produksi" };
}

/** Kebalikan migrateStage, hanya untuk proyek yang dipindah skrip (punya `tahapV1`). */
export function revertStage(d: Data): Data | null {
  if (!("tahapV1" in d)) return null;
  const { tahapV1, tahapVersi: _v, ...rest } = d;
  return { ...rest, tahap: tahapV1 };
}
