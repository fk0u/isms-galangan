/* Barang keluar eceran & potongan (F3-G-03, INV-08).
 *
 * Model stok:
 *   stock     = jumlah kemasan/lembar UTUH (satuan beli) — dipakai modul lain apa adanya
 *   openBase  = sisa kemasan yang sudah dibuka, dalam satuan dasar (liter/kg/meter)
 * Barang keluar dalam satuan dasar memakai sisa kemasan terbuka dulu, lalu
 * membuka kemasan utuh seperlunya. Plat: potongan p × l (mm) → kg terpakai
 * dihitung proporsional dari luas & berat per lembar.
 * Logika yang sama ada di server (services/api/src/inventoryIssue.ts). */
import type { UnitConversion } from "./unitConversion";

export interface StockState { stock: number; openBase: number }

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

export function totalBase(s: StockState, perUnit: number): number {
  return round3(Math.max(0, s.stock) * perUnit + Math.max(0, s.openBase));
}

export type IssueResult = { ok: true; next: StockState; opened: number } | { ok: false; error: string };

/** Keluarkan `qty` satuan dasar. */
export function issueBase(s: StockState, perUnit: number, qty: number): IssueResult {
  if (!(perUnit > 0)) return { ok: false, error: "Konversi satuan belum diatur" };
  if (!(qty > 0)) return { ok: false, error: "Jumlah harus lebih dari 0" };
  const available = totalBase(s, perUnit);
  if (qty > available + 1e-9) return { ok: false, error: `Stok tidak cukup (tersedia ${available})` };
  const open = Math.max(0, s.openBase);
  if (qty <= open + 1e-9) return { ok: true, next: { stock: s.stock, openBase: round3(open - qty) }, opened: 0 };
  const need = qty - open;
  // Ceiling pada rasio eksak (epsilon), bukan setelah dibulatkan.
  const opened = Math.ceil(need / perUnit - 1e-9);
  return { ok: true, next: { stock: s.stock - opened, openBase: round3(opened * perUnit - need) }, opened };
}

/** Berat (kg) potongan plat p × l mm dari lembar berdimensi & berat tertentu. */
export function plateCutKg(conv: UnitConversion, lengthMm: number, widthMm: number): number | null {
  const L = Number(conv.dims?.lengthMm ?? 0);
  const W = Number(conv.dims?.widthMm ?? 0);
  const kg = Number(conv.dims?.weightKg ?? conv.perUnit ?? 0);
  if (!(L > 0 && W > 0 && kg > 0 && lengthMm > 0 && widthMm > 0)) return null;
  if (lengthMm > L || widthMm > W) return null;
  return round3(((lengthMm * widthMm) / (L * W)) * kg);
}

/** "3 drum (550 L)": kemasan utuh + kemasan terbuka, total satuan dasar. */
export function formatStockWithBase(s: StockState, unit: string, conv: UnitConversion | null): string {
  const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  if (!conv || !(conv.perUnit > 0)) return `${fmt(s.stock)} ${unit}`;
  const containers = s.stock + (s.openBase > 0 ? 1 : 0);
  const base = conv.baseUnit === "liter" ? "L" : conv.baseUnit;
  return `${fmt(containers)} ${unit} (${fmt(totalBase(s, conv.perUnit))} ${base})`;
}
