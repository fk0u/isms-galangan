/* Tutup buku bulanan & tahunan (#283, notulen 23 Okt).
 *
 * Periode yang ditutup disimpan di setting SET-TUTUP-BUKU (value JSON:
 * { months: ["2026-09"], years: ["2025"] }). Jurnal bertanggal di periode
 * tertutup tidak bisa dibuat/diubah/dihapus sampai periodenya dibuka lagi
 * oleh direktur/developer. Tutup tahun sekaligus mencatat nilai stok
 * Inventori & Material ke Persediaan (1-161, Aktiva) lawan beban pokok
 * pembelian material (5-101), karena pembelian sudah dibebankan saat terjadi. */
import { q } from "./db.js";

type Data = Record<string, unknown>;
export interface ClosedPeriods { months: string[]; years: string[] }

export const CLOSING_ID = "SET-TUTUP-BUKU";

export async function loadClosed(): Promise<ClosedPeriods> {
  try {
    const rows = await q<{ data: string }>("SELECT data FROM settings WHERE id = ?", [CLOSING_ID]);
    if (!rows.length) return { months: [], years: [] };
    const v = JSON.parse(String((JSON.parse(rows[0].data) as Data).value ?? "{}")) as Partial<ClosedPeriods>;
    return {
      months: Array.isArray(v.months) ? v.months.map(String) : [],
      years: Array.isArray(v.years) ? v.years.map(String) : [],
    };
  } catch {
    return { months: [], years: [] };
  }
}

export function isClosed(date: unknown, c: ClosedPeriods): boolean {
  const d = String(date ?? "");
  if (!/^\d{4}-\d{2}/.test(d)) return false;
  return c.years.includes(d.slice(0, 4)) || c.months.includes(d.slice(0, 7));
}

/** Penjaga CRUD jurnal: tanggal lama ATAU baru di periode tertutup → ditolak. */
export async function closingGuardError(table: string, before: Data | null, after: Data | null): Promise<string | null> {
  if (table !== "journals") return null;
  const c = await loadClosed();
  if (c.months.length === 0 && c.years.length === 0) return null;
  for (const row of [before, after]) {
    if (row && isClosed(row.date, c)) return `Periode ${String(row.date).slice(0, 7)} sudah tutup buku; buka kembali periodenya dulu (direktur/developer)`;
  }
  return null;
}

/** Nilai stok saat ini: Σ stock × cost semua item inventori. */
export async function stockValue(): Promise<number> {
  const rows = await q<{ data: string }>("SELECT data FROM inventory", []);
  let total = 0;
  for (const r of rows) {
    try {
      const d = JSON.parse(r.data) as Data;
      const v = (Number(d.stock) || 0) * (Number(d.cost) || 0);
      if (v > 0) total += v;
    } catch { /* baris rusak dilewati */ }
  }
  return Math.round(total);
}
