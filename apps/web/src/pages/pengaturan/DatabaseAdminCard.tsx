import { useState, useEffect, useRef } from "react";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, Modal, toast } from "../../components/ui";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_roles } from "../../i18n/n_roles";
import { apiFetch, getJwt, isBackendConfigured } from "../../services/http";
import { exportExcelSheets, type ExcelSheet } from "../../utils/export";
import { fmtTanggal } from "../../utils/format";

interface BackupItem {
  id: string;
  timestamp: string;
  dialect: string;
  tablesCount: number;
  dbFile: string;
  sizeBytes: number;
  uploadsBackedUp: boolean;
  createdAt: string;
}

interface BackupsResponse {
  backups: BackupItem[];
  retentionLimit: number;
  schedule: string;
}

export default function DatabaseAdminCard({ canWrite }: { canWrite: boolean }) {
  const { locale } = useT();
  const S = n_roles[locale];
  const { data, resync } = useStore();

  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exportingType, setExportingType] = useState<"xlsx" | "csv" | "sql" | null>(null);

  // Modal konfirmasi restore
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // File upload restore
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchBackups = async () => {
    if (!isBackendConfigured()) return;
    setLoading(true);
    try {
      const res = await apiFetch<BackupsResponse>("/api/admin/backups");
      setBackups(res.backups ?? []);
    } catch (err) {
      console.warn("Gagal mengambil daftar cadangan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBackups();
  }, []);

  const handleBackupNow = async () => {
    if (!canWrite) return;
    setBackingUp(true);
    try {
      await apiFetch<{ message: string; backup: unknown }>("/api/admin/backup", {
        method: "POST",
      });
      toast(S.backupSuccess);
      await fetchBackups();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal membuat cadangan", "info");
    } finally {
      setBackingUp(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup || !canWrite) return;
    setRestoring(true);
    try {
      await apiFetch("/api/admin/restore", {
        method: "POST",
        body: JSON.stringify({ backupId: selectedBackup.id }),
      });
      toast(S.restoreSuccess);
      setConfirmModalOpen(false);
      setSelectedBackup(null);
      await resync().catch(() => undefined);
      await fetchBackups();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memulihkan database", "info");
    } finally {
      setRestoring(false);
    }
  };

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadModalOpen(true);
    }
  };

  const handleConfirmUploadRestore = async () => {
    if (!uploadedFile || !canWrite) return;
    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      const token = getJwt();
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/restore/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok || json.ok === false) {
        throw new Error(json.error?.message || "Gagal memulihkan dari berkas");
      }
      toast(S.restoreSuccess);
      setUploadModalOpen(false);
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await resync().catch(() => undefined);
      await fetchBackups();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memulihkan dari berkas", "info");
    } finally {
      setRestoring(false);
    }
  };

  // 1. Ekspor Excel (.xlsx) Multi-Sheet Lengkap
  const handleExportXlsx = async () => {
    setExportingType("xlsx");
    try {
      const sheets: ExcelSheet[] = [];
      const dateStr = new Date().toISOString().slice(0, 10);

      // Ringkasan sheet
      const summaryRows: unknown[][] = [
        ["Modul / Koleksi", "Jumlah Data", "Keterangan"],
      ];

      // Kumpulkan setiap koleksi yang ada di store
      const storeData = data as unknown as Record<string, unknown[]>;
      const collections = Object.keys(storeData).sort();

      for (const col of collections) {
        const items = storeData[col] || [];
        summaryRows.push([col, items.length, `${items.length} rekaman data sistem`]);

        if (items.length === 0) continue;

        // Ambil header kolom dari keys objek
        const colKeysSet = new Set<string>();
        items.forEach((item) => {
          if (item && typeof item === "object") {
            Object.keys(item).forEach((k) => {
              if (typeof (item as Record<string, unknown>)[k] !== "function") {
                colKeysSet.add(k);
              }
            });
          }
        });

        const colKeys = Array.from(colKeysSet);
        const headers = ["ID", ...colKeys.filter((k) => k !== "id")];
        const rows: unknown[][] = [headers];

        items.forEach((item) => {
          if (!item || typeof item !== "object") return;
          const rec = item as Record<string, unknown>;
          const rowVals = [
            rec.id ?? "",
            ...colKeys
              .filter((k) => k !== "id")
              .map((k) => {
                const val = rec[k];
                if (val === null || val === undefined) return "";
                if (typeof val === "object") return JSON.stringify(val);
                return val;
              }),
          ];
          rows.push(rowVals);
        });

        // Nama sheet maks 31 karakter
        const sheetName = col.charAt(0).toUpperCase() + col.slice(1);
        sheets.push({
          name: sheetName.slice(0, 31),
          rows,
        });
      }

      // Masukkan summary di awal
      sheets.unshift({ name: "Ringkasan Data", rows: summaryRows });

      await exportExcelSheets(sheets, `isms-seluruh-data-${dateStr}`);
      toast("Ekspor Excel seluruh data berhasil diunduh!");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengekspor Excel", "info");
    } finally {
      setExportingType(null);
    }
  };

  // 2. Ekspor CSV (.zip) dari API
  const handleExportCsv = async () => {
    setExportingType("csv");
    try {
      const token = getJwt();
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/export/csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Gagal mengunduh CSV (Status: ${res.status})`);
      }
      const blob = await res.blob();
      const dateStr = new Date().toISOString().slice(0, 10);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `isms-all-collections-csv-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast("Arsip CSV seluruh data berhasil diunduh!");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengekspor CSV", "info");
    } finally {
      setExportingType(null);
    }
  };

  // 3. Ekspor SQL (.sql) dari API
  const handleExportSql = async () => {
    setExportingType("sql");
    try {
      const token = getJwt();
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/export/sql`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Gagal mengunduh SQL (Status: ${res.status})`);
      }
      const blob = await res.blob();
      const dateStr = new Date().toISOString().slice(0, 10);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `isms-database-dump-${dateStr}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast("Dump SQL database berhasil diunduh!");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengekspor SQL", "info");
    } finally {
      setExportingType(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    const k = 1024;
    const dm = 2;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* CARD 1: SISTEMATIS AUTO-BACKUP & RESTORE */}
      <Card className="p-5 border-steel-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-steel-100">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-ocean-600" />
              <h3 className="text-base font-bold text-navy-900">{S.backupTitle}</h3>
            </div>
            <p className="text-xs text-steel-500 mt-1">{S.backupSub}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
              onClick={() => void fetchBackups()}
              disabled={loading}
              title="Segarkan daftar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Segarkan
            </button>
            <button
              type="button"
              className="btn-primary text-xs inline-flex items-center gap-1.5"
              onClick={() => void handleBackupNow()}
              disabled={!canWrite || backingUp}
            >
              {backingUp ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {S.btnBackingUp}
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  {S.btnBackupNow}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Kebijakan & Jadwal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-sky-900">{S.autoBackupSchedule}</p>
              <p className="text-[11px] text-sky-700 mt-0.5 leading-relaxed">
                Server menjalankan snapshot basis data otomatis setiap pergantian hari pukul 00:00 tengah malam.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{S.retentionNote}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                Sistem otomatis mempertahankan 2 arsip database terkini (latest 2 DB) dan memangkas cadangan kadaluarsa guna menghemat ruang penyimpanan.
              </p>
            </div>
          </div>
        </div>

        {/* Daftar Cadangan Tersimpan (Latest 2 DB) */}
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-steel-500 mb-2">
            {S.availableBackups}
          </h4>
          {backups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-steel-200 p-6 text-center text-xs text-steel-400">
              {loading ? "Memuat riwayat cadangan…" : S.noBackups}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-steel-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-steel-50 text-navy-800 font-semibold border-b border-steel-200">
                  <tr>
                    <th className="py-2.5 px-3">{S.colBackupTime}</th>
                    <th className="py-2.5 px-3">{S.colDialect}</th>
                    <th className="py-2.5 px-3">{S.colSize}</th>
                    <th className="py-2.5 px-3">{S.colTables}</th>
                    <th className="py-2.5 px-3 text-right">{S.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100 bg-surface">
                  {backups.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-steel-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-navy-900">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{fmtTanggal(b.timestamp)}</span>
                          <span className="text-[11px] text-steel-400">
                            ({new Date(b.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                          </span>
                          {idx === 0 && (
                            <span className="ml-1.5 rounded bg-ocean-100 px-1.5 py-0.5 text-[10px] font-bold text-ocean-700">
                              Terbaru #1
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="ml-1.5 rounded bg-steel-200 px-1.5 py-0.5 text-[10px] font-bold text-steel-700">
                              Cadangan #2
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="uppercase text-[11px] font-semibold text-steel-600">
                          {b.dialect}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-steel-700">{formatBytes(b.sizeBytes)}</td>
                      <td className="py-2.5 px-3 text-steel-600">{b.tablesCount} tabel</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          className="btn-secondary text-[11px] py-1 px-2.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                          disabled={!canWrite || restoring}
                          onClick={() => {
                            setSelectedBackup(b);
                            setConfirmModalOpen(true);
                          }}
                        >
                          {S.btnRestore}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Unggah File SQLite untuk Restore */}
        <div className="mt-5 pt-4 border-t border-steel-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-navy-900">{S.uploadRestoreTitle}</h4>
            <p className="text-[11px] text-steel-500">
              Unggah file snapshot (.db) dari lingkungan lain atau arsip manual untuk memulihkan keadaan basis data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite"
              className="hidden"
              onChange={handleUploadFileChange}
            />
            <button
              type="button"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
              disabled={!canWrite || restoring}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              {S.btnUploadRestore}
            </button>
          </div>
        </div>
      </Card>

      {/* CARD 2: EKSPOR SELURUH DATA (SUPERADMIN) */}
      <Card className="p-5 border-steel-200">
        <div className="pb-4 border-b border-steel-100">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-ocean-600" />
            <h3 className="text-base font-bold text-navy-900">{S.exportTitle}</h3>
          </div>
          <p className="text-xs text-steel-500 mt-1">{S.exportSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Opsi 1: Excel (.xlsx) */}
          <div className="rounded-xl border border-steel-200 bg-surface p-4 flex flex-col justify-between hover:border-emerald-300 hover:shadow-sm transition-all">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy-900">Format Excel (.xlsx)</h4>
              <p className="text-xs text-steel-500 mt-1 leading-relaxed">
                Buku kerja multi-sheet lengkap berisi seluruh tabel transaksi, master data, dan operasional dengan format rapi dan formula-safe.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-steel-100">
              <button
                type="button"
                className="btn-primary w-full text-xs inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => void handleExportXlsx()}
                disabled={exportingType !== null}
              >
                {exportingType === "xlsx" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {S.exportingXlsx}
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    {S.btnExportXlsx}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Opsi 2: CSV (.zip) */}
          <div className="rounded-xl border border-steel-200 bg-surface p-4 flex flex-col justify-between hover:border-sky-300 hover:shadow-sm transition-all">
            <div>
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy-900">Format CSV (.zip)</h4>
              <p className="text-xs text-steel-500 mt-1 leading-relaxed">
                Arsip ZIP berisi berkas-berkas .csv terpisah per modul lengkap dengan ringkasan & skema, siap diolah di Python / Pandas / BI tools.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-steel-100">
              <button
                type="button"
                className="btn-primary w-full text-xs inline-flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                onClick={() => void handleExportCsv()}
                disabled={exportingType !== null}
              >
                {exportingType === "csv" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {S.exportingCsv}
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    {S.btnExportCsv}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Opsi 3: SQL Dump (.sql) */}
          <div className="rounded-xl border border-steel-200 bg-surface p-4 flex flex-col justify-between hover:border-violet-300 hover:shadow-sm transition-all">
            <div>
              <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy-900">Format SQL Dump (.sql)</h4>
              <p className="text-xs text-steel-500 mt-1 leading-relaxed">
                Script SQL lengkap berisi DDL (CREATE TABLE) dan data (INSERT OR REPLACE) untuk seluruh koleksi & users untuk migrasi server.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-steel-100">
              <button
                type="button"
                className="btn-primary w-full text-xs inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => void handleExportSql()}
                disabled={exportingType !== null}
              >
                {exportingType === "sql" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {S.exportingSql}
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    {S.btnExportSql}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* MODAL KONFIRMASI RESTORE CADANGAN */}
      {confirmModalOpen && selectedBackup && (
        <Modal
          open={confirmModalOpen}
          onClose={() => {
            if (!restoring) setConfirmModalOpen(false);
          }}
          title={S.restoreConfirmTitle}
        >
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold">Peringatan Tindakan Kritis</p>
                <p className="mt-1">
                  {S.restoreConfirmMsg.replace(
                    "{t}",
                    `${fmtTanggal(selectedBackup.timestamp)} (${selectedBackup.dialect.toUpperCase()})`,
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-steel-50 p-3 text-xs text-steel-600 space-y-1 font-mono">
              <div>Cadangan: <span className="font-bold text-navy-900">{selectedBackup.id}</span></div>
              <div>Ukuran: <span className="text-navy-900">{formatBytes(selectedBackup.sizeBytes)}</span></div>
              <div>Tabel: <span className="text-navy-900">{selectedBackup.tablesCount} tabel</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-steel-100">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={restoring}
                onClick={() => setConfirmModalOpen(false)}
              >
                {S.btnCancel}
              </button>
              <button
                type="button"
                className="btn-primary text-xs bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
                disabled={restoring}
                onClick={() => void handleConfirmRestore()}
              >
                {restoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {S.restoring}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    {S.btnConfirmRestore}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL KONFIRMASI UPLOAD RESTORE */}
      {uploadModalOpen && uploadedFile && (
        <Modal
          open={uploadModalOpen}
          onClose={() => {
            if (!restoring) {
              setUploadModalOpen(false);
              setUploadedFile(null);
            }
          }}
          title="Konfirmasi Pulihkan dari File Unggahan"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold">Perhatian: Penimpaan Basis Data</p>
                <p className="mt-1">
                  Basis data aktif akan sepenuhnya digantikan oleh isi file yang diunggah. Pastikan file berasal dari sumber terpercaya.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-steel-50 p-3 text-xs text-steel-600 space-y-1 font-mono">
              <div>Nama Berkas: <span className="font-bold text-navy-900">{uploadedFile.name}</span></div>
              <div>Ukuran Berkas: <span className="text-navy-900">{formatBytes(uploadedFile.size)}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-steel-100">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={restoring}
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                {S.btnCancel}
              </button>
              <button
                type="button"
                className="btn-primary text-xs bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
                disabled={restoring}
                onClick={() => void handleConfirmUploadRestore()}
              >
                {restoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {S.restoring}
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Pulihkan File Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

