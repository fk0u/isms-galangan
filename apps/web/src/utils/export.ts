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
  const rows: SheetData = (data ?? []).map((row, r) =>
    (row ?? []).map((c, cIdx) => {
      let raw = normalizeCell(c);
      if (typeof raw === "string") raw = sanitizeCell(raw);
      widths[cIdx] = Math.max(widths[cIdx] ?? 10, Math.min(String(raw ?? "").length + 2, 45));
      // Baris 0 = judul (besar, navy), baris 1 = header (tebal + fill).
      if (r === 0) return { value: raw, fontWeight: "bold" as const, fontSize: 14, color: "#0A0A0A" };
      if (r === 1) return { value: raw, fontWeight: "bold" as const, backgroundColor: "#EBEBEB" };
      return raw ?? null;
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
    const data: SheetData = (s.rows ?? []).map((row, r) =>
      (row ?? []).map((c, cIdx) => {
        let raw = normalizeCell(c);
        if (typeof raw === "string") raw = sanitizeCell(raw);
        widths[cIdx] = Math.max(widths[cIdx] ?? 10, Math.min(String(raw ?? "").length + 2, 45));
        if (r === 0) return { value: raw ?? "", fontWeight: "bold" as const, backgroundColor: "#EBEBEB" };
        return raw ?? "";
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