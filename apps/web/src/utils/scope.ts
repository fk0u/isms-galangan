import type { WbsItem } from "../data/store";

// Ruang lingkup proyek: array objek {service, harga, deskripsi, lokasi?}.
// Data lama (string[] atau objek dengan lokasi) dinormalisasi saat baca agar tidak rusak.
export interface ScopeItem {
  service: string;
  harga?: number;
  lokasi?: string;
  deskripsi?: string;
}

export function scopeList(scope: unknown): ScopeItem[] {
  if (!Array.isArray(scope)) return [];
  const out: ScopeItem[] = [];
  for (const s of scope) {
    if (typeof s === "string") {
      if (s.trim()) out.push({ service: s.trim() });
      continue;
    }
    if (s && typeof s === "object") {
      const o = s as Record<string, unknown>;
      const service = String(o.service ?? o.name ?? "").trim();
      if (!service) continue;
      const rawHarga = Number(o.harga ?? o.price ?? o.nilai ?? o.biaya ?? 0);
      out.push({
        service,
        ...(Number.isFinite(rawHarga) && rawHarga > 0 ? { harga: rawHarga } : {}),
        ...(String(o.lokasi ?? "").trim() ? { lokasi: String(o.lokasi).trim() } : {}),
        ...(String(o.deskripsi ?? o.desc ?? "").trim() ? { deskripsi: String(o.deskripsi ?? o.desc).trim() } : {}),
      });
    }
  }
  return out;
}

/** Total harga seluruh item ruang lingkup. */
export function scopeTotal(scope: unknown): number {
  return scopeList(scope).reduce((sum, s) => sum + (Number(s.harga) || 0), 0);
}

/** Nama service untuk pencocokan (Dashboard Sea Trial, filter, dsb). */
export function scopeNames(scope: unknown): string[] {
  return scopeList(scope).map((s) => s.service);
}

/** Normalisasi prioritas lama: "Kritis" dihapus → "Tinggi". */
export function canonPrioritas(p: unknown): string {
  return String(p ?? "Sedang") === "Kritis" ? "Tinggi" : String(p ?? "Sedang");
}

export interface ScopeCategoryGroup<T extends WbsItem = WbsItem> {
  category: string;
  scopeItem?: ScopeItem;
  cost: number;
  weight: number;
  tasks: T[];
  avgProgress: number;
}

/**
 * Sinkronisasi bobot WBS otomatis dengan nilai biaya ruang lingkup:
 * 1. Setiap ruang lingkup mendapat bobot persentase dari rasio harga terhadap total harga ruang lingkup (atau bagi rata bila total harga = 0).
 * 2. Tahapan WBS di dalam kategori tersebut membagi rata bobot kategori tersebut.
 * 3. Total persentase seluruh tahapan bernilai 100%.
 */
