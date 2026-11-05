/* Riwayat tutup buku (#314, ADR-0023): daftar arsip snapshot tiap periode yang
 * ditutup, rincian (Neraca, Laba Rugi, Neraca Lajur, Kas & Bank), ekspor Excel,
 * dan perbandingan dua periode. Arsip dibaca dari /api/closing/archives dan
 * tidak berubah oleh transaksi sesudahnya. */
import { useCallback, useEffect, useState } from "react";
import { Archive, Eye } from "lucide-react";
import { Card, CardHeader, Modal, toast } from "../../../components/ui";
import { apiFetch } from "../../../services/http";
import { exportExcelSheets, styledRow } from "../../../utils/export";
import { fmtRupiah } from "../../../utils/format";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";

type Pair = [number, number];
interface Line { kode: string; nama: string; nilai: number }
interface Snapshot {
  lajur: Array<{ kode: string; nama: string; awal: Pair; mutasi: Pair; adj: Pair; ns: Pair; lr: Pair; nr: Pair }>;
  neraca: { aktiva: Line[]; kewajiban: Line[]; ekuitas: Line[]; laba: number; totalAktiva: number; selisih: number; totalPasiva: number };
  labaRugi: { pendapatan: number; bebanPokok: number; biayaUsaha: number; lainnya: number; labaPeriode: number };
  kasBank: Array<{ kode: string; nama: string; awal: number; masuk: number; keluar: number; akhir: number }>;
}
interface ArcMeta { id: string; period: string; kind: "month" | "year"; version: number; closedAt: string; closedBy: string; backfilled: boolean; totalAktiva: number; labaPeriode: number; asOf: string }
interface Arc extends ArcMeta { stockValue: number; snapshot: Snapshot }

const COLS = ["awal", "mutasi", "adj", "ns", "lr", "nr"] as const;
const cell = (v: number): string => (v ? fmtRupiah(v) : "-");
const sumKas = (a: Arc): number => a.snapshot.kasBank.reduce((s, k) => s + k.akhir, 0);

/** Metrik yang dibandingkan antar dua arsip (A = lama, B = baru). */
export function compareMetrics(a: Arc, b: Arc): Array<{ key: string; a: number; b: number; delta: number }> {
  const m = (key: string, f: (x: Arc) => number) => ({ key, a: f(a), b: f(b), delta: f(b) - f(a) });
  return [
    m("totalAktiva", (x) => x.snapshot.neraca.totalAktiva),
    m("totalPasiva", (x) => x.snapshot.neraca.totalPasiva),
    m("labaBerjalan", (x) => x.snapshot.neraca.laba),
    m("labaPeriode", (x) => x.snapshot.labaRugi.labaPeriode),
    m("pendapatan", (x) => x.snapshot.labaRugi.pendapatan),
    m("bebanPokok", (x) => x.snapshot.labaRugi.bebanPokok),
    m("biayaUsaha", (x) => x.snapshot.labaRugi.biayaUsaha),
    m("kasBank", sumKas),
    m("persediaan", (x) => x.stockValue),
  ];
}

