// #309: kurva S proyek — progres rencana vs realisasi kumulatif berbobot.
// Rencana: tiap task naik linear dari start ke end. Realisasi: progres task
// pada tanggal t diambil dari riwayat (history.to terakhir ≤ t); task tanpa
// riwayat memakai progres sekarang mulai completionDate/start.
import type { WbsItem } from "../data/store";

export interface SCurvePoint { date: string; plan: number; actual: number | null }

/** Tanggal → ms. WBS lama bisa berformat bulan saja (YYYY-MM): awal bulan
 *  untuk start, akhir bulan untuk end. */
const day = (s: string, isEnd = false): number => {
  const v = String(s ?? "");
  if (/^\d{4}-\d{2}$/.test(v)) {
    const [y, m] = v.split("-").map(Number);
    return isEnd ? Date.UTC(y, m, 0) : Date.UTC(y, m - 1, 1);
  }
  return Date.parse(`${v.slice(0, 10)}T00:00:00Z`);
};
const iso = (t: number): string => new Date(t).toISOString().slice(0, 10);

function planPct(w: WbsItem, t: number): number {
  const a = day(w.start), b = day(w.end, true);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  if (t >= b) return 100;
  if (t < a) return 0;
  return b > a ? ((t - a) / (b - a)) * 100 : 100;
}

function actualPct(w: WbsItem, t: number, now: number): number {
  const hist = (w.history ?? []).filter((h) => Number.isFinite(day(h.date))).sort((x, y) => day(x.date) - day(y.date));
  if (hist.length) {
    let v = 0;
    for (const h of hist) if (day(h.date) <= t) v = Number(h.to) || 0;
    return v;
  }
  const a = day(w.start);
  const done = day(w.completionDate ?? "");
  const b = Number.isFinite(done) ? done : now;
  const p = Number(w.progress) || 0;
  if (!Number.isFinite(a) || t < a) return 0;
  return t >= b || b <= a ? p : (p * (t - a)) / (b - a);
}

/** Titik mingguan dari start paling awal s.d. max(end terakhir, hari ini). */
export function buildSCurve(wbs: readonly WbsItem[], today: string): SCurvePoint[] {
  const rows = wbs.filter((w) => Number.isFinite(day(w.start)) && Number.isFinite(day(w.end, true)));
  if (!rows.length) return [];
  const weights = rows.map((w) => (Number(w.weight) > 0 ? Number(w.weight) : 1));
  const total = weights.reduce((s, x) => s + x, 0);
  const t0 = Math.min(...rows.map((w) => day(w.start)));
  const tEnd = Math.max(...rows.map((w) => day(w.end, true)));
  const now = day(today);
  const last = Math.max(tEnd, now);
  const W = 7 * 86400000;
  const ticks: number[] = [];
  for (let t = t0; t < last; t += W) ticks.push(t);
  ticks.push(last);
  if (now > t0 && now < last && !ticks.includes(now)) ticks.push(now);
  ticks.sort((a, b) => a - b);
  const sum = (f: (w: WbsItem, t: number, now: number) => number, t: number): number =>
    Math.round((rows.reduce((s, w, i) => s + f(w, t, now) * weights[i], 0) / total) * 10) / 10;
  return ticks.map((t) => ({ date: iso(t), plan: sum(planPct, t), actual: t <= now ? sum(actualPct, t) : null }));
}

/** Deviasi jadwal (poin %) pada hari ini: + = lebih cepat dari rencana;
 *  null bila proyek belum mulai (belum ada titik realisasi). */
export function scheduleDeviation(points: SCurvePoint[], today: string): number | null {
  const p = [...points].reverse().find((x) => x.date <= today && x.actual !== null);
  return p ? Math.round(((p.actual ?? 0) - p.plan) * 10) / 10 : null;
}
