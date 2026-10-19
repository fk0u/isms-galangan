/* Voucher jurnal (K17-FIN-08): bukti pembukuan satu transaksi keuangan.
 * Setiap baris jurnal dipecah jadi baris Debit dan Kredit per akun supaya
 * pemeriksa bisa mencocokkan total debit = total kredit di kertas. */
import { Document, type DocOptions } from "../document.js";
import { keyValue, table, signatures, spacer, callout } from "../blocks.js";
import { COLOR } from "../theme.js";
import { companyKop, docTitle, longDate, money, L, type Locale } from "./shared.js";

export interface VoucherInput {
  no: string;
  tanggal: string;
  dokumen: string;
  sumber: string;
  uraian: string;
  lines: Array<{ kode: string; nama: string; uraian: string; debit: number; kredit: number }>;
  locale?: Locale;
}

export function voucher(input: VoucherInput, opts: DocOptions = {}): Document {
  const locale = input.locale ?? "id";
  const d = new Document({ title: `Voucher ${input.no}`, subject: "Voucher jurnal", ...opts });
  d.add(companyKop());
  d.add(docTitle({
    title: L(locale, "VOUCHER JURNAL", "JOURNAL VOUCHER"),
    ref: `${L(locale, "No", "No")}. ${input.no}   ${L(locale, "Tanggal", "Date")} ${longDate(input.tanggal)}`,
  }));
  d.add(keyValue({
    labelW: 32,
    pairs: [
      { label: L(locale, "No. Dokumen", "Document no"), value: input.dokumen || "-" },
      { label: L(locale, "Sumber", "Source"), value: input.sumber || "-" },
      { label: L(locale, "Keterangan", "Description"), value: input.uraian || "-" },
    ],
  }));
  const debit = input.lines.reduce((s, l) => s + l.debit, 0);
  const kredit = input.lines.reduce((s, l) => s + l.kredit, 0);
  const rows = [
    ...input.lines.map((l) => [l.kode, l.nama, l.uraian, l.debit ? money(l.debit) : "-", l.kredit ? money(l.kredit) : "-"]),
    ["", L(locale, "Total", "Total"), "", money(debit), money(kredit)],
  ];
  d.add(table({
    head: [L(locale, "Akun", "Account"), L(locale, "Nama Akun", "Account name"), L(locale, "Uraian", "Description"), L(locale, "Debit (Rp)", "Debit (Rp)"), L(locale, "Kredit (Rp)", "Credit (Rp)")],
    widths: [18, 40, "auto", 30, 30],
    align: ["left", "left", "left", "right", "right"],
    rows,
    totalRow: rows.length - 1,
    labelCol: 1,
    zebra: false,
  }));
  if (Math.round(debit) !== Math.round(kredit)) {
    d.add(callout([L(locale, `Tidak seimbang: selisih ${money(Math.abs(debit - kredit))}`, `Unbalanced: difference ${money(Math.abs(debit - kredit))}`)], { fill: COLOR.softFill, border: COLOR.hair, size: 9 }));
  }
  d.add(spacer(4));
  d.add(signatures([
    { role: L(locale, "Dibuat", "Prepared by"), name: "", rows: 5 },
    { role: L(locale, "Diperiksa", "Checked by"), name: "", rows: 5 },
    { role: L(locale, "Disetujui", "Approved by"), name: "", rows: 5 },
  ]));
  return d;
}
