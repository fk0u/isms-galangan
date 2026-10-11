/**
 * Format Rupiah manual (bukan Intl) supaya output server & browser identik
 * — beda versi ICU bisa memicu hydration mismatch.
 */
export function formatRupiah(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp${grouped}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
