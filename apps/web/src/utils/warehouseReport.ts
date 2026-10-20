/* Laporan Gudang persis "Warehouse Report <tahun>.xlsx" milik galangan (catatan
 * CTO 19 Okt: keluaran aplikasi harus sama dengan template). Nama & urutan sheet,
 * judul "STOCK REAL", teks kepala kolom (termasuk "TANGGGAL" apa adanya), lebar
 * kolom, format tanggal Indonesia, format angka akuntansi, dan baris/kolom beku
 * diambil dari berkas klien. Isinya dari mutasi & stok aplikasi. */
import writeXlsxFile, { type SheetData } from "write-excel-file/browser";
import type { StoreItem } from "../data/store";
import { sanitizeCell } from "./export";

const DATE_FMT = "[$-421]dd mmmm yyyy;@";
const NUM_FMT = '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)';

export const IN_HEADERS = ["TANGGGAL", "KODE BARANG", "NAMA BARANG", "KODE SUPPLIER", "NAMA SUPPLIER", "JUMLAH BARANG MASUK", "QTY", "HARGA (NON PPN 11%)", "PAJAK (JIKA ADA)", "TOTAL"];
export const OUT_HEADERS = ["TANGGAL", "PURPOSE", "KODE BARANG", "NAMA BARANG", "JUMLAH BARANG KELUAR", "QTY", "PIC"];

/** Sheet stok tempat barang ditulis: template memisah plat/pipa dan filter dari logistik umum. */
export type StockSheet = "logistik" | "plat" | "filter";
export function stockSheetOf(i: StoreItem): StockSheet {
  const s = `${String(i.category ?? "")} ${String(i.name ?? "")}`.toLowerCase();
  if (/filter|air cleaner/.test(s)) return "filter";
  if (/\b(plat|pelat|pipa|baja)\b/.test(s)) return "plat";
  return "logistik";
}

interface Sheet { sheet: string; data: SheetData; columns: { width: number }[]; stickyRowsCount?: number; stickyColumnsCount?: number }

const txt = (v: unknown) => ({ value: sanitizeCell(String(v ?? "")), type: String });
const num = (v: number, format?: string, align?: "center") => ({ value: Number.isFinite(v) ? v : 0, type: Number, format, align });
const date = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? txt(iso) : { value: d, type: Date, format: DATE_FMT };
};
const bold = (v: string, align?: "center", columnSpan?: number) => ({ value: v, type: String, fontWeight: "bold" as const, align, columnSpan });
const widths = (w: number[]) => w.map((width) => ({ width }));
const unitOf = (u: unknown): string => String(u ?? "").toUpperCase();

export interface WarehouseInput {
  inventory: StoreItem[];
  movements: StoreItem[];
  vendors: StoreItem[];
}

