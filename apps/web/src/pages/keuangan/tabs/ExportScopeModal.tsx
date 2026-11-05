/* Modal pilihan cakupan ekspor laporan keuangan (#315): Seluruh (sampai hari
 * ini), Tahunan (sampai 31 Des), Bulanan (sampai akhir bulan). Hasilnya dipetakan
 * ke filter periode halaman, sehingga file Excel = angka yang tampil di layar. */
import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui";
import { todayISO } from "../../../utils/format";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";
import type { HistFilter } from "../Finance";

export type ExportScope = { kind: "all" } | { kind: "year"; year: string } | { kind: "month"; month: string } | { kind: "range"; from: string; to: string };

/** Cakupan → filter periode halaman. Seluruh = mode Semua (as-of hari ini). */
export function scopeToHist(s: ExportScope): HistFilter {
  const base: HistFilter = { mode: "Semua", hari: "", bulan: "", tahun: "", dari: "", sampai: "" };
  if (s.kind === "year") return { ...base, mode: "Tahun", tahun: s.year };
  if (s.kind === "month") return { ...base, mode: "Bulan", bulan: s.month };
  if (s.kind === "range") return { ...base, mode: "Rentang", dari: s.from, sampai: s.to };
  return base;
}

/** Cakupan awal mengikuti filter yang sedang aktif di tab. */
export function scopeFromHist(f: HistFilter): ExportScope {
  if (f.mode === "Tahun" && /^\d{4}$/.test(f.tahun)) return { kind: "year", year: f.tahun };
  if (f.mode === "Bulan" && /^\d{4}-\d{2}$/.test(f.bulan)) return { kind: "month", month: f.bulan };
  if (f.mode === "Rentang" && f.dari && f.sampai) return { kind: "range", from: f.dari, to: f.sampai };
  return { kind: "all" };
}

export default function ExportScopeModal({ open, current, onClose, onConfirm }: {
  open: boolean; current: HistFilter; onClose: () => void; onConfirm: (s: ExportScope) => void;
}) {
  const { locale } = useT();
  const S = n_fin[locale];
  const today = todayISO();
  const [kind, setKind] = useState<ExportScope["kind"]>("all");
  const [year, setYear] = useState(today.slice(0, 4));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  useEffect(() => {
    if (!open) return;
    const s = scopeFromHist(current);
    setKind(s.kind);
    if (s.kind === "year") setYear(s.year);
    if (s.kind === "month") setMonth(s.month);
    if (s.kind === "range") { setFrom(s.from); setTo(s.to); }
  }, [open, current]);

  const valid = kind === "all"
    || (kind === "year" && /^\d{4}$/.test(year))
    || (kind === "month" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    || (kind === "range" && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to);
  const confirm = () => onConfirm(
    kind === "year" ? { kind, year } : kind === "month" ? { kind, month } : kind === "range" ? { kind, from, to } : { kind },
  );
  const opts: Array<{ id: ExportScope["kind"]; label: string; hint: string }> = [
    { id: "all", label: S.expAll, hint: S.expAllHint.replace("{d}", today) },
    { id: "year", label: S.expYear, hint: S.expYearHint },
    { id: "month", label: S.expMonth, hint: S.expMonthHint },
    { id: "range", label: S.expRange, hint: S.expRangeHint },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={S.expTitle}
      subtitle={S.expSub}
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>{S.cancelBtn}</button><button type="button" className="btn-primary" disabled={!valid} onClick={confirm}>{S.expRun}</button></>}
    >
      <div className="space-y-2">
        {opts.map((o) => (
          <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${kind === o.id ? "border-navy-600 bg-surface" : "border-steel-200"}`}>
            <input type="radio" name="export-scope" className="mt-1" checked={kind === o.id} onChange={() => setKind(o.id)} />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-navy-900">{o.label}</span>
              <span className="block text-xs text-steel-500">{o.hint}</span>
              {o.id === "year" && kind === "year" && <input type="number" className="input mt-2 w-32" min={2000} max={2100} value={year} onChange={(e) => setYear(e.target.value)} aria-label={S.histYearAria} />}
              {o.id === "month" && kind === "month" && <input type="month" className="input mt-2 w-auto" value={month} onChange={(e) => setMonth(e.target.value)} aria-label={S.histMonthAria} />}
              {o.id === "range" && kind === "range" && (
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="date" className="input w-auto" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label={S.histFrom} />
                  <span aria-hidden className="text-xs text-steel-400">–</span>
                  <input type="date" className="input w-auto" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label={S.histTo} />
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-steel-400">{S.expNote}</p>
    </Modal>
  );
}
