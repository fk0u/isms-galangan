/* Lembur otomatis (F3-L-07, ABS-05): lembur = jam kerja − jam standar,
 * dibatasi per hari dan per minggu (Senin–Minggu). Tanpa shift. */
export interface OvertimeRules { workHours: number; maxDaily: number; maxWeekly: number }
export const DEFAULT_OVERTIME_RULES: OvertimeRules = { workHours: 8, maxDaily: 4, maxWeekly: 18 };

const toMinutes = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h <= 23 && mi <= 59 ? h * 60 + mi : null;
};

/** Jam kerja dari check-in/out (lewat tengah malam didukung), dibulatkan 2 desimal. */
export function workedHours(checkIn: string, checkOut: string): number {
  const a = toMinutes(checkIn);
  const b = toMinutes(checkOut);
  if (a === null || b === null) return 0;
  const diff = b >= a ? b - a : b + 24 * 60 - a;
  return Math.round((diff / 60) * 100) / 100;
}

/** Lembur harian sebelum batas mingguan. */
export function dailyOvertime(hours: number, rules: OvertimeRules = DEFAULT_OVERTIME_RULES): number {
  return Math.round(Math.min(rules.maxDaily, Math.max(0, hours - rules.workHours)) * 100) / 100;
}

/** Senin dari minggu tanggal ISO (kunci pengelompokan mingguan). */
export function weekKey(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Senin = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Terapkan batas mingguan secara kronologis: lembur hari-hari terakhir dipangkas dulu. */
export function applyWeeklyCap(days: { date: string; hours: number }[], rules: OvertimeRules = DEFAULT_OVERTIME_RULES): { date: string; overtime: number }[] {
  const used = new Map<string, number>();
  return [...days].sort((x, y) => x.date.localeCompare(y.date)).map((d) => {
    const wk = weekKey(d.date);
    const left = Math.max(0, rules.maxWeekly - (used.get(wk) ?? 0));
    const ot = Math.min(left, dailyOvertime(d.hours, rules));
    used.set(wk, (used.get(wk) ?? 0) + ot);
    return { date: d.date, overtime: Math.round(ot * 100) / 100 };
  });
}
