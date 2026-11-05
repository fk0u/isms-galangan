import writeXlsxFile, { type SheetData } from "write-excel-file/browser";

/* ============ E K S E L ============ */

/** Awalan sel berbahaya untuk injeksi formula Excel saat dibuka. */
const FORMULA_LEAD = ["=", "+", "-", "@", "\t", "|"];

export function sanitizeCell(v: string): string {
  /* "-" saja (penanda kosong di laporan) bukan formula; tanpa pengecualian ini
     Excel menampilkan "'-" di setiap sel kosong (catatan klien 5 Nov). */
  if (/^-+$/.test(v)) return v;
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
const RP_FORMAT = '"Rp" #,##0;[Red]-"Rp" #,##0';
const MONEY_HEAD = /rp|nilai|harga|total|gaji|pokok|tunjangan|lembur|pph|ppn|bpjs|potongan|kasbon|net|nominal|saldo|debit|kredit|bruto|dpp|biaya|hutang|piutang|amount|beban|bayar|upah|sisa|pendapatan|laba|jasa|material|retensi|denda|diskon|anggaran|rab|aset|susut|thr|bonus|pesangon|price|cost|value|salary/i;
const NOT_MONEY_HEAD = /qty|kuantitas|hari|jam|%|persen|kode|\bno\b|baris|jumlah item|count|dokumen|masa|tahun|bulan|umur|stok/i;

const STRONG_MONEY_HEAD = /saldo|mutasi|^akhir/i;

export function moneyColumns(header: unknown[] | undefined): Array<boolean | null> {
  return (header ?? []).map((h) => {
    const t = typeof h === "string" ? h : "";
    if (!t) return null;
    /* #317: "SALDO AWAL BULAN"/"AKHIR BULAN" memuat kata "bulan" tapi tetap nominal. */
    if (STRONG_MONEY_HEAD.test(t)) return true;
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
  /** Kop laporan resmi (format klien): jam & tanggal ekspor di kiri atas,
   *  nama perusahaan, judul laporan, dan periode di tengah. */
  header?: { company: string; title: string; period: string };
  /** Kolom uang eksplisit (indeks 0-based). Wajib untuk sheet tanpa header di
   *  baris 0 (mis. JU, Kas, Bank yang berisi beberapa tabel berdampingan). */
  moneyCols?: number[];
}

/* Tema laporan keuangan mengikuti DESIGN.md: putih netral + merah merek. */
const TEMA = { brand: "#B91C1C", brandDark: "#7F1D1D", tint: "#FEF2F2", ink: "#09090B", line: "#E4E4E7", zebra: "#FAFAFA", muted: "#71717A", total: "#F4F4F5", white: "#FFFFFF" };

/** Jenis baris untuk pewarnaan tema; dipasang builder lewat styledRow(). */
export type RowKind = "head" | "section" | "total" | "grand" | "note" | "blank";
type RowKinds = RowKind | Array<RowKind | undefined>;
const ROW_KIND = new WeakMap<unknown[], RowKinds>();

/** Tandai satu baris (array yang sama dikembalikan) supaya diberi gaya tema.
 *  Larik jenis per kolom dipakai neraca 2 sisi (aktiva kiri, pasiva kanan). */
export function styledRow(kind: RowKinds, cells: unknown[]): unknown[] {
  ROW_KIND.set(cells, kind);
  return cells;
}

const THIN = "thin" as const;
function themedCell(raw: CellRaw, kind: RowKind | undefined, money: boolean | null, zebra: boolean) {
  // Nol tampil "-" seperti laporan akuntansi; sel tetap angka.
  const base = raw === 0 ? { value: 0, format: '#,##0;-#,##0;"-"' } : asMoney(raw, money);
  const cell = typeof base === "object" && !(base instanceof Date) ? { ...base } : { value: base };
  const border = {
    topBorderStyle: THIN,
    topBorderColor: TEMA.line,
    bottomBorderStyle: THIN,
    bottomBorderColor: TEMA.line,
    leftBorderStyle: THIN,
    leftBorderColor: TEMA.line,
    rightBorderStyle: THIN,
    rightBorderColor: TEMA.line,
  };
  // Bar teks dasbor (█░) diwarnai merek agar terbaca sebagai grafik.
  const bar = typeof raw === "string" && /^[█░]/.test(raw) ? { textColor: TEMA.brand } : {};
  switch (kind) {
    case "head": return { ...cell, fontWeight: "bold" as const, textColor: TEMA.white, backgroundColor: TEMA.brand, align: "center" as const, alignVertical: "center" as const, height: 22, ...border, topBorderColor: TEMA.brandDark, bottomBorderColor: TEMA.brandDark, leftBorderColor: TEMA.brandDark, rightBorderColor: TEMA.brandDark };
    case "section": return { ...cell, fontWeight: "bold" as const, textColor: TEMA.brandDark, backgroundColor: TEMA.tint, ...border };
    case "total": return { ...cell, fontWeight: "bold" as const, backgroundColor: TEMA.total, ...border, topBorderStyle: THIN, topBorderColor: TEMA.muted, bottomBorderStyle: "double" as const, bottomBorderColor: TEMA.ink };
    /* #327: total akhir abu-abu seperti baris total lain (klien 6 Nov: latar hitam
       Neraca/Neraca Lajur/Laba Rugi tidak seragam dengan Kas & Bank, Hutang, Piutang). */
    case "grand": return { ...cell, fontWeight: "bold" as const, fontSize: 12, backgroundColor: TEMA.total, height: 22, alignVertical: "center" as const, ...border, topBorderStyle: THIN, topBorderColor: TEMA.muted, bottomBorderStyle: "double" as const, bottomBorderColor: TEMA.ink };
    case "note": return { ...cell, fontStyle: "italic" as const, textColor: TEMA.muted, ...border };
    // Area di luar tabel pada sheet berdampingan: tanpa garis dan latar.
    case "blank": return { value: "" };
    default: return { ...cell, ...(zebra ? { backgroundColor: TEMA.zebra } : {}), ...border, ...bar };
  }
}


/** Baris kop laporan; dibentang selebar tabel supaya judul tepat di tengah. */
function headerRows(h: NonNullable<ExcelSheet["header"]>, span: number): SheetData {
  const mid = (value: string, style: { fontSize: number; textColor: string }) =>
    [{ value: sanitizeCell(value), fontWeight: "bold" as const, align: "center" as const, columnSpan: span, ...style }, ...Array<null>(span - 1).fill(null)];
  return [
    mid(h.company, { fontSize: 14, textColor: TEMA.ink }),
    mid(h.title, { fontSize: 24, textColor: TEMA.brand }),
    mid(h.period, { fontSize: 12, textColor: TEMA.brandDark }),
    // Garis aksen merek di bawah kop.
    Array.from({ length: span }, () => ({ value: "", backgroundColor: TEMA.brand, height: 4 })),
    [null],
  ];
}

const SHEET_NAME_BANNED = /[[\]:*?/\\]/g;

function cleanSheetName(name: string): string {
  return (String(name || "").trim() || "Sheet").replace(SHEET_NAME_BANNED, "-").slice(0, 31);
}

/** Sheet laporan bertema: kop resmi, header merah, seksi/total berwarna,
 *  zebra tipis, tanpa gridline supaya tampak seperti laporan cetak. */
function themedSheet(s: ExcelSheet, header: NonNullable<ExcelSheet["header"]>, name: string, moneyCol: Array<boolean | null>) {
  const span = Math.max(2, ...s.rows.map((row) => row?.length ?? 0));
  const widths: number[] = Array<number>(span).fill(10);
  let zebra = false;
  const data: SheetData = s.rows.map((row, r) => {
    // Baris kosong = jeda antartabel: tanpa gaya, zebra mulai ulang.
    if (!row?.some((c) => c !== "" && c != null)) { zebra = false; return [null]; }
    const kinds = ROW_KIND.get(row) ?? (r === 0 ? "head" : undefined);
    const kindAt = (c: number) => (Array.isArray(kinds) ? kinds[c] : kinds);
    zebra = kinds && !Array.isArray(kinds) ? false : !zebra;
    // Isi baris sampai lebar tabel agar warna latar menutup satu baris penuh.
    return Array.from({ length: span }, (_, cIdx) => {
      let raw = normalizeCell(row?.[cIdx]);
      if (typeof raw === "string") raw = sanitizeCell(raw);
      // Angka tampil "Rp 1.234.567": lebar ikut teks terformat supaya tidak jadi ###.
      const shown = typeof raw === "number" ? `Rp -${Math.round(raw).toLocaleString("id-ID")}` : String(raw ?? "");
      widths[cIdx] = Math.max(widths[cIdx], Math.min(shown.length + 3, 48));
      return themedCell(raw ?? "", kindAt(cIdx), moneyCol[cIdx] ?? null, zebra);
    });
  });
  return {
    data: [...headerRows(header, span), ...data],
    sheet: name,
    columns: widths.map((w) => ({ width: w })),
    showGridLines: true,
  };
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
    const moneyCol = s.moneyCols
      ? Array.from({ length: Math.max(0, ...s.rows.map((r) => r?.length ?? 0)) }, (_, i) => s.moneyCols!.includes(i))
      : moneyColumns(s.rows?.[0]);
    if (s.header) return themedSheet(s, s.header, name, moneyCol);
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