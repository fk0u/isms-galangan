/**
 * listPersistence.ts
 *
 * Utilitas lintas modul (#111) untuk mempertahankan stabilitas daftar:
 * 1. Menjaga urutan deterministik saat edit/resync (kunci non-sort tidak berpindah).
 * 2. Menghitung posisi halaman/item secara konsisten saat field kunci sort diedit.
 * 3. Mempertahankan posisi scroll viewport saat aksi simpan/edit dijalankan.
 */

import type { SortState } from "../components/ui";
import { cmpVal } from "../components/ui";
import { createdAtOf } from "./timestamps";

/** Cari halaman (1-indexed) di mana sebuah item berada pada daftar terpaginasi. */
export function findItemPage<T extends { id?: string | number }>(
  items: T[],
  itemId: string | number,
  pageSize: number,
): number | null {
  if (!pageSize || pageSize <= 0) return 1;
  const idx = items.findIndex((it) => String(it.id) === String(itemId));
  if (idx < 0) return null;
  return Math.floor(idx / pageSize) + 1;
}

/** Tie-breaker deterministik untuk menjaga stabilitas urutan bila nilai sort sama. */
export function compareStableTieBreaker<T>(a: T, b: T): number {
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const ca = createdAtOf(ra) ?? String(ra.createdAt ?? ra.created_at ?? "");
  const cb = createdAtOf(rb) ?? String(rb.createdAt ?? rb.created_at ?? "");
  const cCmp = cb.localeCompare(ca);
  if (cCmp !== 0) return cCmp;
  return String(rb.id ?? "").localeCompare(String(ra.id ?? ""));
}

/**
 * Pengurutan stabil deterministik: jika nilai sort identik, gunakan tanggal buat
 * dan ID sebagai tie-breaker sehingga baris tidak berpindah saat field lain diedit.
 */
export function stableSortRows<T>(
  rows: T[],
  sort: SortState,
  get: (row: T, key: string) => string | number | null | undefined,
): T[] {
  if (!sort.key) return [...rows];
  const key = sort.key as string;
  const dir = sort.dir === "asc" ? 1 : -1;
  const blank = (v: string | number | null | undefined): boolean => v === null || v === undefined || v === "";

  return [...rows].sort((ra, rb) => {
    const va = get(ra, key);
    const vb = get(rb, key);
    const ba = blank(va);
    const bb = blank(vb);
    if (ba || bb) {
      if (ba && bb) return compareStableTieBreaker(ra, rb);
      return ba ? 1 : -1;
    }
    const cmp = cmpVal(va, vb) * dir;
    if (cmp !== 0) return cmp;
    return compareStableTieBreaker(ra, rb);
  });
}

export interface ReconcileResult {
  targetPage: number;
  pageChanged: boolean;
  inFilter: boolean;
  oldIndex: number;
  newIndex: number;
  reason?: "unchanged" | "sort_moved" | "filtered_out";
}

/**
 * Evaluasi perpindahan posisi record setelah diedit terhadap aturan sort dan filter aktif.
 */
export function reconcileListAfterEdit<T extends { id?: string | number }>(params: {
  prevList: T[];
  updatedItem: T;
  currentPage: number;
  pageSize: number;
  sort: SortState;
  getSortValue: (row: T, key: string) => string | number | null | undefined;
  filterPredicate?: (row: T) => boolean;
}): ReconcileResult {
  const { prevList, updatedItem, currentPage, pageSize, sort, getSortValue, filterPredicate } = params;
  const itemId = updatedItem.id;
  const oldIndex = prevList.findIndex((it) => String(it.id) === String(itemId));

  const inFilter = filterPredicate ? filterPredicate(updatedItem) : true;
  if (!inFilter) {
    return {
      targetPage: currentPage,
      pageChanged: false,
      inFilter: false,
      oldIndex,
      newIndex: -1,
      reason: "filtered_out",
    };
  }

  // Gantikan item dalam daftar
  const nextList = prevList.map((it) => (String(it.id) === String(itemId) ? updatedItem : it));
  const sorted = stableSortRows(nextList, sort, getSortValue);
  const newIndex = sorted.findIndex((it) => String(it.id) === String(itemId));
  const newPage = Math.floor(newIndex / pageSize) + 1;

  if (newIndex === oldIndex) {
    return {
      targetPage: currentPage,
      pageChanged: false,
      inFilter: true,
      oldIndex,
      newIndex,
      reason: "unchanged",
    };
  }

  return {
    targetPage: newPage,
    pageChanged: newPage !== currentPage,
    inFilter: true,
    oldIndex,
    newIndex,
    reason: "sort_moved",
  };
}

/**
 * Menjaga posisi scroll window saat menjalankan aksi async (mis. simpan form).
 */
export async function preserveScroll<R>(action: () => Promise<R> | R): Promise<R> {
  const hasWindow = typeof window !== "undefined";
  const scrollY = hasWindow ? window.scrollY : 0;
  const scrollX = hasWindow ? window.scrollX : 0;

  try {
    return await action();
  } finally {
    if (hasWindow) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" as ScrollBehavior });
      });
    }
  }
}