export function syncWbsWeightsWithScope<T extends WbsItem>(
  wbsList: readonly T[],
  scope: unknown
): T[] {
  if (!wbsList || wbsList.length === 0) return [];
  const scopes = scopeList(scope);

  // Kasus tanpa ruang lingkup: bagi rata ke semua tahapan
  if (scopes.length === 0) {
    const n = wbsList.length;
    const baseWeight = Math.floor((100 / n) * 10) / 10;
    return wbsList.map((w, idx) => ({
      ...w,
      weight: idx === n - 1 ? Math.max(0, Math.round((100 - baseWeight * (n - 1)) * 10) / 10) : baseWeight,
    }));
  }

  const totalCost = scopes.reduce((sum, s) => sum + (Number(s.harga) || 0), 0);

  // Hitung bobot per kategori ruang lingkup
  const scopeWeights: Record<string, number> = {};
  if (totalCost > 0) {
    let accumulated = 0;
    scopes.forEach((s, idx) => {
      if (idx === scopes.length - 1) {
        scopeWeights[s.service] = Math.max(0, Math.round((100 - accumulated) * 10) / 10);
      } else {
        const w = Math.round(((Number(s.harga) || 0) / totalCost) * 100 * 10) / 10;
        scopeWeights[s.service] = w;
        accumulated += w;
      }
    });
  } else {
    // Bila total harga 0, bagi rata antar ruang lingkup
    const n = scopes.length;
    const baseWeight = Math.floor((100 / n) * 10) / 10;
    scopes.forEach((s, idx) => {
      scopeWeights[s.service] = idx === n - 1 ? Math.max(0, Math.round((100 - baseWeight * (n - 1)) * 10) / 10) : baseWeight;
    });
  }

  // Petakan setiap task ke category (atau fallback ke scope pertama bila kosong/tak dikenal)
  const defaultScope = scopes[0]?.service || "Umum";
  const tasksByCategory: Record<string, T[]> = {};

  for (const s of scopes) {
    tasksByCategory[s.service] = [];
  }

  for (const w of wbsList) {
    const rawCat = (w.category || w.scopeRef || "").trim();
    const matchedScope = scopes.find((s) => s.service === rawCat);
    const cat = matchedScope ? matchedScope.service : defaultScope;
    if (!tasksByCategory[cat]) tasksByCategory[cat] = [];
    tasksByCategory[cat].push(w);
  }

  // Hitung bobot task dalam masing-masing kategori
  const updatedTaskWeights = new Map<string, number>();

  for (const s of scopes) {
    const cat = s.service;
    const catWeight = scopeWeights[cat] ?? 0;
    const catTasks = tasksByCategory[cat] || [];
    const m = catTasks.length;
    if (m === 0) continue;

    const baseTaskWeight = Math.floor((catWeight / m) * 10) / 10;
    let accTask = 0;
    catTasks.forEach((t, idx) => {
      if (idx === m - 1) {
        const finalWeight = Math.max(0, Math.round((catWeight - accTask) * 10) / 10);
        updatedTaskWeights.set(t.task, finalWeight);
      } else {
        updatedTaskWeights.set(t.task, baseTaskWeight);
        accTask += baseTaskWeight;
      }
    });
  }

  return wbsList.map((w) => {
    const rawCat = (w.category || w.scopeRef || "").trim();
    const matchedScope = scopes.find((s) => s.service === rawCat);
    const cat = matchedScope ? matchedScope.service : defaultScope;
    const computedWeight = updatedTaskWeights.get(w.task) ?? 0;
    return {
      ...w,
      category: cat,
      scopeRef: cat,
      weight: computedWeight,
    };
  });
}

/**
 * Mengelompokkan tahapan WBS ke dalam kategori ruang lingkup
 */
export function groupWbsByScope<T extends WbsItem>(
  wbsList: readonly T[],
  scope: unknown
): ScopeCategoryGroup<T>[] {
  const scopes = scopeList(scope);
  const synced = syncWbsWeightsWithScope(wbsList, scope);
  const totalCost = scopes.reduce((sum, s) => sum + (Number(s.harga) || 0), 0);

  if (scopes.length === 0) {
    const avgProg = synced.length > 0
      ? Math.round(synced.reduce((sum, w) => sum + (Number(w.progress) || 0), 0) / synced.length)
      : 0;
    return [{
      category: "Umum",
      cost: 0,
      weight: 100,
      tasks: synced,
      avgProgress: avgProg,
    }];
  }

  return scopes.map((s) => {
    const cat = s.service;
    const tasks = synced.filter((w) => (w.category || w.scopeRef) === cat);
    const cost = Number(s.harga) || 0;
    const weight = totalCost > 0
      ? Math.round((cost / totalCost) * 100 * 10) / 10
      : Math.round((100 / scopes.length) * 10) / 10;
    const avgProgress = tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / tasks.length)
      : 0;
    return {
      category: cat,
      scopeItem: s,
      cost,
      weight,
      tasks,
      avgProgress,
    };
  });
}
