/* Jenis baris `clients`: Klien atau Karyawan. Data lama di produksi mencampur
 * nama karyawan ke daftar klien (masukan klien 9 Nov 2026). Field `jenis` yang
 * diisi manual selalu menang; bila kosong ditebak: berbadan usaha atau punya
 * proyek/penawaran/kontrak → Klien, selain itu → Karyawan. */
export type ClientJenis = "Klien" | "Karyawan";

const BADAN_USAHA = /^(PT|CV|UD|PD|FIRMA|FA|KOPERASI|KOP|YAYASAN|PERUM|PERSERO|BUMN|BUMD|DINAS|KSO|TBK)\b\.?/i;

export function clientJenis(c: Record<string, unknown>, activeNames: Set<string>): ClientJenis {
  if (c.jenis === "Klien" || c.jenis === "Karyawan") return c.jenis;
  const name = String(c.name ?? "").trim();
  if (BADAN_USAHA.test(name) || /\b(PT|CV|TBK)\b\.?$/i.test(name)) return "Klien";
  return activeNames.has(name.replace(/\s+/g, " ").toUpperCase()) ? "Klien" : "Karyawan";
}
