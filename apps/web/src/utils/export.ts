import writeXlsxFile, { type SheetData } from "write-excel-file/browser";

/* ============ E K S E L ============ */

/** Awalan sel berbahaya untuk injeksi formula Excel saat dibuka. */
const FORMULA_LEAD = ["=", "+", "-", "@", "\t", "|"];

export function sanitizeCell(v: string): string {
  if (FORMULA_LEAD.some((p) => v.startsWith(p))) return `'${v}`;
  return v;
}

type CellRaw = string | number | boolean | Date | undefined;

function normalizeCell(c: unknown): CellRaw {
  if (c instanceof Date || typeof c === "string" || typeof c === "number" || typeof c === "boolean") return c;
  if (c === null || c === undefined) return undefined;
  return String(c);
}

/* #276: nilai uang di ekspor tampil "Rp 1.000.000". Sel tetap angka (bisa
   dijumlah di Excel) dengan format "Rp" #,##0; pemisah ribuan mengikuti
   locale Excel (titik pada Excel berbahasa Indonesia). Kolom dianggap uang
   bila judulnya bernada nominal, atau - tanpa judul jelas - angkanya ≥ 10.000. */
const RP_FORMAT = '"Rp" #,##0';
const MONEY_HEAD = /rp|nilai|harga|total|gaji|pokok|tunjangan|lembur|pph|ppn|bpjs|potongan|kasbon|net|nominal|saldo|debit|kredit|bruto|dpp|biaya|hutang|piutang|amount|beban|bayar|upah|sisa|pendapatan|laba|jasa|material|retensi|denda|diskon|anggaran|rab|aset|susut|thr|bonus|pesangon|price|cost|value|salary/i;
const NOT_MONEY_HEAD = /qty|kuantitas|hari|jam|%|persen|kode|\bno\b|baris|jumlah item|count|dokumen|masa|tahun|bulan|umur|stok/i;

export function moneyColumns(header: unknown[] | undefined): Array<boolean | null> {
  return (header ?? []).map((h) => {
    const t = typeof h === "string" ? h : "";
    if (!t) return null;
    if (NOT_MONEY_HEAD.test(t)) return false;
    return MONEY_HEAD.test(t) ? true : null;
  });
}

export function asMoney(raw: CellRaw, isMoney: boolean | null): CellRaw | { value: number; format: string } {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return raw;
  const money = isMoney ?? Math.abs(raw) >= 10_000;
  return money ? { value: raw, format: RP_FORMAT } : raw;
}

/* Q28 (21 Okt): dokumen yang diekspor ke Excel memakai kop gambar yang sama
   dengan PDF. Kop 1142×214 px diskalakan selebar ~600 px dan menempati
   KOP_ROWS baris kosong di atas isi. Gagal memuat = tanpa kop (isi tetap). */
const KOP_ROWS = 6;
async function kopImage(): Promise<{ content: ArrayBuffer; contentType: string; width: number; height: number; dpi: number; anchor: { row: number; column: number } } | null> {
  try {
    const res = await fetch("/kop-sb.jpg");
    if (!res.ok) return null;
    return { content: await res.arrayBuffer(), contentType: "image/jpeg", width: 600, height: Math.round(600 * 214 / 1142), dpi: 96, anchor: { row: 1, column: 1 } };
  } catch {
    return null;
  }
}

export async function exportExcel(data: unknown[][], filename: string, sheetName = "Export", opts: { kop?: boolean } = {}): Promise<void> {
  const widths: number[] = [];
  const moneyCol = moneyColumns(data?.[0]);
  const rows: SheetData = (data ?? []).map((row, r) =>
    (row ?? []).map((c, cIdx) => {
      let raw = normalizeCell(c);
      if (typeof raw === "string") raw = sanitizeCell(raw);
      widths[cIdx] = Math.max(widths[cIdx] ?? 10, Math.min(String(raw ?? "").length + 2, 45));
      // Baris 0 = judul (besar, navy), baris 1 = header (tebal + fill).
      if (r === 0) return { value: raw, fontWeight: "bold" as const, fontSize: 14, color: "#0A0A0A" };
      if (r === 1) return { value: raw, fontWeight: "bold" as const, backgroundColor: "#EBEBEB" };
      return asMoney(raw, moneyCol[cIdx] ?? null) ?? null;
    })
  );
  const kop = opts.kop ? await kopImage() : null;
  await writeXlsxFile(kop ? [...Array.from({ length: KOP_ROWS }, () => [null]), ...rows] : rows, {
    sheet: cleanSheetName(sheetName),
    columns: widths.map((w) => ({ width: w })),
    ...(kop ? { images: [kop] } : { stickyRowsCount: 1 }),
  }).toFile(`${filename}.xlsx`);
}

export interface ExcelSheet {
  /** Nama tab sheet (otomatis dibersihkan: maks 31 karakter, tanpa []:*?/\ ). */
  name: string;
  /** Baris 0 = header tabel (tebal + fill), baris berikutnya = data. */
  rows: unknown[][];
}

const SHEET_NAME_BANNED = /[[\]:*?/\\]/g;

function cleanSheetName(name: string): string {
  return (String(name || "").trim() || "Sheet").replace(SHEET_NAME_BANNED, "-").slice(0, 31);
}

/** Workbook multi-sheet bergaya seragam: header tebal, lebar kolom otomatis,
 *  sanitasi anti-injeksi formula, baris kepala menempel saat di-scroll. */
export async function exportExcelSheets(sheets: ExcelSheet[], filename: string): Promise<void> {
  const usedNames = new Set<string>();
  const built = (sheets ?? []).map((s) => {
    let name = cleanSheetName(s.name);
    let n = 2;
    while (usedNames.has(name)) name = cleanSheetName(`${s.name} ${n++}`);
    usedNames.add(name);
    const widths: number[] = [];
    const moneyCol = moneyColumns(s.rows?.[0]);
    const data: SheetData = (s.rows ?? []).map((row, r) =>
      (row ?? []).map((c, cIdx) => {
        let raw = normalizeCell(c);
        if (typeof raw === "string") raw = sanitizeCell(raw);
        widths[cIdx] = Math.max(widths[cIdx] ?? 10, Math.min(String(raw ?? "").length + 2, 45));
        if (r === 0) return { value: raw ?? "", fontWeight: "bold" as const, backgroundColor: "#EBEBEB" };
        return asMoney(raw, moneyCol[cIdx] ?? null) ?? "";
      })
    );
    return {
      data,
      sheet: name,
      columns: widths.map((w) => ({ width: w })),
      stickyRowsCount: 1,
    };
  });
  if (built.length === 0) throw new Error("Tidak ada sheet untuk diekspor");
  await writeXlsxFile(built).toFile(`${filename}.xlsx`);
}
export { fmtRupiah, fmtJumlah, fmtMiliar, fmtTanggal, fmtRentang } from "./format";