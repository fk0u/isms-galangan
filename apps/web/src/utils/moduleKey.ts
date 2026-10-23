/* Kunci modul (#289/#288) - sama dengan MODULE_KEYS server (moduleAccess.ts).
 * Dipakai untuk menyembunyikan menu, halaman, dan notifikasi modul yang tidak
 * boleh dibuka role pengguna. */
import { canOpenModule, type ModuleAccess } from "../auth/auth";

/** Dari path: "/proyek/monitoring" → "monitoring", "/proyek/X" → "proyek",
 *  "/pengaturan/peran" → "pengaturan", "/qc-safety" → "qc". */
export function moduleKeyOf(path: string): string {
  const seg = path.split(/[?#]/, 1)[0]!.split("/").filter(Boolean);
  if (seg[0] === "proyek" && seg[1] === "monitoring") return "monitoring";
  if (seg[0] === "qc-safety") return "qc";
  return seg[0] ?? "dashboard";
}

/* Label modul di catatan aktivitas (log(..., "Keuangan")) → kunci modul. */
const ACTIVITY_MODULE: Record<string, string> = {
  keuangan: "keuangan", pajak: "keuangan", sdm: "sdm", hr: "sdm", proyek: "proyek", boq: "proyek",
  inventori: "inventori", sparepart: "inventori", subkontraktor: "subkontraktor", equipment: "equipment",
  procurement: "procurement", qc: "qc", safety: "qc", payroll: "payroll", drydock: "drydock",
  kapal: "kapal", dokumen: "dokumen", crm: "crm", absensi: "absensi", service: "proyek",
  pengaturan: "pengaturan", laporan: "laporan",
};
export function activityModuleKey(label: unknown): string | null {
  return ACTIVITY_MODULE[String(label ?? "").trim().toLowerCase()] ?? null;
}

type U = { modules?: ModuleAccess } | null | undefined;
/** Notifikasi/aktivitas hanya untuk role yang boleh membuka modulnya (#288). */
export const canSeePath = (user: U, to: string): boolean => canOpenModule(user, moduleKeyOf(to));
export const canSeeActivity = (user: U, moduleLabel: unknown): boolean => {
  const k = activityModuleKey(moduleLabel);
  return k === null || canOpenModule(user, k);
};
