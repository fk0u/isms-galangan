/* warehouse-report-probe.ts — Laporan Gudang mengikuti "Warehouse Report.xlsx"
 * galangan: urutan sheet, kepala kolom, pembagian sheet stok, dan berkas hasil
 * ekspor bisa diimpor balik (sheet IN/OUT dipilih menurut nama, tanggal seri Excel). */
import writeXlsxFile from "write-excel-file/node";
declare const process: { exit(code: number): never };
import { readXlsxRows, sheetDate } from "../src/utils/readSheet";
import { IN_HEADERS, OUT_HEADERS, stockSheetOf, warehouseSheets } from "../src/utils/warehouseReport";

let fail = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  if (cond) console.log(`PASS  ${name}`); else { fail++; console.error(`FAIL  ${name} ${detail}`); }
};

const inventory = [
  { id: "I1", sku: "BRG-01", name: "BAUT 1/2X2 BIASA", category: "Fastener", unit: "pcs", stock: 80 },
  { id: "I2", sku: "BRG-02", name: "Plat 8mm 5'x20'", category: "Baja", unit: "lbr", stock: 18 },
  { id: "I3", sku: "BRG-03", name: "FILTER OLI CONTOH", category: "Sparepart", unit: "pcs", stock: 6, note: "CRANE CONTOH" },
];
const movements = [
  { id: "M2", type: "Penerimaan", itemId: "I1", item: "BAUT 1/2X2 BIASA", date: "2026-02-03", qty: 10, supplier: "CV Pemasok Contoh", priceExcl: 1000, tax: 1100 },
  { id: "M1", type: "Penerimaan", itemId: "I2", item: "Plat 8mm 5'x20'", date: "2026-01-02", qty: 2, supplier: "CV Pemasok Contoh", priceExcl: 5000, tax: 0, total: 10000 },
  { id: "M3", type: "Pengeluaran", itemId: "I1", item: "BAUT 1/2X2 BIASA", date: "2026-02-04", qty: 4, purpose: "TB CONTOH 01", pic: "PIC A" },
  { id: "M4", type: "Selisih Opname", itemId: "I1", item: "BAUT 1/2X2 BIASA", date: "2026-02-05", qty: 1 },
];
const vendors = [{ id: "VND-007", code: "S0007", name: "CV Pemasok Contoh" }];

ok("pembagian sheet stok", stockSheetOf(inventory[0]) === "logistik" && stockSheetOf(inventory[1]) === "plat" && stockSheetOf(inventory[2]) === "filter");
ok("tanggal seri Excel", sheetDate("46024") === "2026-01-02" && sheetDate("02/01/2026") === "2026-01-02" && sheetDate("2026-01-02") === "2026-01-02" && sheetDate("x") === "");

const sheets = warehouseSheets({ inventory, movements, vendors });
ok("lima sheet sesuai template", sheets.map((s) => s.sheet).join("|") === "IN JAN-DES|OUT JAN-DES|LOGISTIK|PLAT,PIPA DST|FILTER", sheets.map((s) => s.sheet).join("|"));

const buf = await writeXlsxFile(sheets).toBuffer();
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
const inRows = await readXlsxRows(ab, /^IN\b/i);
const outRows = await readXlsxRows(ab, /^OUT\b/i);
ok("kepala kolom IN persis template", inRows[0]?.join("|") === IN_HEADERS.join("|"), inRows[0]?.join("|"));
ok("IN: hanya penerimaan, urut tanggal", inRows.length === 3 && sheetDate(inRows[1]?.[0] ?? "") === "2026-01-02" && inRows[1]?.[1] === "BRG-02", JSON.stringify(inRows[1]));
ok("IN: kode supplier dari master vendor, total = qty x harga + pajak", inRows[2]?.[3] === "S0007" && inRows[2]?.[9] === "11100" && inRows[2]?.[6] === "PCS", JSON.stringify(inRows[2]));
ok("kepala kolom OUT persis template", outRows[0]?.join("|") === OUT_HEADERS.join("|"));
ok("OUT: purpose & PIC", outRows.length === 2 && outRows[1]?.[1] === "TB CONTOH 01" && outRows[1]?.[6] === "PIC A", JSON.stringify(outRows[1]));
const logistik = await readXlsxRows(ab, /^LOGISTIK$/);
ok("LOGISTIK: judul STOCK REAL + NO/NAMA BARANG/JUMLAH/QTY", logistik.some((r) => r[0] === "STOCK REAL") && logistik.some((r) => r.join("|") === "NO|NAMA BARANG|JUMLAH|QTY") && logistik.some((r) => r[1] === "BAUT 1/2X2 BIASA" && r[2] === "80"));
const filter = await readXlsxRows(ab, /^FILTER$/);
ok("FILTER: kolom KETERANGAN", filter.some((r) => r[4] === "KETERANGAN") && filter.some((r) => r[1] === "FILTER OLI CONTOH" && r[4] === "CRANE CONTOH"));

if (fail) { console.error(`\nGAGAL ${fail} pemeriksaan Laporan Gudang`); process.exit(1); }
console.log("\nSemua pemeriksaan Laporan Gudang lolos.");
