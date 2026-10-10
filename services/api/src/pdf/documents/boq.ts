/* Surat BoQ (F3-C-04) dan Kartu Garansi (F3-B-12).
 *
 * Surat BoQ: satu nomor surat + revisi berisi banyak pekerjaan; yang dicetak
 * adalah isi surat pada revisi itu, bukan BoQ proyek secara keseluruhan.
 * Kartu garansi: bukti masa garansi/DLP per proyek atau per pekerjaan WBS. */
import { Document, type DocOptions } from "../document.js";
import { keyValue, paragraph, signatures, spacer, table, callout } from "../blocks.js";
import { companyKop, docTitle, longDate, money, rupiah, L, type Locale } from "./shared.js";

export interface BoqDocInput {
  number: string;
  revision: number;
  status: string;
  issuedAt: string;
  projectId: string;
  vessel: string;
  client: string;
  approvedBy?: string;
  approvedAt?: string;
  note?: string;
  items: { name: string; description: string; qty: number; unit: string; unitPrice: number; total: number }[];
  total: number;
  signer: string;
  locale?: Locale;
}

export function boqDoc(input: BoqDocInput, opts: DocOptions = {}): Document {
  const locale = input.locale ?? "id";
  const d = new Document({ title: `BoQ ${input.number} Rev ${input.revision}`, subject: `Bill of Quantity - ${input.projectId}`, ...opts });
  d.add(companyKop());
  d.add(docTitle({
    title: "BILL OF QUANTITY",
    ref: `${L(locale, "No", "No")}. ${input.number}   Rev ${input.revision}   ${L(locale, "Tanggal", "Date")} ${longDate(input.issuedAt)}`,
  }));
  d.add(keyValue({
    labelW: 40,
    pairs: [
      { label: L(locale, "Proyek", "Project"), value: input.projectId, bold: true },
      { label: L(locale, "Kapal", "Vessel"), value: input.vessel },
      { label: L(locale, "Klien", "Client"), value: input.client },
      { label: "Status", value: input.status, bold: true },
      ...(input.approvedBy ? [{ label: L(locale, "Disetujui", "Approved"), value: `${input.approvedBy}${input.approvedAt ? ` · ${longDate(input.approvedAt)}` : ""}` }] : []),
    ],
  }));
  d.add(spacer(2));
  const rows = input.items.map((it, i) => [
    String(i + 1),
    it.description && it.description !== it.name ? `${it.name}\n${it.description}` : it.name,
    money(it.qty),
    it.unit,
    rupiah(it.unitPrice),
    rupiah(it.total),
  ]);
  rows.push(["", "", "", "", "TOTAL", rupiah(input.total)]);
  d.add(table({
    head: ["No", L(locale, "Uraian Pekerjaan", "Work Item"), L(locale, "Jumlah", "Qty"), L(locale, "Satuan", "Unit"), L(locale, "Harga Satuan", "Unit Price"), "Total"],
    widths: [10, "auto", 16, 18, 30, 34],
    align: ["right", "left", "right", "left", "right", "right"],
    rows,
    totalRow: rows.length - 1,
    labelCol: 4,
  }));
  if (input.note && input.note.trim() !== "") {
    d.add(spacer(2));
    d.add(callout([input.note]));
  }
  d.add(signatures([
    { role: L(locale, "Disiapkan oleh", "Prepared by"), name: input.signer, rows: 4 },
    { role: L(locale, "Disetujui klien", "Client approval"), name: input.client, rows: 4 },
  ]));
  return d;
}

export interface GaransiInput {
  no: string;
  projectId: string;
  vessel: string;
  client: string;
  /** Kosong = garansi seluruh pekerjaan proyek. */
  wbsTask?: string;
  start: string;
  months: number;
  end: string;
  status: string;
  signer: string;
  locale?: Locale;
}

export function garansiDoc(input: GaransiInput, opts: DocOptions = {}): Document {
  const locale = input.locale ?? "id";
  const d = new Document({ title: `Kartu Garansi ${input.no}`, subject: `Garansi - ${input.vessel}`, ...opts });
  d.add(companyKop());
  d.add(docTitle({ title: L(locale, "KARTU GARANSI", "WARRANTY CARD"), ref: `${L(locale, "No", "No")}. ${input.no}` }));
  d.add(keyValue({
    labelW: 44,
    pairs: [
      { label: L(locale, "Kapal", "Vessel"), value: input.vessel, bold: true },
      { label: L(locale, "Proyek", "Project"), value: input.projectId },
      { label: L(locale, "Klien", "Client"), value: input.client },
      { label: L(locale, "Lingkup garansi", "Warranty scope"), value: input.wbsTask && input.wbsTask !== "" ? input.wbsTask : L(locale, "Seluruh pekerjaan proyek", "All project work"), bold: true },
      { label: L(locale, "Berlaku mulai", "Valid from"), value: longDate(input.start) },
      { label: L(locale, "Masa garansi", "Warranty period"), value: L(locale, `${input.months} bulan`, `${input.months} months`) },
      { label: L(locale, "Berlaku sampai", "Valid until"), value: longDate(input.end), bold: true },
      { label: "Status", value: input.status },
    ],
  }));
  d.add(spacer(2));
  d.add(paragraph({
    text: L(
      locale,
      "Garansi mencakup cacat pengerjaan dan material yang dipasang galangan selama masa di atas. Garansi tidak berlaku untuk kerusakan akibat pemakaian di luar batas operasi, kecelakaan, atau perbaikan oleh pihak lain tanpa persetujuan tertulis.",
      "The warranty covers workmanship defects and yard-supplied materials during the period above. It does not cover damage from operation outside limits, accidents, or repairs by other parties without written consent.",
    ),
    size: 10,
  }));
  d.add(signatures([
    { role: L(locale, "Galangan", "Shipyard"), name: input.signer, rows: 4 },
    { role: L(locale, "Pemilik kapal", "Vessel owner"), name: input.client, rows: 4 },
  ]));
  return d;
}
