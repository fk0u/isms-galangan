import { useMemo } from "react";
import type { HistFilter } from "../Finance";
import { useT } from "../../../i18n/LanguageContext";

export function fmtPeriodeLaporan(hist: HistFilter, asOf: string, locale: "id" | "en"): string {
  const BULAN_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const BULAN_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const mList = locale === "en" ? BULAN_EN : BULAN_ID;

  if (hist.mode === "Bulan" && hist.bulan) {
    const [y, m] = hist.bulan.split("-").map(Number);
    const mName = mList[(m || 1) - 1] ?? hist.bulan;
    return `${mName} ${y}`;
  }
  if (hist.mode === "Tahun" && hist.tahun) {
    return locale === "en" ? `Year ${hist.tahun}` : `Tahun ${hist.tahun}`;
  }
  if (hist.mode === "Hari" && hist.hari) {
    const [y, m, d] = hist.hari.split("-").map(Number);
    const mName = mList[(m || 1) - 1] ?? String(m);
    return `${d} ${mName}, ${y}`;
  }
  if (hist.mode === "Rentang" && hist.dari && hist.sampai) {
    return `${hist.dari} – ${hist.sampai}`;
  }
  if (asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    const [y, m, d] = asOf.split("-").map(Number);
    const mName = mList[(m || 1) - 1] ?? String(m);
    return `${locale === "en" ? "As of" : "Per"} ${d} ${mName}, ${y}`;
  }
  return "";
}

export function formatHeaderTimestamp(locale: "id" | "en", date = new Date()): { time: string; date: string } {
  const BULAN_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const BULAN_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const mList = locale === "en" ? BULAN_EN : BULAN_ID;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const d = date.getDate();
  const mName = mList[date.getMonth()];
  const y = date.getFullYear();
  return {
    time: `${hh}.${mm}`,
    date: `${d} ${mName}, ${y}`,
  };
}

export default function FinanceReportHeader({
  title,
  period,
  companyName = "PT OELANGAN KARYA ETAM",
  className = "",
}: {
  title: string;
  period: string;
  companyName?: string;
  className?: string;
}) {
  const { locale } = useT();
  const ts = useMemo(() => formatHeaderTimestamp(locale), [locale]);

  return (
    <div className={`relative rounded-xl border border-steel-200 bg-white p-5 shadow-xs ${className}`}>
      {/* Jam dan tanggal di pojok kiri atas sesuai referensi format */}
      <div className="text-xs font-semibold text-steel-500 sm:absolute sm:left-5 sm:top-5">
        <span className="font-mono">{ts.time}</span>
        <span className="mx-4 text-steel-300">·</span>
        <span>{ts.date}</span>
      </div>

      {/* Judul laporan formal di tengah sesuai referensi format */}
      <div className="text-center pt-2 sm:pt-0">
        <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase md:text-base">
          {companyName}
        </h2>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-sky-600 md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm font-bold text-red-900 md:text-base">
          {period}
        </p>
      </div>
    </div>
  );
}

