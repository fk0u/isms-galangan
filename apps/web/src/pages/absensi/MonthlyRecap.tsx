/* Rekap absensi bulanan (F3-L-07, ABS-02…06): karyawan × tanggal dengan filter
 * bulan & tahun. Tanpa shift; lembur otomatis = jam kerja − jam standar, dibatasi
 * per hari dan per minggu (utils/overtime.ts). */
import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { EmptyState, toast } from "../../components/ui";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { getSetting } from "../../utils/settings";
import { applyWeeklyCap, workedHours } from "../../utils/overtime";
import { exportExcel } from "../../utils/export";
import { todayISO } from "../../utils/format";

const LETTER: Record<string, string> = { Hadir: "H", Izin: "I", Sakit: "S", Cuti: "C", Alpa: "A" };
const TONE: Record<string, string> = { H: "bg-emerald-50 text-emerald-700", I: "bg-amber-50 text-amber-700", S: "bg-amber-50 text-amber-700", C: "bg-steel-100 text-navy-800", A: "bg-red-50 text-red-700" };

export default function MonthlyRecap() {
  const { locale } = useT();
  const T = n_emp[locale];
  const { data, inBranch } = useStore();
  /* Buka bulan terakhir yang punya data (bukan selalu bulan berjalan) supaya
     rekap tidak tampil kosong saat data bulan ini belum dicatat. */
  const latest = (data.attendance ?? []).reduce((m, a) => (String(a.date ?? "") > m ? String(a.date) : m), "");
  const start = /^\d{4}-\d{2}/.test(latest) ? latest : todayISO();
  const [month, setMonth] = useState(Number(start.slice(5, 7)));
  const [year, setYear] = useState(Number(start.slice(0, 4)));
  const rules = {
    workHours: getSetting(data, "WORK_HOURS", 8),
    maxDaily: getSetting(data, "OVERTIME_MAX_DAILY", 4),
    maxWeekly: getSetting(data, "OVERTIME_MAX_WEEKLY", 18),
  };
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  const days = new Date(year, month, 0).getDate();
  const dayList = Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);

  const rows = useMemo(() => {
    const emps = inBranch(data.employees ?? []).filter((e) => String(e.status ?? "Aktif") === "Aktif");
    const monthRecs = (data.attendance ?? []).filter((a) => String(a.date ?? "").startsWith(ym));
    return emps.map((e) => {
      const recs = monthRecs.filter((a) => String(a.employeeId) === String(e.id));
      // Satu sel per tanggal: data lama multi-shift digabung (jam dijumlah).
      const byDate = new Map<string, { status: string; hours: number }>();
      for (const a of recs) {
        const date = String(a.date);
        const hours = String(a.status) === "Hadir" ? workedHours(String(a.checkIn ?? ""), String(a.checkOut ?? "")) : 0;
        const prev = byDate.get(date);
        byDate.set(date, { status: prev?.status === "Hadir" ? "Hadir" : String(a.status ?? ""), hours: (prev?.hours ?? 0) + hours });
      }
      const ot = new Map(applyWeeklyCap([...byDate.entries()].map(([date, v]) => ({ date, hours: v.hours })), rules).map((d) => [d.date, d.overtime]));
      const present = [...byDate.values()].filter((v) => v.status === "Hadir").length;
      return {
        emp: e, byDate, ot, present, absent: byDate.size - present,
        hours: Math.round([...byDate.values()].reduce((s, v) => s + v.hours, 0) * 10) / 10,
        overtime: Math.round([...ot.values()].reduce((s, v) => s + v, 0) * 10) / 10,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.employees, data.attendance, ym, rules.workHours, rules.maxDaily, rules.maxWeekly, inBranch]);

  const hasData = rows.some((r) => r.byDate.size > 0);
  const exportRecap = () => {
    const head = [T.colEmp, ...dayList.map((d) => d.slice(8)), T.colPresent, T.colAbsent, T.colHours, T.colOt];
    const body = rows.map((r) => [String(r.emp.name), ...dayList.map((d) => LETTER[r.byDate.get(d)?.status ?? ""] ?? ""), r.present, r.absent, r.hours, r.overtime]);
    void exportExcel([head, ...body], `rekap-absensi-${ym}`, "Rekap").then(() => toast(T.exported));
  };
  const years = [year - 1, year, year + 1].filter((y, i, a) => a.indexOf(y) === i);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-steel-600">{T.month}
          <select className="input ml-2 h-8 w-auto py-0 text-xs" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString(locale === "en" ? "en-US" : "id-ID", { month: "long" })}</option>)}
          </select>
        </label>
        <label className="text-xs text-steel-600">{T.year}
          <select className="input ml-2 h-8 w-auto py-0 text-xs" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <button type="button" className="btn-secondary ml-auto text-xs" onClick={exportRecap}><FileDown className="h-3.5 w-3.5" /> {T.export}</button>
      </div>
      <p className="text-xs text-steel-500">{T.rules.replace("{w}", String(rules.workHours)).replace("{d}", String(rules.maxDaily)).replace("{k}", String(rules.maxWeekly))} · {T.legend}</p>
      {!hasData ? <EmptyState title={T.empty} /> : (
        <div className="overflow-x-auto rounded-xl border border-steel-200">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-surface">
                <th className="sticky left-0 z-10 min-w-40 bg-surface px-3 py-2 text-left font-medium text-steel-600">{T.colEmp}</th>
                {dayList.map((d) => <th key={d} className="w-8 px-0.5 py-2 text-center font-medium tabular-nums text-steel-500">{Number(d.slice(8))}</th>)}
                {[T.colPresent, T.colAbsent, T.colHours, T.colOt].map((h) => <th key={h} className="px-2 py-2 text-right font-medium text-steel-600">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {rows.map((r) => (
                <tr key={String(r.emp.id)}>
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-navy-900">{String(r.emp.name)}</td>
                  {dayList.map((d) => {
                    const cell = r.byDate.get(d);
                    const letter = cell ? LETTER[cell.status] ?? "?" : "";
                    const ot = r.ot.get(d) ?? 0;
                    return (
                      <td key={d} className="px-0.5 py-1 text-center">
                        {letter && <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-semibold ${TONE[letter] ?? "bg-steel-50 text-steel-600"}`} title={cell ? `${cell.status} · ${cell.hours} jam` : ""}>{letter}</span>}
                        {ot > 0 && <span className="block text-[9px] font-semibold leading-none text-ocean-700">+{ot}</span>}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.present}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.absent}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.hours}</td>
                  <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-ocean-700">{r.overtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
