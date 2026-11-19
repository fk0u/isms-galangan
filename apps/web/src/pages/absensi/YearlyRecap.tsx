/* Rekap absensi tahunan (permintaan 19 Nov, section 1 tab Rekap): karyawan ×
 * 12 bulan, isi = jumlah hari Hadir; kolom akhir = total hadir dan
 * izin/sakit/cuti/alpa setahun. Dihitung dari koleksi attendance di klien. */
import { useMemo, useState } from "react";
import { EmptyState } from "../../components/ui";
import { Select } from "../../components/inputs/Select";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { todayISO } from "../../utils/format";

export default function YearlyRecap() {
  const { locale } = useT();
  const T = n_emp[locale];
  const { data, inBranch } = useStore();
  const [year, setYear] = useState(Number(todayISO().slice(0, 4)));
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleString(locale === "id" ? "id-ID" : "en-US", { month: "short" })), [locale]);
  // Tahun yang punya data + tahun berjalan, terbaru di atas.
  const years = useMemo(() => {
    const set = new Set<number>([Number(todayISO().slice(0, 4))]);
    for (const a of data.attendance ?? []) { const y = Number(String(a.date ?? "").slice(0, 4)); if (y > 2000) set.add(y); }
    return [...set].sort((a, b) => b - a);
  }, [data.attendance]);

  const rows = useMemo(() => {
    const emps = inBranch(data.employees ?? []).filter((e) => String(e.status ?? "Aktif") === "Aktif");
    const prefix = `${year}-`;
    const recs = (data.attendance ?? []).filter((a) => String(a.date ?? "").startsWith(prefix));
    return emps.map((e) => {
      const mine = recs.filter((a) => String(a.employeeId) === String(e.id));
      const perMonth = Array.from({ length: 12 }, (_, m) => mine.filter((a) => a.status === "Hadir" && Number(String(a.date).slice(5, 7)) === m + 1).length);
      const count = (st: string): number => mine.filter((a) => a.status === st).length;
      return { id: String(e.id), name: String(e.name ?? e.id), perMonth, hadir: count("Hadir"), other: [count("Izin"), count("Sakit"), count("Cuti"), count("Alpa")], any: mine.length > 0 };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.employees, data.attendance, inBranch, year]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <p className="text-xs text-steel-500">{T.yrSub}</p>
        <Select className="input w-28" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} aria-label={T.year}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>
      {rows.some((r) => r.any) ? (
        <div className="overflow-x-auto rounded-xl border border-steel-200">
          <table className="w-full min-w-[820px] text-sm">
            <caption className="sr-only">{T.secYear} {year}</caption>
            <thead className="bg-surface text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">{T.yrEmp}</th>
                {months.map((m) => <th key={m} scope="col" className="px-2 py-2 text-center">{m}</th>)}
                <th scope="col" className="px-3 py-2 text-center">{T.yrHadir}</th>
                <th scope="col" className="px-3 py-2 text-center">{T.yrOther}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-navy-900">{r.name}</td>
                  {r.perMonth.map((n, i) => <td key={i} className={`px-2 py-2 text-center tabular-nums ${n ? "text-navy-900" : "text-steel-300"}`}>{n || "-"}</td>)}
                  <td className="px-3 py-2 text-center font-semibold tabular-nums text-emerald-700">{r.hadir}</td>
                  <td className="px-3 py-2 text-center tabular-nums text-steel-600">{r.other.join(" / ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title={T.yrEmpty} />}
    </div>
  );
}