export default function ClosingArchives({ canClose, locked, refreshKey }: { canClose: boolean; locked: string[]; refreshKey: number }) {
  const { locale } = useT();
  const S = n_fin[locale];
  const [list, setList] = useState<ArcMeta[] | null>(null);
  const [view, setView] = useState<Arc | null>(null);
  const [tab, setTab] = useState<"neraca" | "lr" | "lajur" | "kas">("neraca");
  const [pick, setPick] = useState<string[]>([]);
  const [cmp, setCmp] = useState<[Arc, Arc] | null>(null);

  const load = useCallback(() => apiFetch<ArcMeta[]>("/api/closing/archives").then(setList).catch(() => setList(null)), []);
  useEffect(() => { void load(); }, [load, refreshKey]);

  const open = (id: string) => apiFetch<Arc>(`/api/closing/archives/${id}`).then((a) => { setTab("neraca"); setView(a); }).catch((e: unknown) => toast(e instanceof Error ? e.message : String(e), "info"));
  const compare = async () => {
    const [a, b] = await Promise.all(pick.map((id) => apiFetch<Arc>(`/api/closing/archives/${id}`)));
    setCmp(a.asOf <= b.asOf ? [a, b] : [b, a]);
  };
  const backfill = async () => {
    const r = await apiFetch<{ created: string[] }>("/api/closing/backfill", { method: "POST", body: JSON.stringify({}) });
    toast(S.arcBackfillDone.replace("{n}", String(r.created.length)));
    await load();
  };
  const exportArc = (a: Arc) => {
    const s = a.snapshot;
    const kop = (title: string) => ({ company: "PT Syukur Bersaudara", title, period: `${a.period} (v${a.version})` });
    const pasiva = [...s.neraca.kewajiban, ...s.neraca.ekuitas, { kode: "", nama: S.nrLabaBerjalan, nilai: s.neraca.laba }, { kode: "3-999", nama: "Historical Balancing", nilai: s.neraca.selisih }];
    void exportExcelSheets([
      { name: "Neraca", header: kop(`${S.arcTitle} - ${S.nrTitle}`), rows: [
        styledRow("head", [S.colKode, S.colNamaAkun, "Nilai"]),
        styledRow("section", [S.nrAktiva, "", ""]), ...s.neraca.aktiva.map((l) => [l.kode, l.nama, l.nilai]), styledRow("total", ["", `Total ${S.nrAktiva}`, s.neraca.totalAktiva]),
        styledRow("section", [S.nrPasiva, "", ""]), ...pasiva.map((l) => [l.kode, l.nama, l.nilai]), styledRow("total", ["", `Total ${S.nrPasiva}`, s.neraca.totalPasiva]),
      ] },
      { name: "Laba Rugi", header: kop(`${S.arcTitle} - ${S.arcTabLr}`), rows: [
        styledRow("head", [S.colNamaAkun, "Nilai"]),
        [S.arcPendapatan, s.labaRugi.pendapatan], [S.arcBebanPokok, s.labaRugi.bebanPokok], [S.arcBiayaUsaha, s.labaRugi.biayaUsaha], [S.arcLain, s.labaRugi.lainnya],
        styledRow("total", [S.arcLabaPeriode, s.labaRugi.labaPeriode]),
      ] },
      { name: "Neraca Lajur", header: kop(`${S.arcTitle} - ${S.nlTitle}`), rows: [
        styledRow("head", [S.colKode, S.colNamaAkun, ...[S.nlAwal, S.nlMutasi, S.nlAdj, S.nlNs, S.nlLr, S.nlNr].flatMap((h) => [`${h} Debit`, `${h} Kredit`])]),
        ...s.lajur.map((r) => [r.kode, r.nama, ...COLS.flatMap((c) => r[c])]),
      ] },
      { name: "Kas & Bank", header: kop(`${S.arcTitle} - ${S.arcTabKas}`), rows: [
        styledRow("head", [S.colKode, S.colNamaAkun, "Saldo Awal", "Masuk", "Keluar", "Saldo Akhir"]),
        ...s.kasBank.map((k) => [k.kode, k.nama, k.awal, k.masuk, k.keluar, k.akhir]),
      ] },
    ], `Arsip-Tutup-Buku-${a.period}-v${a.version}`);
  };

  if (list === null) return null;
  const missing = locked.filter((p) => !list.some((a) => a.period === p));
  const label = (a: ArcMeta): string => `${a.period}${a.version > 1 ? ` v${a.version}` : ""}`;
  const metricName = (k: string): string => (S as unknown as Record<string, string>)[`arcM_${k}`] ?? k;

  return (
    <Card className="p-4">
      <CardHeader
        title={S.arcTitle}
        subtitle={S.arcSub}
        action={<div className="flex gap-2">
          {canClose && missing.length > 0 && <button type="button" className="btn-secondary text-xs" onClick={() => { void backfill(); }}>{S.arcBackfillBtn.replace("{n}", String(missing.length))}</button>}
          <button type="button" className="btn-secondary text-xs" disabled={pick.length !== 2} title={S.arcCompareHint} onClick={() => { void compare(); }}>{S.arcCompare}</button>
        </div>}
      />
      {list.length === 0 ? <p className="text-xs text-steel-400">{S.arcEmpty}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface"><tr>
              <th className="th w-8" />
              <th className="th">{S.arcPeriod}</th><th className="th">{S.arcClosedAt}</th><th className="th">{S.arcBy}</th>
              <th className="th text-right">{S.nrAktiva}</th><th className="th text-right">{S.arcLabaPeriode}</th><th className="th" />
            </tr></thead>
            <tbody className="divide-y divide-steel-100">
              {list.map((a) => (
                <tr key={a.id} className="hover:bg-surface">
                  <td className="td"><input type="checkbox" aria-label={label(a)} checked={pick.includes(a.id)} disabled={!pick.includes(a.id) && pick.length >= 2} onChange={(e) => setPick(e.target.checked ? [...pick, a.id] : pick.filter((x) => x !== a.id))} /></td>
                  <td className="td font-semibold text-navy-900"><span className="inline-flex items-center gap-1.5"><Archive className="h-3.5 w-3.5 text-navy-600" />{label(a)}</span>{a.backfilled && <span className="ml-2 text-[10px] text-amber-700" title={S.arcBackfilledTip}>{S.arcBackfilled}</span>}</td>
                  <td className="td">{a.closedAt.slice(0, 16).replace("T", " ")}</td>
                  <td className="td">{a.closedBy}</td>
                  <td className="td text-right">{fmtRupiah(a.totalAktiva)}</td>
                  <td className="td text-right">{fmtRupiah(a.labaPeriode)}</td>
                  <td className="td text-right"><button type="button" className="btn-secondary text-xs inline-flex items-center gap-1" onClick={() => { void open(a.id); }}><Eye className="h-3.5 w-3.5" />{S.arcView}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view ? `${S.arcTitle} ${label(view)}` : ""} subtitle={view ? S.arcAsOf.replace("{d}", view.asOf) : undefined} extraWide
        footer={view ? <button type="button" className="btn-secondary" onClick={() => exportArc(view)}>{S.histExport}</button> : undefined}>
        {view && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {([["neraca", S.nrTitle], ["lr", S.arcTabLr], ["lajur", S.nlTitle], ["kas", S.arcTabKas]] as const).map(([id, t]) => (
                <button key={id} type="button" className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === id ? "bg-navy-900 text-white" : "bg-surface text-steel-600"}`} onClick={() => setTab(id)}>{t}</button>
              ))}
            </div>
            {tab === "neraca" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {([
                  [S.nrAktiva, view.snapshot.neraca.aktiva, view.snapshot.neraca.totalAktiva],
                  [S.nrPasiva, [...view.snapshot.neraca.kewajiban, ...view.snapshot.neraca.ekuitas, { kode: "", nama: S.nrLabaBerjalan, nilai: view.snapshot.neraca.laba }, { kode: "3-999", nama: "Historical Balancing", nilai: view.snapshot.neraca.selisih }], view.snapshot.neraca.totalPasiva],
                ] as Array<[string, Line[], number]>).map(([title, rows, total]) => (
                  <table key={title} className="w-full text-xs">
                    <thead><tr><th className="th" colSpan={3}>{title}</th></tr></thead>
                    <tbody className="divide-y divide-steel-100">
                      {rows.map((l) => <tr key={`${l.kode}-${l.nama}`}><td className="td font-mono text-steel-500">{l.kode || "-"}</td><td className="td">{l.nama}</td><td className="td text-right font-semibold">{fmtRupiah(l.nilai)}</td></tr>)}
                    </tbody>
                    <tfoot className="border-t-2 border-steel-200 font-bold"><tr><td className="td" /><td className="td">Total {title}</td><td className="td text-right">{fmtRupiah(total)}</td></tr></tfoot>
                  </table>
                ))}
              </div>
            )}
            {tab === "lr" && (
              <table className="w-full max-w-xl text-xs"><tbody className="divide-y divide-steel-100">
                {([[S.arcPendapatan, view.snapshot.labaRugi.pendapatan], [S.arcBebanPokok, view.snapshot.labaRugi.bebanPokok], [S.arcBiayaUsaha, view.snapshot.labaRugi.biayaUsaha], [S.arcLain, view.snapshot.labaRugi.lainnya]] as Array<[string, number]>).map(([n, v]) => <tr key={n}><td className="td">{n}</td><td className="td text-right">{fmtRupiah(v)}</td></tr>)}
                <tr className="font-bold"><td className="td">{S.arcLabaPeriode}</td><td className="td text-right">{fmtRupiah(view.snapshot.labaRugi.labaPeriode)}</td></tr>
              </tbody></table>
            )}
            {tab === "lajur" && (
              <div className="max-h-[28rem] overflow-auto">
                <table className="w-full min-w-[116rem] table-fixed text-xs">
                  <thead className="sticky top-0 bg-surface"><tr>
                    <th className="th w-20">{S.colKode}</th><th className="th w-56">{S.colNamaAkun}</th>
                    {[S.nlAwal, S.nlMutasi, S.nlAdj, S.nlNs, S.nlLr, S.nlNr].flatMap((h) => [<th key={`${h}d`} className="th text-right">{h} D</th>, <th key={`${h}k`} className="th text-right">{h} K</th>])}
                  </tr></thead>
                  <tbody className="divide-y divide-steel-100">
                    {view.snapshot.lajur.map((r) => (
                      <tr key={r.kode}><td className="td font-mono">{r.kode}</td><td className="td whitespace-nowrap">{r.nama}</td>
                        {COLS.flatMap((c) => [<td key={`${c}d`} className="td text-right">{cell(r[c][0])}</td>, <td key={`${c}k`} className="td text-right">{cell(r[c][1])}</td>])}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === "kas" && (
              <table className="w-full text-xs">
                <thead className="bg-surface"><tr><th className="th">{S.colKode}</th><th className="th">{S.colNamaAkun}</th><th className="th text-right">{S.nlAwal}</th><th className="th text-right">{S.arcIn}</th><th className="th text-right">{S.arcOut}</th><th className="th text-right">{S.arcEnd}</th></tr></thead>
                <tbody className="divide-y divide-steel-100">
                  {view.snapshot.kasBank.map((k) => <tr key={k.kode}><td className="td font-mono">{k.kode}</td><td className="td">{k.nama}</td><td className="td text-right">{fmtRupiah(k.awal)}</td><td className="td text-right">{fmtRupiah(k.masuk)}</td><td className="td text-right">{fmtRupiah(k.keluar)}</td><td className="td text-right font-semibold">{fmtRupiah(k.akhir)}</td></tr>)}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!cmp} onClose={() => setCmp(null)} title={S.arcCompare} subtitle={cmp ? `${label(cmp[0])} → ${label(cmp[1])}` : undefined} wide>
        {cmp && (
          <table className="w-full text-xs">
            <thead className="bg-surface"><tr><th className="th">{S.colPos}</th><th className="th text-right">{label(cmp[0])}</th><th className="th text-right">{label(cmp[1])}</th><th className="th text-right">{S.arcDelta}</th></tr></thead>
            <tbody className="divide-y divide-steel-100">
              {compareMetrics(cmp[0], cmp[1]).map((m) => (
                <tr key={m.key}><td className="td">{metricName(m.key)}</td><td className="td text-right">{fmtRupiah(m.a)}</td><td className="td text-right">{fmtRupiah(m.b)}</td>
                  <td className={`td text-right font-semibold ${m.delta < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtRupiah(m.delta)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </Card>
  );
}
