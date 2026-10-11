import { fmtRupiah, fmtTanggal } from "./format";
import { terbilangRupiah, spelledOutCurrency } from "./terbilang";

export interface BoqPrintItem {
  no: number;
  name: string;
  description?: string;
  category?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface BoqPrintData {
  number: string;
  revision: number;
  status: string;
  issuedAt: string;
  projectId: string;
  vesselName: string;
  clientName: string;
  approvedBy?: string;
  approvedAt?: string;
  note?: string;
  items: BoqPrintItem[];
  total: number;
  signerName?: string;
  locale?: "id" | "en";
}

export function generateBoqHtml(data: BoqPrintData): string {
  const isEn = data.locale === "en";
  const terbilang = isEn ? spelledOutCurrency(data.total) : terbilangRupiah(data.total);

  const rowsHtml = data.items.map((item) => {
    const desc = item.description && item.description !== item.name
      ? `<div style="font-size: 8pt; color: #555; margin-top: 2px;">${escapeHtml(item.description)}</div>`
      : "";
    const cat = item.category
      ? `<span style="display: inline-block; font-size: 7.5pt; font-weight: 600; padding: 1px 5px; border-radius: 3px; background: #f0f4f8; color: #1e3a5f; margin-right: 4px;">${escapeHtml(item.category)}</span>`
      : "";

    return `
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 6px 4px; border: 1px solid #d1d5db; font-size: 9pt;">${item.no}</td>
        <td style="text-align: left; vertical-align: top; padding: 6px 8px; border: 1px solid #d1d5db; font-size: 9pt;">
          ${cat}<strong>${escapeHtml(item.name)}</strong>
          ${desc}
        </td>
        <td style="text-align: right; vertical-align: top; padding: 6px 6px; border: 1px solid #d1d5db; font-size: 9pt; white-space: nowrap;">${item.qty.toLocaleString()}</td>
        <td style="text-align: center; vertical-align: top; padding: 6px 6px; border: 1px solid #d1d5db; font-size: 9pt;">${escapeHtml(item.unit || "-")}</td>
        <td style="text-align: right; vertical-align: top; padding: 6px 8px; border: 1px solid #d1d5db; font-size: 9pt; white-space: nowrap;">${fmtRupiah(item.unitPrice)}</td>
        <td style="text-align: right; vertical-align: top; padding: 6px 8px; border: 1px solid #d1d5db; font-size: 9pt; font-weight: 600; white-space: nowrap;">${fmtRupiah(item.totalPrice)}</td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="${isEn ? "en" : "id"}">
<head>
  <meta charset="utf-8" />
  <title>BoQ - ${escapeHtml(data.number)} Rev ${data.revision}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2.5px double #0f172a;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-title {
      font-size: 15pt;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }
    .company-sub {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.35;
      margin: 0;
    }
    .doc-badge {
      text-align: right;
    }
    .badge-iso {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      padding: 2px 7px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .doc-main-title {
      text-align: center;
      margin: 8px 0 12px 0;
    }
    .doc-main-title h1 {
      font-size: 14pt;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #0f172a;
      margin: 0;
      text-transform: uppercase;
    }
    .doc-main-title p {
      font-size: 9pt;
      color: #64748b;
      margin: 3px 0 0 0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      font-size: 8.5pt;
    }
    .meta-row {
      display: flex;
      margin-bottom: 3px;
    }
    .meta-label {
      width: 110px;
      color: #64748b;
      font-weight: 500;
      flex-shrink: 0;
    }
    .meta-val {
      color: #0f172a;
      font-weight: 600;
      word-break: break-word;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.data-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      font-size: 8.5pt;
      padding: 7px 6px;
      border: 1px solid #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .total-box {
      background: #f8fafc;
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
    }
    .terbilang-box {
      margin-top: 4px;
      font-size: 8pt;
      font-style: italic;
      color: #475569;
      border-top: 1px dashed #cbd5e1;
      padding-top: 4px;
    }
    .notes-box {
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0284c7;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 18px;
      font-size: 8pt;
      color: #334155;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .sig-card {
      text-align: center;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 8px;
      background: #ffffff;
    }
    .sig-role {
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 45px;
    }
    .sig-name {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      border-top: 1px solid #0f172a;
      padding-top: 4px;
      display: inline-block;
      min-width: 140px;
    }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 class="company-title">PT GALANGAN KAPAL SAMUDRA RAYA</h2>
      <p class="company-sub">
        Shipyard &amp; Marine Engineering Services · Dok &amp; Perkapalan<br />
        Jl. Pelabuhan Galangan No. 88, Samarinda, Kalimantan Timur · Telp: (0541) 741234<br />
        Email: commercial@galangan.com · Website: www.galangan-samudraraya.com
      </p>
    </div>
    <div class="doc-badge">
      <span class="badge-iso">ISO 9001:2015 CERTIFIED</span><br />
      <span style="font-size: 7.5pt; color: #64748b; font-family: monospace;">DOC REF: ${escapeHtml(data.number)}</span>
    </div>
  </div>

  <div class="doc-main-title">
    <h1>BILL OF QUANTITY (BoQ)</h1>
    <p>Surat No: <strong>${escapeHtml(data.number)}</strong> &nbsp;|&nbsp; Revisi: <strong>Rev ${data.revision}</strong> &nbsp;|&nbsp; Tanggal: <strong>${fmtTanggal(data.issuedAt)}</strong></p>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-row"><span class="meta-label">${isEn ? "Project Code" : "Kode Proyek"}:</span><span class="meta-val">${escapeHtml(data.projectId)}</span></div>
      <div class="meta-row"><span class="meta-label">${isEn ? "Vessel Name" : "Nama Kapal"}:</span><span class="meta-val">${escapeHtml(data.vesselName || "-")}</span></div>
      <div class="meta-row"><span class="meta-label">${isEn ? "Client / Owner" : "Klien / Pemilik"}:</span><span class="meta-val">${escapeHtml(data.clientName || "-")}</span></div>
    </div>
    <div>
      <div class="meta-row"><span class="meta-label">${isEn ? "Document Status" : "Status Surat"}:</span><span class="meta-val" style="color: ${data.status === "Disetujui" ? "#059669" : "#d97706"};">${escapeHtml(data.status)}</span></div>
      ${data.approvedBy ? `<div class="meta-row"><span class="meta-label">${isEn ? "Approved By" : "Disetujui Oleh"}:</span><span class="meta-val">${escapeHtml(data.approvedBy)}</span></div>` : ""}
      ${data.approvedAt ? `<div class="meta-row"><span class="meta-label">${isEn ? "Approved Date" : "Tgl Disetujui"}:</span><span class="meta-val">${fmtTanggal(data.approvedAt)}</span></div>` : ""}
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 32px;">No</th>
        <th>${isEn ? "Work Item & Specification" : "Uraian Pekerjaan & Spesifikasi"}</th>
        <th style="width: 60px;">${isEn ? "Qty" : "Volume"}</th>
        <th style="width: 55px;">${isEn ? "Unit" : "Satuan"}</th>
        <th style="width: 105px;">${isEn ? "Unit Price (Rp)" : "Harga Satuan (Rp)"}</th>
        <th style="width: 115px;">${isEn ? "Total (Rp)" : "Jumlah Harga (Rp)"}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="6" style="text-align: center; padding: 16px; color: #94a3b8;">${isEn ? "No items in this BoQ document" : "Belum ada rincian pekerjaan pada surat BoQ ini"}</td></tr>`}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row">
      <span>GRAND TOTAL</span>
      <span style="font-size: 13pt; color: #0f172a;">${fmtRupiah(data.total)}</span>
    </div>
    <div class="terbilang-box">
      <strong>${isEn ? "In Words" : "Terbilang"}:</strong> ${escapeHtml(terbilang)}
    </div>
  </div>

  ${data.note ? `
  <div class="notes-box">
    <strong>${isEn ? "Notes & Conditions" : "Catatan & Ketentuan"}:</strong><br />
    ${escapeHtml(data.note)}
  </div>
  ` : ""}

  <div class="sig-grid">
    <div class="sig-card">
      <div class="sig-role">${isEn ? "Prepared by" : "Disiapkan Oleh"}</div>
      <div class="sig-name">${escapeHtml(data.signerName || "Commercial Estimator")}</div>
    </div>
    <div class="sig-card">
      <div class="sig-role">${isEn ? "Reviewed by" : "Diperiksa Oleh"}</div>
      <div class="sig-name">Head of Engineering / PM</div>
    </div>
    <div class="sig-card">
      <div class="sig-role">${isEn ? "Approved by Client" : "Disetujui Pemilik Kapal"}</div>
      <div class="sig-name">${escapeHtml(data.clientName || "Client Representative")}</div>
    </div>
  </div>

  <div class="footer">
    <span>ISMS Commercial &amp; Project Engineering System · Generated automatically</span>
    <span>Printed on ${new Date().toLocaleString(isEn ? "en-GB" : "id-ID")}</span>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function printBoqHtml(data: BoqPrintData): void {
  const html = generateBoqHtml(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Popup diblokir: fallback ke hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 3000);
    }
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}
