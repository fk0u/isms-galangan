/* Arsip tutup buku (#314, ADR-0023): snapshot immutable kondisi keuangan saat
 * periode ditutup, dihitung di server dari jurnal. Hitungannya sama dengan
 * Neraca / Neraca Lajur di frontend (NeracaLajurCard.buildLajur, nrNeraca). */
import { exec, q } from "./db.js";
import { stockValue } from "./closing.js";

type Data = Record<string, unknown>;
export interface JournalLite { date?: unknown; db?: unknown; kr?: unknown; amount?: unknown; sumber?: unknown; status?: unknown }
export interface CoaLite { kode: string; nama: string }
type Pair = [number, number];
const side = (net: number): Pair => (net >= 0 ? [net, 0] : [0, -net]);

export interface LajurRow { kode: string; nama: string; awal: Pair; mutasi: Pair; adj: Pair; ns: Pair; lr: Pair; nr: Pair }
export interface Line { kode: string; nama: string; nilai: number }
export interface Snapshot {
  lajur: LajurRow[];
  neraca: { aktiva: Line[]; kewajiban: Line[]; ekuitas: Line[]; laba: number; totalAktiva: number; selisih: number; totalPasiva: number };
  labaRugi: { pendapatan: number; bebanPokok: number; biayaUsaha: number; lainnya: number; labaPeriode: number };
  kasBank: Array<{ kode: string; nama: string; awal: number; masuk: number; keluar: number; akhir: number }>;
  totalDebit: number;
  totalKredit: number;
}

/** Snapshot dari jurnal: periode = [periodStart, asOf]; saldo awal = sebelum periodStart. */
export function buildSnapshot(journals: JournalLite[], coa: CoaLite[], periodStart: string, asOf: string): Snapshot {
  const nameOf = (k: string): string => coa.find((c) => c.kode === k)?.nama ?? k;
  const acc = new Map<string, { awal: number; md: number; mk: number; ad: number; ak: number; cum: number }>();
  let totalDebit = 0;
  let totalKredit = 0;
  for (const j of journals) {
    if (j.status === "Void") continue;
    const tgl = String(j.date ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl) || tgl > asOf) continue;
    const amt = Number(j.amount) || 0;
    const inP = tgl >= periodStart;
    const adj = String(j.sumber ?? "") === "Penyesuaian";
    for (const [kode, sign] of [[String(j.db ?? ""), 1], [String(j.kr ?? ""), -1]] as const) {
      if (!kode) continue;
      const r = acc.get(kode) ?? { awal: 0, md: 0, mk: 0, ad: 0, ak: 0, cum: 0 };
      r.cum += sign * amt;
      if (!inP) r.awal += sign * amt;
      else if (adj) { if (sign > 0) r.ad += amt; else r.ak += amt; }
      else if (sign > 0) r.md += amt; else r.mk += amt;
      acc.set(kode, r);
    }
    totalDebit += amt;
    totalKredit += amt;
  }
  const kodes = [...acc.keys()].sort();
  const lajur: LajurRow[] = kodes.map((kode) => {
    const r = acc.get(kode)!;
    const ns = side(r.awal + r.md - r.mk + r.ad - r.ak);
    const isLR = /^[4-9]/.test(kode);
    return { kode, nama: nameOf(kode), awal: side(r.awal), mutasi: [r.md, r.mk], adj: [r.ad, r.ak], ns, lr: isLR ? ns : [0, 0], nr: isLR ? [0, 0] : ns };
  });
  const lines = (prefix: string, sign: 1 | -1): Line[] => kodes
    .filter((k) => k.startsWith(prefix) && Math.abs(acc.get(k)!.cum) >= 1)
    .map((kode) => ({ kode, nama: nameOf(kode), nilai: acc.get(kode)!.cum * sign }));
  const sum = (l: Line[]): number => l.reduce((s, x) => s + x.nilai, 0);
  const aktiva = lines("1", 1);
  const kewajiban = lines("2", -1);
  const ekuitas = lines("3", -1);
  const laba = -kodes.filter((k) => /^[4-9]/.test(k)).reduce((s, k) => s + acc.get(k)!.cum, 0);
  const totalAktiva = sum(aktiva);
  const pasivaTanpaHb = sum(kewajiban) + sum(ekuitas) + laba;
  const selisih = Math.round(totalAktiva - pasivaTanpaHb);
  const net = (re: RegExp): number => kodes.filter((k) => re.test(k)).reduce((s, k) => { const r = acc.get(k)!; return s + r.md - r.mk + r.ad - r.ak; }, 0);
  const labaRugi = { pendapatan: -net(/^4/), bebanPokok: net(/^5/), biayaUsaha: net(/^6/), lainnya: net(/^[789]/), labaPeriode: -net(/^[4-9]/) };
  const kasBank = kodes.filter((k) => /^1-1[12]/.test(k)).map((kode) => {
    const r = acc.get(kode)!;
    return { kode, nama: nameOf(kode), awal: r.awal, masuk: r.md + r.ad, keluar: r.mk + r.ak, akhir: r.cum };
  });
  return { lajur, neraca: { aktiva, kewajiban, ekuitas, laba, totalAktiva, selisih, totalPasiva: pasivaTanpaHb + selisih }, labaRugi, kasBank, totalDebit, totalKredit };
}

