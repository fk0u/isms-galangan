/* PTKP otomatis (F3-L-02, HR-10): status kawin + jumlah tanggungan → kode
 * PTKP (TK/0 … K/3). Tanggungan dibatasi 0–3 sesuai aturan PPh 21. */
export type MaritalStatus = "TK" | "K";

export function clampDependents(n: unknown): number {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(3, Math.max(0, v)) : 0;
}

export function ptkpCode(marital: unknown, dependents: unknown): string {
  const m: MaritalStatus = String(marital).toUpperCase().startsWith("K") ? "K" : "TK";
  return `${m}/${clampDependents(dependents)}`;
}

/** Urai kode lama ("K/2") menjadi status kawin + tanggungan. */
export function parsePtkp(code: unknown): { marital: MaritalStatus; dependents: number } {
  const [m, d] = String(code ?? "TK/0").split("/");
  return { marital: m === "K" ? "K" : "TK", dependents: clampDependents(d) };
}