export function warehouseSheets({ inventory, movements, vendors }: WarehouseInput): Sheet[] {
  const itemOf = (m: StoreItem) => inventory.find((i) => i.id === m.itemId) ?? inventory.find((i) => i.name === m.item);
  const vendorCode = (name: string) => {
    const v = vendors.find((x) => String(x.name ?? "").trim().toLowerCase() === name.trim().toLowerCase());
    return v ? String(v.code ?? v.id ?? "") : "";
  };
  const byDate = (a: StoreItem, b: StoreItem) => String(a.date ?? "").localeCompare(String(b.date ?? ""));

  const inRows: SheetData = movements.filter((m) => m.type === "Penerimaan").sort(byDate).map((m) => {
    const it = itemOf(m);
    const qty = Number(m.qty) || 0;
    const price = Number(m.priceExcl) || 0;
    const tax = Number(m.tax) || 0;
    const supplier = String(m.supplier ?? "");
    return [date(String(m.date ?? "")), txt(it?.sku ?? m.itemId), txt(m.item ?? it?.name), txt(m.supplierCode ?? vendorCode(supplier)), txt(supplier),
      num(qty), txt(unitOf(it?.unit)), num(price, NUM_FMT), num(tax, NUM_FMT), num(Number(m.total) || qty * price + tax, NUM_FMT)];
  });
  const outRows: SheetData = movements.filter((m) => m.type === "Pengeluaran").sort(byDate).map((m) => {
    const it = itemOf(m);
    return [date(String(m.date ?? "")), txt(m.purpose ?? m.project ?? ""), txt(it?.sku ?? m.itemId), txt(m.item ?? it?.name),
      num(Number(m.qty) || 0), txt(unitOf(it?.unit)), txt(m.pic ?? "")];
  });

  const stock = (kind: StockSheet, extra?: (i: StoreItem) => string) => inventory.filter((i) => stockSheetOf(i) === kind).map((i, n) => [
    num(n + 1, undefined, "center"), txt(i.name), num(Number(i.stock) || 0, undefined, "center"), { ...txt(unitOf(i.unit)), align: "center" as const },
    ...(extra ? [txt(extra(i))] : []),
  ]);
  const head = (cols: string[]) => cols.map((c) => bold(c, c === "NAMA BARANG" || c === "KETERANGAN" ? undefined : "center"));

  return [
    { sheet: "IN JAN-DES", data: [IN_HEADERS.map(txt), ...inRows], columns: widths([13.5, 12.1, 36.6, 15, 33.6, 7.5, 6.4, 14.6, 13.5, 24.4]), stickyRowsCount: 1, stickyColumnsCount: 5 },
    { sheet: "OUT JAN-DES", data: [OUT_HEADERS.map(txt), ...outRows], columns: widths([12.9, 36.1, 16.4, 43.9, 7.5, 4.6, 19.9]), stickyRowsCount: 1 },
    { sheet: "LOGISTIK", data: [[null], [bold("STOCK REAL", "center", 4), null, null, null], [null], head(["NO", "NAMA BARANG", "JUMLAH", "QTY"]), ...stock("logistik")], columns: widths([9, 54.8, 14, 9]) },
    { sheet: "PLAT,PIPA DST", data: [[null], head(["NO", "NAMA BARANG", "JUMLAH", "QTY"]), ...stock("plat")], columns: widths([9, 37.2, 9, 9]) },
    { sheet: "FILTER", data: [[bold("STOCK REAL ", "center", 5), null, null, null, null], [null], head(["NO ", "NAMA BARANG", "JUMLAH", "QTY", "KETERANGAN"]), ...stock("filter", (i) => String(i.note ?? i.keterangan ?? ""))], columns: widths([9, 64, 9, 9, 18.8]) },
  ];
}

export async function exportWarehouseReport(input: WarehouseInput, filename: string): Promise<void> {
  await writeXlsxFile(warehouseSheets(input)).toFile(`${filename}.xlsx`);
}

/** Template impor IN/OUT = sheet laporan yang sama dengan satu baris contoh sintetis. */
export async function exportWarehouseTemplate(kind: "IN" | "OUT", filename: string): Promise<void> {
  const item: StoreItem = { id: "INV-CONTOH", sku: "BRG-0001", name: "BAUT M12 X 50 GALVANIS", unit: "pcs" };
  const mov: StoreItem = kind === "IN"
    ? { id: "M-1", type: "Penerimaan", itemId: item.id, item: item.name, date: "2026-01-02", qty: 10, supplier: "CV PEMASOK CONTOH", supplierCode: "S0001", priceExcl: 15000, tax: 16500, total: 166500 }
    : { id: "M-2", type: "Pengeluaran", itemId: item.id, item: item.name, date: "2026-01-02", qty: 4, purpose: "TB CONTOH 01", pic: "PIC CONTOH" };
  const all = warehouseSheets({ inventory: [item], movements: [mov], vendors: [] });
  await writeXlsxFile([all[kind === "IN" ? 0 : 1]]).toFile(`${filename}.xlsx`);
}
