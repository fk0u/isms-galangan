/* Skema pembayaran WO subkon (F3-I-05, SUB-08): termin dibuat otomatis dari
 * skema yang dipilih saat SPK. Semua nominal rupiah bulat; selisih pembulatan
 * selalu diserap termin terakhir sehingga total = nilai kontrak persis. */

export type TerminSchemeType = "Kontan" | "Persentase" | "DP";

export interface TerminPart {
  label: string;
  /** Persen dari nilai kontrak (Persentase, atau DP berbasis %). */
  pct?: number;
  /** Nominal rupiah (DP berbasis nominal). */
  amount?: number;
}

export interface TerminScheme {
  type: TerminSchemeType;
  parts: TerminPart[];
}

export interface TerminLine { label: string; amount: number }

export type BuildResult = { ok: true; lines: TerminLine[] } | { ok: false; error: string };

const sum = (xs: number[]): number => xs.reduce((s, x) => s + x, 0);

export function buildTermins(value: number, scheme: TerminScheme): BuildResult {
  const total = Math.round(value);
  if (!Number.isFinite(total) || total <= 0) return { ok: false, error: "Nilai kontrak harus lebih dari 0" };

  if (scheme.type === "Kontan") return { ok: true, lines: [{ label: "Pembayaran penuh", amount: total }] };

  if (scheme.type === "Persentase") {
    const parts = scheme.parts.filter((p) => Number(p.pct) > 0);
    if (parts.length === 0) return { ok: false, error: "Isi minimal satu tahap persentase" };
    const pctTotal = sum(parts.map((p) => Number(p.pct)));
    if (Math.abs(pctTotal - 100) > 0.001) return { ok: false, error: `Total persentase harus 100% (sekarang ${Math.round(pctTotal * 100) / 100}%)` };
    const lines = parts.map((p, i) => ({ label: p.label || `Tahap ${i + 1}`, amount: Math.round((total * Number(p.pct)) / 100) }));
    lines[lines.length - 1].amount = total - sum(lines.slice(0, -1).map((l) => l.amount));
    return { ok: true, lines };
  }

  // DP bertahap: DP1..n (nominal atau %), sisanya otomatis jadi Pelunasan.
  const dps = scheme.parts
    .map((p, i) => ({
      label: p.label || `DP ${i + 1}`,
      amount: Number(p.amount) > 0 ? Math.round(Number(p.amount)) : Math.round((total * Number(p.pct ?? 0)) / 100),
    }))
    .filter((l) => l.amount > 0);
  if (dps.length === 0) return { ok: false, error: "Isi minimal satu DP" };
  const dpTotal = sum(dps.map((l) => l.amount));
  if (dpTotal > total) return { ok: false, error: "Total DP melebihi nilai kontrak" };
  const rest = total - dpTotal;
  return { ok: true, lines: rest > 0 ? [...dps, { label: "Pelunasan", amount: rest }] : dps };
}

/** Pilihan tarif pajak termin (setting TAX_RATES, default PPh 4(2) jasa konstruksi). */
export const DEFAULT_TAX_RATES = [0, 2, 2.5, 4];
