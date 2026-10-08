// Utilitas perhitungan progres proyek berbobot (ADR-0011 & F3-B-06).
// Satu fungsi terpusat untuk semua halaman (Projects, ProjectDetail, Monitoring, Dashboard).
import type { WbsItem, StoreItem } from "../data/store";

export interface CalcProgressOptions {
  /** Daftar BoQ proyek bila tersedia */
  boq?: StoreItem[];
}

/**
 * Mencocokkan item BoQ dengan task WBS berdasarkan kesamaan nama atau referensi task.
 */
function matchBoqToTask(b: StoreItem, taskName: string): boolean {
  const bTask = String(b.task ?? "").trim().toLowerCase();
  const bName = String(b.name ?? "").trim().toLowerCase();
  const tName = taskName.trim().toLowerCase();
  if (bTask && bTask === tName) return true;
  if (bName && (bName.includes(tName) || tName.includes(bName))) return true;
  return false;
}

/**
 * Menghitung nilai rupiah item BoQ.
 */
function boqItemValue(b: StoreItem): number {
  if (typeof b.totalPrice === "number" && b.totalPrice > 0) return b.totalPrice;
  const qty = Number(b.quantity ?? 0);
  const price = Number(b.unitPrice ?? 0);
  return qty * price;
}

/**
 * Menghitung rata-rata progres WBS berbobot (ADR-0011):
 * 1. Berbobot nilai BoQ per task jika tersedia.
 * 2. Fallback: berbobot anggaran / bobot task (w.weight).
 * 3. Fallback: bobot sama (weight = 1 per task).
 */
export function calcProjectProgress(
  wbs: readonly WbsItem[] | undefined | null,
  options?: CalcProgressOptions | StoreItem[],
): number {
  if (!wbs || wbs.length === 0) return 0;

  const boqList: StoreItem[] = Array.isArray(options) ? options : (options?.boq ?? []);

  // Tahap 1: Cek apakah ada bobot berbasis BoQ
  const boqWeights = wbs.map((w) => {
    const matchedBoqs = boqList.filter((b) => matchBoqToTask(b, w.task));
    return matchedBoqs.reduce((sum, b) => sum + boqItemValue(b), 0);
  });
  const totalBoqWeight = boqWeights.reduce((s, bw) => s + bw, 0);

  if (totalBoqWeight > 0) {
    const weightedSum = wbs.reduce((acc, w, idx) => {
      const prog = Math.max(0, Math.min(100, Number(w.progress || 0)));
      return acc + (prog * (boqWeights[idx] ?? 0));
    }, 0);
    return Math.max(0, Math.min(100, Math.round(weightedSum / totalBoqWeight)));
  }

  // Tahap 2: Fallback ke bobot WBS (w.weight)
  const taskWeights = wbs.map((w) => Math.max(0, Number(w.weight || 0)));
  const totalTaskWeight = taskWeights.reduce((s, tw) => s + tw, 0);

  if (totalTaskWeight > 0) {
    const weightedSum = wbs.reduce((acc, w, idx) => {
      const prog = Math.max(0, Math.min(100, Number(w.progress || 0)));
      return acc + (prog * (taskWeights[idx] ?? 0));
    }, 0);
    return Math.max(0, Math.min(100, Math.round(weightedSum / totalTaskWeight)));
  }

  // Tahap 3: Fallback ke rata-rata bobot sama
  const sumProgress = wbs.reduce((acc, w) => {
    return acc + Math.max(0, Math.min(100, Number(w.progress || 0)));
  }, 0);
  return Math.max(0, Math.min(100, Math.round(sumProgress / wbs.length)));
}

/**
 * Menghitung progres proyek dari objek proyek dan peta wbsByProject.
 * Bila proyek tidak memiliki WBS tersimpan khusus, menggunakan nilai progress proyek bawaan.
 */
export function projectProgressOf(
  project: StoreItem,
  wbsByProject?: Record<string, WbsItem[]>,
  boqList?: StoreItem[],
): number {
  if (!project) return 0;
  const projectWbs = wbsByProject?.[project.id];
  if (projectWbs && projectWbs.length > 0) {
    const projectBoq = (boqList ?? []).filter((b) => String(b.projectId ?? "") === String(project.id));
    return calcProjectProgress(projectWbs, projectBoq);
  }
  return Math.max(0, Math.min(100, Number(project.progress || 0)));
}
