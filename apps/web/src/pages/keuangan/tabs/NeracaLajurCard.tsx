/* Neraca lajur / worksheet (#284): per akun → saldo awal, mutasi periode,
 * penyesuaian (jurnal bersumber "Penyesuaian", mis. tutup buku), neraca
 * saldo disesuaikan, lalu dipecah ke Laba Rugi (akun 4-9) dan Neraca (1-3).
 * Periode mengikuti filter Neraca; "awal" = jurnal ≤ as-of di luar periode. */
import { useMemo } from "react";
import { Card, CardHeader } from "../../../components/ui";
import type { StoreItem } from "../../../data/store";
import { fmtRupiah } from "../../../utils/format";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";

type Pair = [number, number];
interface Row { kode: string; nama: string; awal: Pair; mutasi: Pair; adj: Pair; ns: Pair; lr: Pair; nr: Pair }

/** Saldo bersih d-k → sisi debit/kredit. */
const side = (net: number): Pair => (net >= 0 ? [net, 0] : [0, -net]);

export function buildLajur(journals: StoreItem[], coa: StoreItem[], inPeriod: (date: string) => boolean, asOf: string): Row[] {
  const m = new Map<string, { awal: number; md: number; mk: number; ad: number; ak: number }>();
  for (const j of journals) {
    if (j.status === "Void") continue;
    const tgl = String(j.date ?? "").slice(0, 10);
    const inP = inPeriod(tgl);
    if (!inP && tgl > asOf) continue;
    const amt = Number(j.amount) || 0;
    const adj = String(j.sumber ?? "") === "Penyesuaian";
    for (const [kode, sign] of [[String(j.db ?? ""), 1], [String(j.kr ?? ""), -1]] as const) {
      if (!kode) continue;
      const r = m.get(kode) ?? { awal: 0, md: 0, mk: 0, ad: 0, ak: 0 };
      if (!inP) r.awal += sign * amt;
      else if (adj) { if (sign > 0) r.ad += amt; else r.ak += amt; }
      else if (sign > 0) r.md += amt; else r.mk += amt;
      m.set(kode, r);
    }
  }
  const nameOf = (k: string): string => String(coa.find((c) => String(c.kode) === k)?.nama ?? k);
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([kode, r]) => {
    const ns = side(r.awal + r.md - r.mk + r.ad - r.ak);
    const isLR = /^[4-9]/.test(kode);
    return { kode, nama: nameOf(kode), awal: side(r.awal), mutasi: [r.md, r.mk], adj: [r.ad, r.ak], ns, lr: isLR ? ns : [0, 0], nr: isLR ? [0, 0] : ns };
  });
}

const COLS = ["awal", "mutasi", "adj", "ns", "lr", "nr"] as const;

export default function NeracaLajurCard({ journals, coa, inPeriod, asOf, periodLabel, onExport }: { journals: StoreItem[]; coa: StoreItem[]; inPeriod: (d: string) => boolean; asOf: string; periodLabel?: string; onExport: () => void }) {
  const { locale } = useT();
  const S = n_fin[locale];
  const rows = useMemo(() => buildLajur(journals, coa, inPeriod, asOf), [journals, coa, inPeriod, asOf]);
  const head = [S.nlAwal, S.nlMutasi, S.nlAdj, S.nlNs, S.nlLr, S.nlNr];
  const tot = COLS.map((c) => rows.reduce<Pair>((t, r) => [t[0] + r[c][0], t[1] + r[c][1]], [0, 0]));
  // Laba = selisih kolom Laba Rugi; tampil di baris penyeimbang seperti worksheet manual.
  const laba = tot[4][1] - tot[4][0];
  const cell = (v: number) => (v ? fmtRupiah(v) : "-");

  return (
    <Card className="p-4">
      <CardHeader title={S.nlTitle} subtitle={S.nlSub.replace("{d}", asOf)} action={<button className="btn-secondary text-xs" onClick={onExport}>{S.histExport}</button>} />
      {periodLabel && <p className="mb-2 text-xs text-steel-500"><span className="font-semibold">{S.histLabel}</span> {periodLabel}</p>}
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full min-w-[116rem] table-fixed text-xs">
          <thead className="bg-surface sticky top-0 z-10">
            <tr>
              <th className="th w-20" rowSpan={2}>{S.colKode}</th>
              <th className="th w-56" rowSpan={2}>{S.colNamaAkun}</th>
              {head.map((h) => <th key={h} className="th text-center" colSpan={2}>{h}</th>)}
            </tr>
            <tr>{head.flatMap((h) => [<th key={`${h}d`} className="th text-right">D</th>, <th key={`${h}k`} className="th text-right">K</th>])}</tr>
          </thead>
          <tbody className="divide-y divide-steel-100">
            {rows.map((r) => (
              <tr key={r.kode} className="hover:bg-surface">
                <td className="td font-mono">{r.kode}</td>
                <td className="td whitespace-nowrap text-steel-600">{r.nama}</td>
                {COLS.flatMap((c) => [<td key={`${c}d`} className="td text-right">{cell(r[c][0])}</td>, <td key={`${c}k`} className="td text-right">{cell(r[c][1])}</td>])}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-steel-200 bg-surface font-bold">
            <tr>
              <td className="td" /><td className="td">{S.nlTotal}</td>
              {tot.flatMap((t, i) => [<td key={`t${i}d`} className="td text-right">{cell(t[0])}</td>, <td key={`t${i}k`} className="td text-right">{cell(t[1])}</td>])}
            </tr>
            <tr>
              <td className="td" /><td className="td">{laba >= 0 ? S.nlLaba : S.nlRugi}</td>
              <td className="td" colSpan={8} />
              <td className="td text-right">{laba >= 0 ? cell(laba) : "-"}</td><td className="td text-right">{laba < 0 ? cell(-laba) : "-"}</td>
              <td className="td text-right">{laba < 0 ? cell(-laba) : "-"}</td><td className="td text-right">{laba >= 0 ? cell(laba) : "-"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
