/* Pembaca spreadsheet untuk fitur impor (catatan klien 17 Okt: impor Excel
   ruang lingkup & BoQ). Tanpa dependensi baru: .xlsx adalah zip berisi XML,
   dibuka dengan DecompressionStream("deflate-raw") bawaan browser/Node dan XML
   sheet dibaca dengan regex (strukturnya sederhana dan tetap). Yang dibaca sheet
   pertama, atau sheet yang namanya cocok dengan `sheet` (mis. buku "Warehouse
   Report" klien berisi IN dan OUT sekaligus); .csv juga diterima (pemisah koma
   atau titik koma). */

const td = new TextDecoder();

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Isi file di dalam zip, berdasarkan nama. */
async function unzip(buf: ArrayBuffer, wanted: (name: string) => boolean): Promise<Map<string, string>> {
  const v = new DataView(buf);
  const bytes = new Uint8Array(buf);
  // End of Central Directory: cari dari belakang (komentar zip bisa ada).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Berkas bukan .xlsx yang valid");
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out = new Map<string, string>();
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error("Struktur .xlsx rusak");
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = td.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (wanted(name)) {
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const raw = bytes.subarray(start, start + size);
      out.set(name, td.decode(method === 0 ? raw : await inflateRaw(raw)));
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const decodeXml = (s: string): string =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");

/** Teks dari semua <t> di dalam potongan XML (rich text dipecah per run). */
const textOf = (xml: string): string =>
  [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1] ?? "")).join("");

/** "B12" → 1 (indeks kolom 0-based). */
function colIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export async function readXlsxRows(buf: ArrayBuffer, sheet?: RegExp): Promise<string[][]> {
  const files = await unzip(buf, (n) => n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels" || n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  // Urutan workbook, bukan nama berkas: sheet bernama cocok, kalau tidak ada sheet pertama.
  const tags = [...(files.get("xl/workbook.xml") ?? "").matchAll(/<sheet\b[^>]*>/g)].map((m) => m[0]);
  const tag = (sheet ? tags.find((t) => sheet.test(decodeXml(/\bname="([^"]*)"/.exec(t)?.[1] ?? ""))) : undefined) ?? tags[0];
  const firstRid = tag ? /\br:id="([^"]+)"/.exec(tag)?.[1] : undefined;
  const target = firstRid ? new RegExp(`<Relationship\\b[^>]*Id="${firstRid}"[^>]*Target="([^"]+)"`).exec(files.get("xl/_rels/workbook.xml.rels") ?? "")?.[1] : undefined;
  const sheetName = target ? `xl/${target.replace(/^\/?xl\//, "").replace(/^\//, "")}` : "xl/worksheets/sheet1.xml";
  const xml = files.get(sheetName) ?? [...files.entries()].find(([n]) => n.startsWith("xl/worksheets/"))?.[1];
  if (!xml) throw new Error("Sheet tidak ditemukan di berkas .xlsx");
  const shared = [...(files.get("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1] ?? ""));
  const rows: string[][] = [];
  for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cm of (rm[1] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1] ?? "";
      const body = cm[2] ?? "";
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "n";
      const value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
      const text = type === "s" ? shared[Number(value)] ?? ""
        : type === "inlineStr" ? textOf(body)
        : type === "b" ? (value === "1" ? "TRUE" : "FALSE")
        : decodeXml(value);
      row[ref ? colIndex(ref) : row.length] = text;
    }
    rows.push(Array.from(row, (c) => c ?? ""));
  }
  return rows;
}

/** Satu baris CSV: tanda kutip ganda, pemisah koma atau titik koma. */
export function splitCsvRow(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function readCsvRows(text: string): string[][] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  // Excel versi Indonesia menyimpan CSV dengan titik koma.
  const sep = (lines[0] ?? "").split(";").length > (lines[0] ?? "").split(",").length ? ";" : ",";
  return lines.map((l) => splitCsvRow(l, sep));
}

/** Baris-baris sel dari berkas .xlsx atau .csv (semua sel sebagai teks, sudah di-trim). */
export async function readSheetRows(file: File, sheet?: RegExp): Promise<string[][]> {
  const isCsv = /\.csv$/i.test(file.name);
  const rows = isCsv ? readCsvRows(await file.text()) : await readXlsxRows(await file.arrayBuffer(), sheet);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

/** Angka dari sel: "1.250.000", "1250000", "1.5", "1,5" → number (NaN bila tidak valid). */
export function sheetNumber(cell: string): number {
  const s = cell.replace(/\s|Rp/gi, "");
  if (s === "") return NaN;
  // Format Indonesia: titik ribuan + koma desimal.
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g, "").replace(",", "."));
  return Number(s.replace(",", "."));
}

/** Tanggal ISO dari sel: "2026-01-02", nomor seri Excel (46024) atau "02/01/2026"
 *  (hari/bulan/tahun). "" bila tidak dikenali. */
export function sheetDate(cell: string): string {
  const s = cell.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Excel menyimpan tanggal sebagai jumlah hari sejak 30 Des 1899.
  if (/^\d{5}(\.\d+)?$/.test(s)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86_400_000).toISOString().slice(0, 10);
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}
