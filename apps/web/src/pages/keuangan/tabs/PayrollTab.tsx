import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { EmptyState, KpiCard, StatusBadge, toast } from "../../../components/ui";
import type { StoreItem } from "../../../data/store";
import { useStore } from "../../../data/store";
import { useAuth } from "../../../auth/auth";
import { PayrollPayModal, canPayPayroll } from "../../../components/PayrollPayModal";
import { exportBpjsCompanyReport, exportPphReport } from "../../../utils/payrollReports";
import { fmtBulan, fmtRupiah, fmtTanggal, todayISO } from "../../../utils/format";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";

/* #281: HR menghitung & menyetujui gaji di modul Payroll; Keuangan membayar
   di sini (kas + jurnal otomatis). Hanya slip Disetujui/Dibayar yang tampil. */
export default function PayrollTab() {
  const { data, inBranch } = useStore();
  const { user } = useAuth();
  const { locale } = useT();
  const S = n_fin[locale];
  const canPay = canPayPayroll(user?.role);
  const [period, setPeriod] = useState(todayISO().slice(0, 7));
  const [payTarget, setPayTarget] = useState<StoreItem | null>(null);

  const all = useMemo(() => inBranch(data.payroll.filter((p) => p.period === period)), [data.payroll, period, inBranch]);
  const rows = useMemo(
    () => all.filter((p) => ["Disetujui", "Dibayar"].includes(String(p.status)))
      .sort((a, b) => String(a.status).localeCompare(String(b.status)) || String(a.employeeId).localeCompare(String(b.employeeId))),
    [all],
  );
  const nameOf = (id: string): string => String(data.employees.find((e) => e.id === id)?.name ?? id);
  const sum = (list: StoreItem[]): number => list.reduce((s, p) => s + (Number(p.net) || 0), 0);
  const waiting = rows.filter((p) => p.status === "Disetujui");
  const paid = rows.filter((p) => p.status === "Dibayar");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-steel-600">
          {S.payrollPeriod}
          <input type="month" className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => { void exportPphReport(all, nameOf, period); toast(S.payrollReportDone); }}>
            <Download className="h-4 w-4" /> {S.payrollPphReport}
          </button>
          <button className="btn-secondary" onClick={() => { void exportBpjsCompanyReport(all, nameOf, period); toast(S.payrollReportDone); }}>
            <Download className="h-4 w-4" /> {S.payrollBpjsReport}
          </button>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label={S.payrollToPay} value={fmtRupiah(sum(waiting))} hint={S.payrollSlips.replace("{n}", String(waiting.length))} chip="amber" />
        <KpiCard label={S.payrollPaid} value={fmtRupiah(sum(paid))} hint={S.payrollSlips.replace("{n}", String(paid.length))} chip="teal" />
      </div>
      {rows.length === 0 ? (
        <EmptyState title={S.payrollEmpty.replace("{a}", fmtBulan(period))} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="th">ID</th>
                <th className="th">{S.payrollEmployee}</th>
                <th className="th">{S.payrollType}</th>
                <th className="th text-right">{S.payrollNet}</th>
                <th className="th">Status</th>
                <th className="th">{S.payrollPaidAt}</th>
                <th className="th">{S.payrollAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-surface">
                  <td className="td font-mono text-steel-600">{p.id}</td>
                  <td className="td font-medium text-navy-900">{nameOf(String(p.employeeId))}</td>
                  <td className="td text-steel-600">{String(p.type ?? "Gaji")}</td>
                  <td className="td text-right font-bold text-navy-900">{fmtRupiah(Number(p.net || 0))}</td>
                  <td className="td"><StatusBadge status={String(p.status)} /></td>
                  <td className="td text-xs text-steel-600">{p.paidAt ? `${fmtTanggal(String(p.paidAt))} · ${String(p.paidRef ?? "")}` : "-"}</td>
                  <td className="td">
                    {p.status === "Disetujui" && canPay && (
                      <button className="text-sm font-semibold text-emerald-600 hover:underline" onClick={() => setPayTarget(p)}>{S.payrollPay}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PayrollPayModal target={payTarget} onClose={() => setPayTarget(null)} />
    </div>
  );
}
