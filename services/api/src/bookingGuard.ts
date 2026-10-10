/* F3-H-03 (EQP-05): equipment yang sedang dipinjam tidak bisa didelegasikan
 * lagi pada rentang tanggal yang bertumpang (server 409). Hanya berlaku
 * untuk baris bookings bertipe delegasi peminjaman (kind = "Peminjaman"). */
import { q } from "./db.js";

type Data = Record<string, unknown>;
const CLOSED = new Set(["Selesai", "Dibatalkan", "Dikembalikan"]);

function isActiveLoan(d: Data): boolean {
  return String(d.kind ?? "") === "Peminjaman" && !CLOSED.has(String(d.status ?? ""));
}

/** null = boleh; selain itu pesan bentrok. */
export async function loanOverlapError(table: string, id: string | null, after: Data | null): Promise<string | null> {
  if (table !== "bookings" || !after || !isActiveLoan(after)) return null;
  const equipId = String(after.equipId ?? "").trim();
  const start = String(after.startDate ?? "");
  const end = String(after.endDate ?? "");
  if (!equipId || !start || !end) return "Peminjaman wajib punya equipment, tanggal mulai, dan tanggal selesai";
  // Perbandingan string hanya benar untuk tanggal ISO ber-nol (YYYY-MM-DD).
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  // Round-trip UTC: 2024-02-31 lolos Date.parse (jadi 2 Maret) padahal bukan tanggal sah.
  const real = (d: string): boolean => { const t = new Date(`${d}T00:00:00Z`); return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d; };
  if (!ISO.test(start) || !ISO.test(end) || !real(start) || !real(end)) {
    return "Tanggal peminjaman harus berformat YYYY-MM-DD";
  }
  if (end < start) return "Tanggal selesai tidak boleh sebelum tanggal mulai";
  const rows = await q<{ id: string; data: string }>("SELECT id, data FROM bookings", []);
  for (const r of rows) {
    if (id !== null && r.id === id) continue;
    let d: Data;
    try { d = JSON.parse(r.data) as Data; } catch { continue; }
    if (!isActiveLoan(d) || String(d.equipId ?? "") !== equipId) continue;
    // Rentang tertutup [start, end] bertumpang bila mulai ≤ akhir lain dan akhir ≥ mulai lain.
    if (start <= String(d.endDate ?? "") && end >= String(d.startDate ?? "")) {
      return `Equipment sedang dipinjam ${String(d.startDate)} s.d. ${String(d.endDate)} (${r.id})`;
    }
  }
  return null;
}
