/* Dashboard eksekutif (#286): satu layar ringkasan untuk pimpinan yang
 * menyatukan Keuangan (kas, piutang, hutang, laba), Payroll (gaji dibayar,
 * PPh 21 gross-up, BPJS porsi perusahaan), operasional (proyek, PO), dan RAB.
 * Semua angka diturunkan dari koleksi sumber yang sama dengan modulnya, tanpa
 * angka simpanan sendiri, supaya laporan pimpinan tidak bisa berbeda. */
import { useMemo } from "react";
import { Card, CardHeader, KpiCard } from "../../components/ui";
import type { StoreItem } from "../../data/store";
import { useStore } from "../../data/store";
import { exportExcelSheets } from "../../utils/export";
import { fmtBulan, fmtRupiah } from "../../utils/format";
import { n_misc } from "../../i18n/n_misc";
import { useT } from "../../i18n/LanguageContext";

const n = (v: unknown): number => Number(v) || 0;
const neto = (i: StoreItem): number => n(i.grandTotal) || Math.max(0, n(i.amount) - n(i.retentionAmt));
const shift = (ym: string, d: number): string => {
  const [y, m] = ym.split("-").map(Number);
  const t = new Date(y, m - 1 + d, 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
};

export function useEksekutif(month: string) {
  const { data, inBranch } = useStore();
  return useMemo(() => {
    const inv = inBranch(data.invoices ?? []);
    const pay = inBranch(data.payroll ?? []);
    const ap = inBranch(data.payables ?? []);
    const jr = (data.journals ?? []).filter((j) => j.status !== "Void");
    const flow = (ym: string) => {
      const revenue = inv.filter((i) => i.status === "Lunas" && String(i.paidAt ?? "").startsWith(ym)).reduce((s, i) => s + neto(i), 0);
      const apCost = ap.filter((a) => a.st === "Lunas" && String(a.paidAt ?? "").startsWith(ym)).reduce((s, a) => s + n(a.amt), 0);
      const paid = pay.filter((p) => p.status === "Dibayar" && String(p.period) === ym);
      const gaji = paid.reduce((s, p) => s + n(p.net), 0);
      // PPh gross-up & BPJS perusahaan adalah beban perusahaan di luar gaji bersih.
      const pph = paid.reduce((s, p) => s + (p.pphGrossUp ? n(p.pph21) : 0), 0);
      const bpjsPer = paid.reduce((s, p) => s + n(p.bpjsKesPer) + n(p.bpjsTkPer), 0);
      const cost = apCost + gaji + pph + bpjsPer;
      return { ym, revenue, apCost, gaji, pph, bpjsPer, cost, laba: revenue - cost, slips: paid.length };
    };
    const cur = flow(month);
    const prev = flow(shift(month, -1));
    const trend = Array.from({ length: 6 }, (_, i) => flow(shift(month, i - 5)));
    const end = `${month}-31`;
    const kas = jr.filter((j) => String(j.date ?? "") <= end).reduce((s, j) => {
      const a = n(j.amount);
      return s + (/^1-1[12]/.test(String(j.db ?? "")) ? a : 0) - (/^1-1[12]/.test(String(j.kr ?? "")) ? a : 0);
    }, 0);
    const piutang = inv.filter((i) => !["Lunas", "Draft", "Dihapusbukukan"].includes(String(i.status))).reduce((s, i) => s + Math.max(0, neto(i) - n(i.paidTotal)), 0);
    const telat = inv.filter((i) => i.status === "Terlambat").length;
    const hutang = ap.filter((a) => a.st !== "Lunas").reduce((s, a) => s + Math.max(0, n(a.amt) - n(a.pay1) - n(a.pay2)), 0);
    const proyek = inBranch(data.projects ?? []).filter((p) => p.status !== "Selesai");
    const progres = proyek.length ? Math.round(proyek.reduce((s, p) => s + n(p.progress), 0) / proyek.length) : 0;
    const poOpen = inBranch(data.purchaseOrders ?? []).filter((p) => !["Diterima", "Selesai", "Dibatalkan", "Ditolak"].includes(String(p.status)));
    const rab = (data.rabItems ?? []).filter((r) => r.periode === month);
    const rabAnggaran = rab.reduce((s, r) => s + n(r.anggaran), 0);
    const rabAkun = new Set(rab.map((r) => String(r.akun)));
    const rabReal = jr.filter((j) => String(j.date ?? "").startsWith(month) && rabAkun.has(String(j.db ?? ""))).reduce((s, j) => s + n(j.amount), 0);
    return { cur, prev, trend, kas, piutang, telat, hutang, proyek: proyek.length, progres, poOpen: poOpen.length, poOpenVal: poOpen.reduce((s, p) => s + n(p.amount), 0), rabAnggaran, rabReal };
  }, [data, month, inBranch]);
}

export type Eksekutif = ReturnType<typeof useEksekutif>;

export function exportEksekutif(e: Eksekutif, month: string, sig: (string | number)[][]): Promise<void> {
  const c = e.cur;
  return exportExcelSheets([
    {
      name: "Ringkasan",
      rows: [
        ["Indikator", "Nilai", "Bulan lalu"],
        ["Periode", month, e.prev.ym],
        ["Pendapatan (invoice lunas)", c.revenue, e.prev.revenue],
        ["Biaya total", c.cost, e.prev.cost],
        ["  Hutang dibayar", c.apCost, e.prev.apCost],
        ["  Gaji bersih dibayar", c.gaji, e.prev.gaji],
        ["  PPh 21 ditanggung perusahaan", c.pph, e.prev.pph],
        ["  BPJS porsi perusahaan", c.bpjsPer, e.prev.bpjsPer],
        ["Laba (rugi)", c.laba, e.prev.laba],
        ["Saldo kas & bank (jurnal)", e.kas, ""],
        ["Piutang terbuka", e.piutang, ""],
        ["Invoice terlambat", e.telat, ""],
        ["Hutang terbuka", e.hutang, ""],
        ["Proyek aktif", e.proyek, ""],
        ["Rata-rata progres (%)", e.progres, ""],
        ["PO berjalan (nilai)", e.poOpenVal, ""],
        ["RAB anggaran", e.rabAnggaran, ""],
        ["RAB realisasi", e.rabReal, ""],
        ...sig,
      ],
    },
    { name: "Tren 6 Bulan", rows: [["Bulan", "Pendapatan", "Biaya", "Laba", "Gaji", "PPh 21 perusahaan", "BPJS perusahaan"], ...e.trend.map((t) => [t.ym, t.revenue, t.cost, t.laba, t.gaji, t.pph, t.bpjsPer])] },
  ], `Laporan-Eksekutif-${month}`);
}

export default function EksekutifPanel({ month }: { month: string }) {
  const e = useEksekutif(month);
  const { locale } = useT();
  const S = n_misc[locale];
  const c = e.cur;
  const delta = (a: number, b: number): string => `${S.exVsPrev} ${a - b >= 0 ? "+" : ""}${fmtRupiah(a - b)}`;
  const max = Math.max(1, ...e.trend.map((t) => Math.max(t.revenue, t.cost)));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={S.exRevenue} value={fmtRupiah(c.revenue)} hint={delta(c.revenue, e.prev.revenue)} chip="teal" />
        <KpiCard label={S.exCost} value={fmtRupiah(c.cost)} hint={delta(c.cost, e.prev.cost)} chip="navy" />
        <KpiCard label={S.exProfit} value={fmtRupiah(c.laba)} hint={delta(c.laba, e.prev.laba)} chip={c.laba >= 0 ? "teal" : "rose"} />
        <KpiCard label={S.exCash} value={fmtRupiah(e.kas)} hint={S.exCashHint} chip="violet" />
        <KpiCard label={S.exAr} value={fmtRupiah(e.piutang)} hint={S.exLate.replace("{n}", String(e.telat))} chip="amber" />
        <KpiCard label={S.exAp} value={fmtRupiah(e.hutang)} hint={S.exPo.replace("{n}", String(e.poOpen)).replace("{a}", fmtRupiah(e.poOpenVal))} chip="rose" />
        <KpiCard label={S.exPayroll} value={fmtRupiah(c.gaji + c.pph + c.bpjsPer)} hint={S.exPayrollHint.replace("{a}", fmtRupiah(c.pph)).replace("{b}", fmtRupiah(c.bpjsPer))} chip="navy" />
        <KpiCard label={S.exProjects} value={String(e.proyek)} hint={S.exProgress.replace("{n}", String(e.progres))} chip="teal" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <CardHeader title={S.exTrend} subtitle={S.exTrendSub} />
          <div className="space-y-2">
            {e.trend.map((t) => (
              <div key={t.ym} className="grid grid-cols-[4.5rem_1fr_7rem] items-center gap-2 text-xs">
                <span className="text-steel-500">{fmtBulan(t.ym)}</span>
                <div className="space-y-1">
                  <div className="h-2 rounded bg-emerald-500" style={{ width: `${(t.revenue / max) * 100}%` }} title={`${S.exRevenue} ${fmtRupiah(t.revenue)}`} />
                  <div className="h-2 rounded bg-navy-700" style={{ width: `${(t.cost / max) * 100}%` }} title={`${S.exCost} ${fmtRupiah(t.cost)}`} />
                </div>
                <span className={`text-right font-semibold ${t.laba >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{fmtRupiah(t.laba)}</span>
              </div>
            ))}
            <p className="text-[11px] text-steel-400">{S.exLegend}</p>
          </div>
        </Card>
        <Card className="p-4">
          <CardHeader title={S.exRab} subtitle={fmtBulan(month)} />
          {e.rabAnggaran === 0 ? <p className="text-xs text-steel-400">{S.exRabEmpty}</p> : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-steel-500">{S.exRabBudget}</span><span className="font-semibold">{fmtRupiah(e.rabAnggaran)}</span></div>
              <div className="flex justify-between"><span className="text-steel-500">{S.exRabReal}</span><span className="font-semibold">{fmtRupiah(e.rabReal)}</span></div>
              <div className="h-2 rounded bg-steel-100"><div className={`h-2 rounded ${e.rabReal > e.rabAnggaran ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (e.rabReal / e.rabAnggaran) * 100)}%` }} /></div>
              <p className="text-xs text-steel-500">{S.exRabPct.replace("{n}", String(Math.round((e.rabReal / e.rabAnggaran) * 100)))}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