/** Rentang tanggal periode "YYYY-MM" atau "YYYY". */
export function periodRange(period: string): { kind: "month" | "year"; start: string; end: string } {
  if (/^\d{4}$/.test(period)) return { kind: "year", start: `${period}-01-01`, end: `${period}-12-31` };
  const [y, m] = period.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { kind: "month", start: `${period}-01`, end: `${period}-${String(last).padStart(2, "0")}` };
}

async function loadParts(): Promise<{ journals: JournalLite[]; coa: CoaLite[] }> {
  const parse = (rows: Array<{ data: string }>): Data[] => rows.map((r) => { try { return JSON.parse(r.data) as Data; } catch { return {}; } });
  const journals = parse(await q<{ data: string }>("SELECT data FROM journals")) as JournalLite[];
  const coa = parse(await q<{ data: string }>("SELECT data FROM coa")).map((c) => ({ kode: String(c.kode ?? ""), nama: String(c.nama ?? "") }));
  return { journals, coa };
}

/** Bekukan snapshot periode ke tabel closingArchives (versi naik bila ditutup ulang). */
export async function createArchive(period: string, actor: string, opts: { backfilled?: boolean } = {}): Promise<Data> {
  const { kind, start, end } = periodRange(period);
  const { journals, coa } = await loadParts();
  const prev = await q<{ id: string }>("SELECT id FROM closingArchives WHERE id LIKE ?", [`ARC-${period}-v%`]);
  const version = prev.length + 1;
  const now = new Date().toISOString();
  const data = {
    period, kind, version, periodStart: start, asOf: end, closedAt: now, closedBy: actor,
    backfilled: opts.backfilled === true, stockValue: await stockValue(),
    snapshot: buildSnapshot(journals, coa, start, end),
  };
  const id = `ARC-${period}-v${version}`;
  await exec("INSERT INTO closingArchives (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, "Samarinda", JSON.stringify(data), now]);
  return { id, ...data };
}

export async function listArchives(): Promise<Data[]> {
  const rows = await q<{ id: string; data: string }>("SELECT id, data FROM closingArchives");
  return rows.map((r): Data => {
    const d = JSON.parse(r.data) as Data & { snapshot?: Snapshot };
    const { snapshot, ...meta } = d;
    return { id: r.id, ...meta, totalAktiva: snapshot?.neraca.totalAktiva ?? 0, labaPeriode: snapshot?.labaRugi.labaPeriode ?? 0 };
  }).sort((a, b) => String(b.period).localeCompare(String(a.period)) || Number(b.version) - Number(a.version));
}

export async function getArchive(id: string): Promise<Data | null> {
  const rows = await q<{ id: string; data: string }>("SELECT id, data FROM closingArchives WHERE id = ?", [id]);
  return rows[0] ? { id: rows[0].id, ...(JSON.parse(rows[0].data) as Data) } : null;
}
