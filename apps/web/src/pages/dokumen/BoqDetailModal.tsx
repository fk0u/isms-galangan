import { useMemo, useState } from "react";
import {
  Printer,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  Search,
} from "lucide-react";
import { Modal, Badge, StatusBadge, toast } from "../../components/ui";
import { type StoreItem } from "../../data/store";
import { fmtRupiah, fmtTanggal } from "../../utils/format";
import { terbilangRupiah, spelledOutCurrency } from "../../utils/terbilang";
import { printBoqHtml, type BoqPrintItem } from "../../utils/printBoqHtml";
import { exportExcel } from "../../utils/export";
import { useT } from "../../i18n/LanguageContext";

interface BoqDetailModalProps {
  open: boolean;
  onClose: () => void;
  doc: StoreItem | null;
  boqDoc: StoreItem | null;
  items: StoreItem[];
  project: StoreItem | null;
  allBoqDocs?: StoreItem[];
  onSelectDoc?: (doc: StoreItem) => void;
}

export function BoqDetailModal({
  open,
  onClose,
  doc,
  boqDoc,
  items,
  project,
  allBoqDocs = [],
  onSelectDoc,
}: BoqDetailModalProps) {
  const { locale } = useT();
  const isEn = locale === "en";
  const [itemQuery, setItemQuery] = useState("");

  const number = String(boqDoc?.number ?? doc?.title ?? "BQ/PRJ/001");
  const revision = Number(boqDoc?.revision ?? doc?.version?.replace(/\D/g, "") ?? 0);
  const status = String(boqDoc?.status ?? doc?.status ?? "Draft");
  const issuedAt = String(boqDoc?.issuedAt ?? doc?.updated ?? "");
  const projectId = String(boqDoc?.projectId ?? doc?.project ?? "-");
  const vesselName = String(project?.vessel ?? doc?.vessel ?? "-");
  const clientName = String(project?.client ?? "-");
  const approvedBy = boqDoc?.approvedBy ? String(boqDoc.approvedBy) : undefined;
  const approvedAt = boqDoc?.approvedAt ? String(boqDoc.approvedAt) : undefined;
  const note = String(boqDoc?.note ?? "");
  const assigner = String(boqDoc?.assigner || boqDoc?.createdBy || doc?.assigner || (doc?.type === "BoQ" ? doc?.owner : "") || "");

  // Hitung total dari items atau boqDoc
  const computedItems: BoqPrintItem[] = useMemo(() => {
    return items.map((it, idx) => {
      const qty = Number(it.quantity ?? 1);
      const unitPrice = Number(it.unitPrice ?? 0);
      const explicitTotal = Number(it.totalPrice);
      const totalPrice = Number.isFinite(explicitTotal) && it.totalPrice !== undefined && it.totalPrice !== null && explicitTotal > 0
        ? explicitTotal
        : qty * unitPrice;

      return {
        no: idx + 1,
        name: String(it.name ?? it.task ?? "Pekerjaan"),
        description: it.description ? String(it.description) : undefined,
        category: it.category ? String(it.category) : undefined,
        qty,
        unit: String(it.unit ?? "ls"),
        unitPrice,
        totalPrice,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!itemQuery.trim()) return computedItems;
    const q = itemQuery.toLowerCase();
    return computedItems.filter((it) =>
      it.name.toLowerCase().includes(q) ||
      (it.description && it.description.toLowerCase().includes(q)) ||
      (it.category && it.category.toLowerCase().includes(q))
    );
  }, [computedItems, itemQuery]);

  const totalAmount = useMemo(() => {
    if (computedItems.length > 0) {
      return computedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    }
    return Number(boqDoc?.total ?? 0);
  }, [computedItems, boqDoc?.total]);

  const terbilangText = useMemo(() => {
    return isEn ? spelledOutCurrency(totalAmount) : terbilangRupiah(totalAmount);
  }, [totalAmount, isEn]);

  // Riwayat revisi surat BoQ yang nomornya sama
  const revisionChain = useMemo(() => {
    if (!number || allBoqDocs.length === 0) return [];
    return allBoqDocs
      .filter((b) => String(b.number ?? "").trim().toLowerCase() === number.trim().toLowerCase())
      .sort((a, b) => Number(a.revision ?? 0) - Number(b.revision ?? 0));
  }, [allBoqDocs, number]);

  // Action: Print HTML Enterprise
  const handlePrint = () => {
    printBoqHtml({
      number,
      revision,
      status,
      issuedAt,
      projectId,
      vesselName,
      clientName,
      approvedBy,
      approvedAt,
      note,
      items: computedItems,
      total: totalAmount,
      signerName: approvedBy || "Commercial Estimator",
      locale,
    });
    toast(isEn ? "Opening Enterprise Print preview..." : "Membuka pratinjau cetak Enterprise...", "info");
  };

  // Action: Export Excel
  const handleExportExcel = async () => {
    try {
      const headerRow = [
        isEn ? "No" : "No",
        isEn ? "Work Item" : "Uraian Pekerjaan",
        isEn ? "Specification / Description" : "Spesifikasi / Deskripsi",
        isEn ? "Category" : "Kategori",
        isEn ? "Qty" : "Volume",
        isEn ? "Unit" : "Satuan",
        isEn ? "Unit Price (Rp)" : "Harga Satuan (Rp)",
        isEn ? "Total (Rp)" : "Jumlah Harga (Rp)",
      ];

      const dataRows = computedItems.map((it) => [
        it.no,
        it.name,
        it.description || "-",
        it.category || "-",
        it.qty,
        it.unit,
        it.unitPrice,
        it.totalPrice,
      ]);

      const totalRow = [
        "",
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        totalAmount,
      ];

      const rows: unknown[][] = [
        [`BILL OF QUANTITY (BoQ) - ${number} Rev ${revision}`],
        [
          `Proyek: ${projectId} | Kapal: ${vesselName} | Klien: ${clientName} | Status: ${status} | Tgl: ${fmtTanggal(issuedAt)}`,
        ],
        [],
        headerRow,
        ...dataRows,
        totalRow,
        [],
        [`Terbilang: ${terbilangText}`],
      ];

      const safeFilename = `BoQ-${number.replace(/[^a-zA-Z0-9-_]/g, "_")}-Rev${revision}`;
      await exportExcel(rows, safeFilename, "BoQ");
      toast(isEn ? `Excel exported: ${safeFilename}.xlsx` : `Excel berhasil diunduh: ${safeFilename}.xlsx`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengekspor Excel", "info");
    }
  };

  if (!doc && !boqDoc) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={`Bill of Quantity (BoQ) — ${number} Rev ${revision}`}
      subtitle={`${projectId} · ${vesselName} · ${clientName || (isEn ? "Client" : "Klien")}`}
    >
      <div className="space-y-5 text-sm">
        {/* Ringkasan & Toolbar Atas */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-steel-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary inline-flex items-center gap-1.5 text-xs shadow-sm"
              title={isEn ? "Print / Save PDF (Enterprise Layout)" : "Cetak / Simpan PDF (Layout Enterprise)"}
            >
              <Printer className="h-3.5 w-3.5" />
              {isEn ? "Print PDF (Enterprise)" : "Cetak PDF (Enterprise)"}
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn-secondary inline-flex items-center gap-1.5 text-xs"
              title={isEn ? "Download Excel Spreadsheet" : "Unduh File Excel"}
            >
              <Download className="h-3.5 w-3.5" />
              {isEn ? "Export Excel" : "Ekspor Excel"}
            </button>
            {projectId && projectId !== "-" && (
              <a
                href={`/proyek/${encodeURIComponent(projectId)}?tab=BoQ`}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs text-ocean-600 hover:text-ocean-700"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {isEn ? "Open in Project" : "Buka di Proyek"}
              </a>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-steel-500">{isEn ? "Total Commitment" : "Total Nilai BoQ"}:</span>
            <div className="text-xl font-extrabold text-navy-900 tabular-nums">
              {fmtRupiah(totalAmount)}
            </div>
          </div>
        </div>

        {/* Informasi Utama Dokumen (Grid) */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-steel-100 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-steel-500">{isEn ? "Project & Vessel" : "Proyek & Kapal"}</dt>
            <dd className="mt-0.5 font-semibold text-navy-900">{projectId} · {vesselName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-steel-500">{isEn ? "Client / Owner" : "Klien / Pemilik"}</dt>
            <dd className="mt-0.5 font-semibold text-navy-900">{clientName || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-steel-500">{isEn ? "Issue Date" : "Tanggal Terbit"}</dt>
            <dd className="mt-0.5 font-semibold text-navy-900">{fmtTanggal(issuedAt) || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-steel-500">{isEn ? "Approval Status" : "Persetujuan"}</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-semibold text-navy-900">
              {approvedBy ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{approvedBy} {approvedAt ? `(${fmtTanggal(approvedAt)})` : ""}</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{isEn ? "Pending Approval" : "Menunggu Persetujuan"}</span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-steel-500">{isEn ? "Assigner" : "Penugas"}</dt>
            <dd className="mt-0.5 font-semibold text-navy-900">
              {assigner ? assigner : <span className="font-normal text-steel-400">-</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-steel-500">{isEn ? "Items Count" : "Jumlah Pekerjaan"}</dt>
            <dd className="mt-0.5 font-semibold text-navy-900">{computedItems.length} {isEn ? "items" : "pekerjaan"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-steel-500">{isEn ? "Revision" : "Revisi"}</dt>
            <dd className="mt-0.5 font-semibold text-navy-900">Rev {revision} ({status})</dd>
          </div>
        </div>

        {/* Riwayat Revisi (bila ada lebih dari 1 revisi) */}
        {revisionChain.length > 1 && (
          <div className="rounded-xl border border-steel-100 bg-white p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-steel-600">
              <Layers className="h-3.5 w-3.5 text-steel-500" />
              {isEn ? "Revision History for this BoQ Number" : "Riwayat Revisi Surat BoQ Ini"}
            </p>
            <div className="flex flex-wrap gap-2">
              {revisionChain.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectDoc && onSelectDoc(r)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    r.id === boqDoc?.id
                      ? "border-navy-900 bg-navy-900 text-white font-medium"
                      : "border-steel-200 bg-surface text-steel-700 hover:border-steel-300"
                  }`}
                >
                  <span>Rev {r.revision}</span>
                  <span className={r.id === boqDoc?.id ? "text-steel-200" : "text-steel-400"}>· {r.status}</span>
                  <span className="font-semibold tabular-nums">{fmtRupiah(Number(r.total || 0))}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabel Pekerjaan BoQ */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              {isEn ? "Detailed Work Items & Specifications" : "Rincian Pekerjaan & Spesifikasi BoQ"} ({computedItems.length})
            </h4>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-steel-400" />
              <input
                type="text"
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                placeholder={isEn ? "Search work item or category..." : "Cari pekerjaan atau kategori..."}
                className="input py-1.5 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="max-h-[50vh] overflow-auto rounded-lg border border-steel-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-surface font-semibold text-navy-900 border-b border-steel-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">{isEn ? "Work Description" : "Uraian Pekerjaan"}</th>
                  <th className="py-2.5 px-3 w-28">{isEn ? "Category" : "Kategori"}</th>
                  <th className="py-2.5 px-3 w-16 text-right">{isEn ? "Qty" : "Volume"}</th>
                  <th className="py-2.5 px-3 w-16 text-center">{isEn ? "Unit" : "Satuan"}</th>
                  <th className="py-2.5 px-3 w-28 text-right">{isEn ? "Unit Price" : "Harga Satuan"}</th>
                  <th className="py-2.5 px-3 w-32 text-right">{isEn ? "Total Price" : "Jumlah Harga"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-steel-400">
                      {isEn ? "No matching BoQ items found." : "Tidak ada rincian pekerjaan BoQ yang cocok."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => (
                    <tr key={it.no} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-steel-400 font-mono">{it.no}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-navy-900">{it.name}</div>
                        {it.description && it.description !== it.name && (
                          <div className="text-[11px] text-steel-500 mt-0.5">{it.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {it.category ? (
                          <Badge tone="blue">{it.category}</Badge>
                        ) : (
                          <span className="text-steel-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium tabular-nums">{it.qty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center text-steel-600">{it.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-steel-700">{fmtRupiah(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-navy-900">{fmtRupiah(it.totalPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="border-t-2 border-steel-200 bg-surface font-bold text-navy-900">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right uppercase text-[11px] text-steel-600">
                    Grand Total
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-right font-mono text-sm text-navy-900">
                    {fmtRupiah(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terbilang Box */}
          <div className="mt-2.5 rounded-lg border border-steel-100 bg-slate-50 px-3.5 py-2 text-xs text-steel-700">
            <span className="font-semibold text-navy-800">{isEn ? "In Words" : "Terbilang"}: </span>
            <span className="italic">{terbilangText}</span>
          </div>

          {/* Catatan Pelaksanaan */}
          {note && (
            <div className="mt-3 rounded-lg border border-ocean-100 bg-ocean-50/50 p-3 text-xs text-ocean-950">
              <span className="font-semibold">{isEn ? "Notes & Conditions" : "Catatan & Ketentuan"}: </span>
              <span>{note}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
