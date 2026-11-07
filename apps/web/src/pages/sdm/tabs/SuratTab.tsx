import { Card } from "../../../components/ui";
import type { StoreItem } from "../../../data/store";
import { fmtTanggal } from "../../../utils/format";
import { n_qc } from "../../../i18n/n_qc";
import { useT } from "../../../i18n/LanguageContext";

/* #311: tab "Surat & Impor" dipisah dari HR.tsx. Semua aksi lewat callback
   supaya state modal surat tetap dimiliki HR (satu sumber). */
export default function SuratTab({ arsipSurat, importReport, onExport, onNew, onPreview, onEdit, onDelete, onTemplate, onImport }: {
  arsipSurat: StoreItem[];
  importReport: { ok: number; gagal: string[] } | null;
  onExport: () => void;
  onNew: () => void;
  onPreview: (s: StoreItem) => void;
  onEdit: (s: StoreItem) => void;
  onDelete: (s: StoreItem) => void;
  onTemplate: () => void;
  onImport: (f: File) => void;
}) {
  const { locale } = useT();
  const S = n_qc[locale];
  return (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-900">{S.arsipT}</h3>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary text-xs" onClick={onExport}>{S.btnExport}</button>
                  <button className="btn-primary text-xs" onClick={onNew}>{S.btnBuatSurat}</button>
                </div>
              </div>
              <p className="mt-1 text-xs text-steel-500">
                {locale === "en"
                  ? `${arsipSurat.length} letter(s) in the shared archive. Each row can be previewed, edited and deleted.`
                  : `${arsipSurat.length} surat di arsip bersama. Setiap baris bisa dipratinjau, diubah, dan dihapus.`}
              </p>
              <div className="mt-3 space-y-2.5">
                {arsipSurat.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-2 rounded-lg bg-surface p-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-900">{s.jenis} · {s.nama}</p>
                      <p className="font-mono text-xs text-steel-500">{s.docNo ? `${String(s.docNo)} (${s.id})` : s.id} · {fmtTanggal(String(s.tanggal))}</p>
                      <p className="text-[11px] text-steel-400">
                        {s.fileUrl
                          ? (locale === "en" ? "scan attached" : "pindai terlampir")
                          : (locale === "en" ? "no scan - text only" : "tanpa pindai - teks saja")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button className="text-xs font-semibold text-ocean-600 underline" onClick={() => onPreview(s)}>
                        {locale === "en" ? "Preview" : "Pratinjau"}
                      </button>
                      <button
                        className="text-xs font-semibold text-navy-700 underline"
                        onClick={() => onEdit(s)}
                        title={locale === "en" ? "Edit this letter" : "Ubah surat ini"}
                      >
                        {S.btnEdit}
                      </button>
                      <button className="text-xs font-semibold text-rose-600 underline" onClick={() => onDelete(s)}>
                        {S.btnHapus}
                      </button>
                    </div>
                  </div>
                ))}
                {arsipSurat.length === 0 && <p className="text-xs text-steel-400">{S.emptyArsip}</p>}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-navy-900">{S.imporT}</h3>
              <p className="mt-1 text-xs text-steel-500">
                {S.imporDesc}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className="btn-secondary text-xs" onClick={onTemplate}>{S.btnTemplate}</button>
                <label className="btn-primary cursor-pointer text-xs">
                  {S.btnImpor}
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onImport(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {importReport && (
                <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
                  <p className="font-semibold text-navy-900">{S.imporHasil.replace("{a}", String(importReport.ok)).replace("{b}", String(importReport.gagal.length))}</p>
                  {importReport.gagal.length > 0 && (
                    <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto text-xs text-rose-600">
                      {importReport.gagal.map((g) => <li key={g}>{g}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          </div>
  );
}
