/* Analisis kehadiran harian dari daftar jam tap mesin (murni, tanpa DB).
 *
 * Algoritma:
 * 1. DEBOUNCE - tap diurutkan; tap yang berjarak < debounceMin dari tap
 *    sebelumnya yang dipertahankan dianggap scan ganda dan dibuang.
 * 2. MASUK/PULANG - tap pertama = masuk; tap terakhir = pulang hanya bila
 *    berjarak >= minOutGapMin dari masuk (sama dengan aturan ingest).
 * 3. SESI (mesin status berselang masuk↔keluar) - mesin tidak mengirim tombol
 *    masuk/keluar, jadi tap dipasangkan berselang: (t0,t1) di kantor, (t1,t2)
 *    keluar, (t2,t3) di kantor, dst. Jumlah tap GANJIL (>= 3) ambigu - tidak
 *    bisa dipastikan tap mana yang keluar - maka dihitung konservatif sebagai
 *    satu sesi masuk→pulang dan diberi tanda "odd_scans" untuk ditinjau HR.
 * 4. TANDA - telat, pulang cepat, lembur, belum pulang / masih di kantor. */

export interface Span { from: string; to: string }
export type DayFlag = "late" | "early_leave" | "overtime" | "no_checkout" | "in_office" | "odd_scans";
export interface DayAnalysis {
  /** Tap setelah debounce (HH:MM, urut). */
  taps: string[];
  /** Jumlah tap mentah sebelum debounce. */
  rawCount: number;
  checkIn: string;
  checkOut: string;
  /** Rentang masuk→pulang (menit); 0 bila belum pulang. */
  spanMin: number;
  /** Total keluar di tengah hari (menit). */
  breakMin: number;
  /** Waktu bersih di kantor = spanMin - breakMin. */
  netMin: number;
  sessions: Span[];
  breaks: Span[];
  lateMin: number;
  earlyMin: number;
  overtimeMin: number;
  flags: DayFlag[];
}

export interface AnalyzeOptions {
  start?: string;
  end?: string;
  debounceMin?: number;
  minOutGapMin?: number;
  /** Hari yang dianalisis = hari ini (belum pulang → "masih di kantor"). */
  isToday?: boolean;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const toMin = (t: string): number => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export function analyzeDay(rawTaps: readonly string[], opts: AnalyzeOptions = {}): DayAnalysis {
  const start = opts.start ?? "08:00";
  const end = opts.end ?? "17:00";
  const debounce = opts.debounceMin ?? 2;
  const minGap = opts.minOutGapMin ?? 30;
  const sorted = [...new Set(rawTaps.filter((t) => HHMM.test(t)))].sort();
  const taps: string[] = [];
  for (const t of sorted) {
    const prev = taps[taps.length - 1];
    if (prev === undefined || toMin(t) - toMin(prev) >= debounce) taps.push(t);
  }
  const out: DayAnalysis = {
    taps, rawCount: sorted.length, checkIn: taps[0] ?? "", checkOut: "", spanMin: 0, breakMin: 0, netMin: 0,
    sessions: [], breaks: [], lateMin: 0, earlyMin: 0, overtimeMin: 0, flags: [],
  };
  if (taps.length === 0) return out;
  const first = taps[0] as string;
  const last = taps[taps.length - 1] as string;
  out.lateMin = Math.max(0, toMin(first) - toMin(start));
  if (out.lateMin > 0) out.flags.push("late");
  if (toMin(last) - toMin(first) < minGap) {
    out.flags.push(opts.isToday ? "in_office" : "no_checkout");
    return out;
  }
  out.checkOut = last;
  out.spanMin = toMin(last) - toMin(first);
  if (taps.length % 2 === 0) {
    for (let i = 0; i < taps.length; i += 2) out.sessions.push({ from: taps[i] as string, to: taps[i + 1] as string });
    for (let i = 1; i + 1 < taps.length; i += 2) out.breaks.push({ from: taps[i] as string, to: taps[i + 1] as string });
  } else {
    out.sessions.push({ from: first, to: last });
    out.flags.push("odd_scans");
  }
  out.breakMin = out.breaks.reduce((s, b) => s + toMin(b.to) - toMin(b.from), 0);
  out.netMin = out.spanMin - out.breakMin;
  out.earlyMin = Math.max(0, toMin(end) - toMin(last));
  out.overtimeMin = Math.max(0, toMin(last) - toMin(end));
  if (out.earlyMin > 0) out.flags.push("early_leave");
  if (out.overtimeMin > 0) out.flags.push("overtime");
  return out;
}
