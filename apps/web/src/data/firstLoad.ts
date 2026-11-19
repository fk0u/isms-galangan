// Status "data belum pernah ditarik dari server" (permintaan CTO 19 Nov:
// default seluruh data tampil "-" sebelum benar-benar ter-fetch dari database).
// Modul terpisah tanpa dependensi store supaya komponen UI dasar (KpiCard,
// EmptyState) bisa membacanya tanpa import melingkar.
import { useEffect, useState } from "react";

const fetchedOnce = new Set<string>();
let pending = 0;
const listeners = new Set<(p: boolean) => void>();
const publish = (): void => listeners.forEach((l) => l(pending > 0));

/** Dipanggil saat batch mulai; true bila batch berisi koleksi yang belum pernah ter-fetch. */
export function beginFirstLoad(cols: string[]): boolean {
  if (cols.every((c) => fetchedOnce.has(c))) return false;
  pending += 1;
  publish();
  return true;
}

/** Dipanggil saat batch selesai. Koleksi gagal tidak ditandai supaya dicoba lagi. */
export function endFirstLoad(started: boolean, ok: string[]): void {
  for (const c of ok) fetchedOnce.add(c);
  if (!started) return;
  pending = Math.max(0, pending - 1);
  publish();
}

/** true selama ada batch yang menarik koleksi untuk pertama kali di sesi ini. */
export function useFirstLoadPending(): boolean {
  const [p, setP] = useState(pending > 0);
  useEffect(() => {
    listeners.add(setP);
    setP(pending > 0);
    return () => { listeners.delete(setP); };
  }, []);
  return p;
}

/** Placeholder seragam untuk nilai yang belum ter-fetch. */
export const NOT_LOADED = "-";
