/* Pratinjau impor Excel/CSV sebelum data benar-benar disimpan (revisi 18 Okt).
   Pemanggil mem-parse berkas menjadi baris + status per baris; modal ini hanya
   menampilkan dan meminta konfirmasi, sehingga aturan validasi tetap milik
   fitur masing-masing (ruang lingkup, BoQ, ...). */
import { useState } from "react";
import { Modal } from "./ui";
import { useT } from "../i18n/LanguageContext";
import { n_misc } from "../i18n/n_misc";

export interface ImportPreviewRow {
  /** Nomor baris di berkas (1-based, termasuk judul) - untuk dicocokkan pengguna. */
  line: number;
  cells: string[];
  /** Alasan baris tidak diimpor; kosong = siap diimpor. */
  error?: string;
}

interface Props {
  open: boolean;
  title: string;
  fileName: string;
  columns: string[];
  rows: ImportPreviewRow[];
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function ImportPreviewModal({ open, title, fileName, columns, rows, onCancel, onConfirm }: Props) {
  const { locale } = useT();
  const S = n_misc[locale];
  const [busy, setBusy] = useState(false);
  const ok = rows.filter((r) => !r.error).length;
  const bad = rows.length - ok;
  const confirm = async (): Promise<void> => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={busy ? () => undefined : onCancel} title={title}
      subtitle={S.impPrevSub.replace("{f}", fileName).replace("{n}", String(rows.length))} wide
      footer={<>
        <button className="btn-secondary" disabled={busy} onClick={onCancel}>{S.impPrevCancel}</button>
        <button className="btn-primary" disabled={busy || ok === 0} onClick={() => void confirm()}>
          {S.impPrevConfirm.replace("{n}", String(ok))}
        </button>
      </>}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{S.impPrevOk.replace("{n}", String(ok))}</span>
          {bad > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{S.impPrevBad.replace("{n}", String(bad))}</span>}
        </div>
        <div className="max-h-[55vh] overflow-auto rounded-xl border border-steel-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th className="th w-14">{S.impPrevLine}</th>
                {columns.map((c) => <th key={c} className="th">{c}</th>)}
                <th className="th">{S.impPrevStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {rows.map((r) => (
                <tr key={r.line} className={r.error ? "bg-amber-50/60" : ""}>
                  <td className="td font-mono text-xs text-steel-500">{r.line}</td>
                  {columns.map((c, i) => <td key={c} className="td text-xs">{r.cells[i] || <span className="text-steel-300">-</span>}</td>)}
                  <td className="td text-xs">
                    {r.error ? <span className="font-medium text-amber-700">{r.error}</span> : <span className="font-medium text-emerald-700">{S.impPrevReady}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
