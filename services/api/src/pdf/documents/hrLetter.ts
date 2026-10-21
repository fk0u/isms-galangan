/* Surat resmi HR PT Syukur Bersaudara yang meniru template Word klien
 * (catatan CTO 19 Okt: "sesuaikan dokumennya", output harus ~99% sama):
 *
 *   - Surat Peringatan 1 & 2        (template "Surat Peringatan.docx", A4)
 *   - Pemutusan Hubungan Kerja / SP3 (template "Pemutusan Kerja.docx", Letter)
 *   - Surat Pengalaman Kerja         (template "Pengalaman Kerja.docx", A4)
 *   - Surat Keterangan Bekerja       (template "Surat Benar Bekerja.docx", A4)
 *
 * Mesin blok umum (paragraph/keyValue/signatures) memakai font sans dan
 * garis tanda tangan, jadi tidak bisa meniru surat Word. Modul ini menggambar
 * satu halaman langsung dengan jsPDF memakai Times (standard-14, sama dengan
 * "Times New Roman" di template) dan ukuran yang diambil dari XML template:
 * margin, posisi & ukuran kop, ukuran huruf, spasi 1 / 1,5, indentasi tab,
 * blok tanda tangan, dan footer. Setiap goresan dicatat ke `rec` supaya
 * pemeriksa geometri (pdf-audit) tetap berlaku.
 *
 * Teks baku surat disalin persis dari template (termasuk ejaan aslinya,
 * mis. "sepunuhnya", "konstribusi"); hanya data karyawan yang diisi aplikasi.
 */
import type { jsPDF } from "jspdf";
import { Document, type DocOptions } from "../document.js";
import type { Block, DrawRecord } from "../blocks.js";
import { kopImageSrc as kopDataUrl, longDate } from "./shared.js";
import { terbilangAngka } from "./kwitansi.js";

export type HrLetterKind = "sp1" | "sp2" | "phk" | "pengalaman" | "keterangan";

export interface HrLetterInput {
  kind: HrLetterKind;
  no: string;
  /** Tanggal surat (ISO). */
  tanggal: string;
  nama: string;
  jabatan: string;
  /** SP: daftar pelanggaran (satu butir per baris). PHK: alasan. */
  pelanggaran: string[];
  /** PHK: tanggal hubungan kerja berakhir (ISO). */
  tanggalEfektif?: string;
  alamat?: string;
  tempatTanggalLahir?: string;
  jenisKelamin?: string;
  agama?: string;
  statusKawin?: string;
  /** Pengalaman: mulai bekerja; Keterangan: "sejak". */
  tanggalMulai?: string;
  /** Pengalaman: akhir bekerja. */
  tanggalSelesai?: string;
  /** Penanda tangan (PHK/Pengalaman/Keterangan). SP selalu "Management". */
  penandaTangan: string;
  jabatanPenandaTangan?: string;
}

const PT = 25.4 / 72; // 1 pt dalam mm
const TWIP = 25.4 / 1440; // 1 twip dalam mm
const EMU = 1 / 36000; // 1 EMU dalam mm
/* Tinggi baris "single" Word untuk Times New Roman = 1,15 x ukuran huruf. */
const single = (size: number): number => size * 1.15 * PT;

type Style = "normal" | "bold" | "italic" | "bolditalic";
interface Run { text: string; style?: Style; underline?: boolean; color?: [number, number, number] }

/** Kanvas surat: kursor vertikal + primitif teks ala Word. */
class Pen {
  y: number;
  constructor(private pdf: jsPDF, private rec: DrawRecord[], private left: number, private right: number, top: number) {
    this.y = top;
  }
  private page(): number { return this.pdf.getCurrentPageInfo().pageNumber; }
  private font(style: Style, size: number): void {
    this.pdf.setFont("times", style);
    this.pdf.setFontSize(size);
  }
  width(text: string, style: Style, size: number): number {
    this.font(style, size);
    return this.pdf.getTextWidth(text);
  }
  /** Tulis satu potongan pada baseline; catat jejaknya. */
  private put(r: Run, x: number, base: number, size: number): number {
    const style = r.style ?? "normal";
    this.font(style, size);
    const c = r.color ?? [0, 0, 0];
    this.pdf.setTextColor(c[0], c[1], c[2]);
    this.pdf.text(r.text, x, base);
    const w = this.pdf.getTextWidth(r.text);
    if (r.underline && r.text.trim() !== "") {
      this.pdf.setDrawColor(c[0], c[1], c[2]);
      this.pdf.setLineWidth(size * 0.05 * PT);
      this.pdf.line(x, base + size * 0.12 * PT, x + w, base + size * 0.12 * PT);
    }
    this.rec.push({ page: this.page(), x, y: base, w, h: single(size), kind: "text", text: r.text });
    return w;
  }
  /** Satu baris (tidak dibungkus) berisi beberapa potongan gaya. */
  line(runs: Run[], o: { size: number; spacing?: number; align?: "left" | "center" | "right"; indent?: number; boxRight?: number; after?: number }): void {
    const lh = single(o.size) * (o.spacing ?? 1);
    const x0 = this.left + (o.indent ?? 0);
    const x1 = o.boxRight ?? this.right;
    const total = runs.reduce((s, r) => s + this.width(r.text, r.style ?? "normal", o.size), 0);
    let x = o.align === "center" ? x0 + (x1 - x0 - total) / 2 : o.align === "right" ? x1 - total : x0;
    const base = this.y + lh - single(o.size) * 0.22;
    for (const r of runs) x += this.put(r, x, base, o.size);
    this.y += lh + (o.after ?? 0) * PT;
  }
  /** Paragraf dibungkus; rata kiri-kanan (Word "both") kecuali baris terakhir. */
  para(text: string, o: { size: number; spacing?: number; justify?: boolean; style?: Style; indent?: number; after?: number }): void {
    const style = o.style ?? "normal";
    const x0 = this.left + (o.indent ?? 0);
    const maxW = this.right - x0;
    this.font(style, o.size);
    const lines = this.pdf.splitTextToSize(text, maxW) as string[];
    const lh = single(o.size) * (o.spacing ?? 1);
    lines.forEach((ln, i) => {
      const base = this.y + lh - single(o.size) * 0.22;
      const last = i === lines.length - 1;
      if (o.justify && !last) {
        const words = ln.trim().split(/\s+/);
        const wsum = words.reduce((s, w) => s + this.width(w, style, o.size), 0);
        const gap = words.length > 1 ? (maxW - wsum) / (words.length - 1) : 0;
        let x = x0;
        for (const w of words) x += this.put({ text: w, style }, x, base, o.size) + gap;
      } else {
        this.put({ text: ln, style }, x0, base, o.size);
      }
      this.y += lh;
    });
    this.y += (o.after ?? 0) * PT;
  }
  blank(size: number, spacing = 1): void { this.y += single(size) * spacing; }
  /** Label + tab + ": nilai" (nilai panjang dibungkus di kolom nilai). */
  field(label: string, value: string, o: { size: number; spacing?: number; tab: number; valueStyle?: Style }): void {
    const lh = single(o.size) * (o.spacing ?? 1);
    const vx = this.left + o.tab;
    this.font(o.valueStyle ?? "normal", o.size);
    const colon = ": ";
    const first = this.pdf.splitTextToSize(value, this.right - vx - this.width(colon, "normal", o.size)) as string[];
    const rest = first.length > 1 ? (this.pdf.splitTextToSize(value.slice(first[0]!.length).trim(), this.right - vx) as string[]) : [];
    const lines = [first[0] ?? "", ...rest];
    lines.forEach((ln, i) => {
      const base = this.y + lh - single(o.size) * 0.22;
      if (i === 0) {
        this.put({ text: label }, this.left, base, o.size);
        const cw = this.put({ text: colon }, vx, base, o.size);
        this.put({ text: ln, style: o.valueStyle }, vx + cw, base, o.size);
      } else {
        this.put({ text: ln, style: o.valueStyle }, vx, base, o.size); // indent gantung Word: lanjut di posisi tab
      }
      this.y += lh;
    });
  }
  /** Pindah ke posisi footer: blok `lines` baris berakhir 12 mm dari tepi
   *  bawah kertas, tetapi tidak pernah naik menimpa isi di atasnya. */
  toFooter(lines: number, size: number): void {
    this.y = Math.max(this.y + 2, this.pdf.internal.pageSize.getHeight() - 12 - lines * single(size));
  }
  image(dataUrl: string, x: number, y: number, w: number, h: number): void {
    this.pdf.addImage(dataUrl, "JPEG", x, y, w, h);
    this.rec.push({ page: this.page(), x, y: y + h, w, h, kind: "image" });
  }
}

/* Permintaan user 21 Okt: tanpa biru; tautan/aksen memakai merah kop SB. */
const ACCENT: [number, number, number] = [200, 32, 46];
/** Jarak antara tepi bawah kop dan teks pertama (judul) - sebelumnya terlalu mepet. */
const KOP_GAP = 6;

/** "26 (Dua Puluh Enam) bulan Juni tahun 2026" - kalimat tanggal PHK. */
export function tanggalTerbilang(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const day = Number(m[3]);
  const words = terbilangAngka(day).replace(/\b\w/g, (c) => c.toUpperCase());
  const bulan = longDate(iso).split(" ")[1] ?? m[2];
  return `${day} (${words}) bulan ${bulan} tahun ${m[1]}`;
}

function spLetter(p: Pen, pdf: jsPDF, inp: HrLetterInput): void {
  // Template: A4, kiri 25,4 mm, kanan 20 mm, Times 11 pt, spasi 1,5.
  const kop = kopDataUrl();
  if (kop) p.image(kop, 1440 * TWIP, 1440 * TWIP - 647700 * EMU, 5895975 * EMU, 1089025 * EMU);
  const S = 11;
  /* Dua paragraf kosong (kop + spasi) sebelum judul. Di Word judul sedikit
     tertutup tepi bawah kop; di sini judul tidak boleh tertutup. */
  p.y = 1440 * TWIP - 647700 * EMU + 1089025 * EMU + KOP_GAP;
  const ke = inp.kind === "sp1" ? "1" : "2";
  p.line([{ text: `SURAT PERINGATAN ${ke}`, style: "bold", underline: true }], { size: S, align: "center" });
  p.line([{ text: `No ${inp.no}` }], { size: S, align: "center" });
  p.blank(S); p.blank(S);
  p.line([{ text: "Surat peringatan ini diberikan Kepada :" }], { size: S, spacing: 1.5 });
  p.blank(S, 1.5);
  // "Nama\t\t:" dengan tab bawaan 0,5" -> titik dua di 1" dari margin.
  p.field("Nama", inp.nama, { size: S, spacing: 1.5, tab: 2 * 12.7 });
  p.field("Jabatan", inp.jabatan, { size: S, spacing: 1.5, tab: 2 * 12.7 });
  p.blank(S, 1.5);
  p.para(`Sehubungan kinerja Saudara sebagai karyawan yang harus mematuhi dan melaksanakan semua kewajiban dan tata tertib serta disiplin dalam bekerja yang harus saudara laksanakan sepunuhnya. Maka, dengan ini kami memberikan Surat Peringatan Ke-${ke} Kepada Saudara atas tindakan penyimpangan yang telah di lakukan oleh saudara sebagai berikut :`, { size: S, spacing: 1.5, justify: true });
  p.blank(S, 1.5);
  const items = inp.pelanggaran.length > 0 ? inp.pelanggaran : ["-"];
  for (const it of items) {
    // ListParagraph Word: butir pada 0,25", teks tebal pada 0,5" (+ indent 0,5").
    const lh = single(S) * 1.5;
    const base = p.y + lh - single(S) * 0.22;
    pdf.setFont("times", "normal"); pdf.setFontSize(S);
    pdf.text("•", 1440 * TWIP + 6.35 + 6.35, base);
    p.y -= 0;
    const save = p.y;
    p.para(it, { size: S, spacing: 1.5, style: "bold", indent: 19.05 });
    if (p.y === save) p.y += lh;
  }
  p.blank(S, 1.5);
  p.para(ke === "1"
    ? "Jika dalam jangka waktu 1 (Satu) Bulan kedepan sejak Surat Peringatan ini diterbitkan dan ternyata saudara kembali melakukan tindakan pelanggaran yang sama, maka kami akan mengeluarkan Surat Peringatan yang kedua."
    : "Jika dalam jangka waktu 1 (Satu) Bulan kedepan sejak Surat Peringatan ini diterbitkan dan ternyata saudara kembali melakukan tindakan pelanggaran yang sama, maka kami akan mengeluarkan Surat Peringatan yang Terakhir atau PHK",
  { size: S, spacing: 1.5, justify: true });
  p.blank(S, 1.5);
  p.para("Demikian surat ini kami sampaikan dan berlaku selama menjadi karyawan PT. SYUKUR BERSAUDARA Kepada yang bersangkutan harap di perhatikan dan di perbaiki dengan segera.", { size: S, spacing: 1.5, justify: true });
  p.blank(S, 1.5); p.blank(S, 1.5);
  const ind = 5103 * TWIP;
  p.line([{ text: `Samarinda, ${longDate(inp.tanggal)}` }], { size: S, spacing: 1.5, align: "center", indent: ind });
  p.line([{ text: "PT SYUKUR BERSAUDARA", style: "bold" }], { size: S, spacing: 1.5, align: "center", indent: ind });
  p.blank(S, 1.5); p.blank(S, 1.5); p.blank(S, 1.5);
  p.line([{ text: "Management", style: "bold", underline: true }], { size: S, spacing: 1.5, align: "center", indent: ind });
  spFooter(p);
}

/* Footer alamat gaya Surat Peringatan (10 pt, rata tengah, tanpa garis). Catatan
   CTO 21 Okt: Surat Pengalaman Kerja & Surat Keterangan Bekerja memakai footer
   ini juga, bukan footer berkotak dari template lamanya. */
function spFooter(p: Pen): void {
  const F = 10;
  p.toFooter(4, F);
  p.line([{ text: "Kantor : Jl. Mulawarman no. 23 Tlp. (0541) 742529 Fax. (0541) 731034 Samarinda" }], { size: F, align: "center" });
  p.line([{ text: "Shipyard : Jl. Olah bebaya Kampung tengah Pulau atas (Samarinda ilir)" }], { size: F, align: "center" });
  p.line([{ text: "Email: " }, { text: "Syukurbersaudara@gmail.com", color: ACCENT, underline: true }], { size: F, align: "center" });
  p.line([{ text: "Web: www.syukurbersaudara.com" }], { size: F, align: "center" });
}

function phkLetter(p: Pen, inp: HrLetterInput): void {
  // Template: Letter, margin 25,4 mm, Times 12 pt; kop di header (dipipihkan).
  const kop = kopDataUrl();
  if (kop) p.image(kop, 1440 * TWIP - 318053 * EMU, 720 * TWIP - 290223 * EMU, 6591631 * EMU, 628153 * EMU);
  const S = 12;
  const after = 10; // spasi setelah paragraf bawaan dokumen (200 twip)
  p.y = 720 * TWIP - 290223 * EMU + 628153 * EMU + KOP_GAP;
  p.line([{ text: `Nomor : ${inp.no}` }], { size: S, spacing: 1.5 });
  p.line([{ text: "Perihal : Surat Pemutusan Hubungan Kerja" }], { size: S, spacing: 1.5, after });
  p.line([{ text: "Kepada Yth," }], { size: S, spacing: 1.5, after });
  p.line([{ text: `Sdr. ${inp.nama}` }], { size: S, spacing: 1.5 });
  p.line([{ text: "Di-Tempat" }], { size: S, spacing: 1.5 });
  p.blank(S, 1.5);
  const alasan = inp.pelanggaran.join(", ").trim() || "ketidakhadiran tanpa adanya konfirmasi";
  p.para(`Dengan Hormat, Sehubungan dengan Saudara masih melakukan pelanggaran disiplin berupa ${alasan}.`, { size: S, spacing: 1.5, justify: true, after });
  p.para(`Dengan demikian, terhitung mulai tanggal ${tanggalTerbilang(inp.tanggalEfektif || inp.tanggal)} hubungan kerja antara PT. SYUKUR BERSAUDARA dengan Sdr. ${inp.nama} dinyatakan sudah berakhir. Dan atas nama lembaga, kami menyampaikan banyak terima kasih atas kinerja yang Saudara berikan selama ini.`, { size: S, spacing: 1.5, justify: true, after });
  p.para("Demikian surat pemutusan hubungan kerja ini kami sampaikan, dan agar dapat dimaklumi, terima kasih.", { size: S, spacing: 1.5, justify: true, after });
  p.line([{ text: `Samarinda, ${longDate(inp.tanggal)}` }], { size: S, spacing: 1.5, after });
  p.blank(S); p.blank(S); p.blank(S);
  p.line([{ text: inp.penandaTangan, underline: true }], { size: S });
  p.line([{ text: inp.jabatanPenandaTangan || "HR" }], { size: S });
  const F = 10;
  p.toFooter(4, F);
  p.line([{ text: "Kantor : Jl. Mulawarman  no. 23  tlp. (0541) 742529 Fax. (0541) 731034 Samarinda" }], { size: F, align: "center" });
  p.line([{ text: "Shipyard : Jl. Olah bebaya Kampung tengah Pulau atas (Samarinda ilir) tlp. (0541) 6246750" }], { size: F, align: "center" });
  p.line([{ text: "Email : " }, { text: "syukurbersaudara@gmail.com", underline: true }], { size: F, align: "center" });
  p.line([{ text: "Web : " }, { text: "www.syukurbersaudara.com", underline: true }], { size: F, align: "center" });
}

function pengalamanLetter(p: Pen, inp: HrLetterInput): void {
  // Template: A4, margin 25,4 mm, Times 12 pt, judul 16 pt.
  const kop = kopDataUrl();
  if (kop) p.image(kop, 1440 * TWIP - 66675 * EMU, 1440 * TWIP - 742950 * EMU, 5924550 * EMU, 1114425 * EMU);
  const S = 12;
  p.y = 1440 * TWIP - 742950 * EMU + 1114425 * EMU + KOP_GAP;
  p.line([{ text: "SURAT  PENGALAMAN  KERJA", style: "bold", underline: true }], { size: 16, align: "center" });
  p.blank(11); p.blank(11); p.blank(11);
  const auto = 14 * PT; // afterAutospacing ~ 14 pt
  p.line([{ text: "Kepada yang berkepentingan," }], { size: S, after: 14 });
  const tab = 567 * TWIP; // tab kustom template
  p.field("No", inp.no, { size: S, spacing: 1.15, tab });
  p.field("Hal", "Surat Pengalaman Kerja", { size: S, spacing: 1.15, tab });
  p.y += auto;
  p.line([{ text: "Dengan ini kami dari " }, { text: "PT. SYUKUR BERSAUDARA", style: "bold" }, { text: " menyatakan bahwa :" }], { size: S, after: 14 });
  const tab2 = 1134 * TWIP;
  p.field("Nama", inp.nama, { size: S, spacing: 1.15, tab: tab2 });
  p.field("Alamat", inp.alamat || "-", { size: S, spacing: 1.15, tab: tab2 });
  p.field("Jabatan", inp.jabatan, { size: S, spacing: 1.15, tab: tab2 });
  p.blank(S);
  p.line([{ text: "Telah benar-benar bekerja pada perusahaan kami dalam kurun waktu :" }], { size: S, after: 14 });
  const mulai = inp.tanggalMulai ? longDate(inp.tanggalMulai) : "-";
  const selesai = longDate(inp.tanggalSelesai || inp.tanggal);
  p.line([{ text: ` ${mulai} sampai dengan ${selesai}`, style: "bolditalic" }], { size: S, after: 14 });
  p.para("Yang bersangkutan telah memberikan konstribusi yang baik bagi perusahaan dan selama bergabung tidak pernah melakukan tindakan yang merugikan perusahaan kami.", { size: S, spacing: 1.15, after: 14 });
  p.para("Kami berterima kasih atas segala kerjasama, konstribusi dan segala upaya yang telah diberikan guna perkembangan perusahaan yang lebih baik.", { size: S, spacing: 1.15, justify: true, after: 14 });
  p.blank(S, 1.15);
  const dateX = 7 * 12.7; // 7 tab bawaan (0,5")
  p.line([{ text: `Samarinda, ${longDate(inp.tanggal)}` }], { size: S, spacing: 1.15, indent: dateX });
  p.line([{ text: "PT. Syukur Bersaudara", style: "bold" }], { size: S, spacing: 1.15, indent: dateX });
  p.blank(S, 1.15); p.blank(S, 1.15); p.blank(S, 1.15);
  p.line([{ text: inp.penandaTangan, style: "bold", underline: true }], { size: S, spacing: 1.15, indent: 12.7 });
  p.line([{ text: inp.jabatanPenandaTangan || "HR", style: "bold" }], { size: S, spacing: 1.15, indent: 12.7 });
  spFooter(p);
}

function keteranganLetter(p: Pen, inp: HrLetterInput): void {
  // Template: A4, margin 20 mm, Times 12 pt; footer mengikuti Surat Peringatan.
  const kop = kopDataUrl();
  const m = 1134 * TWIP;
  if (kop) p.image(kop, m + 53340 * EMU, 7.2, 6305550 * EMU, 1112520 * EMU);
  const S = 12;
  p.y = 7.2 + 1112520 * EMU + KOP_GAP;
  p.line([{ text: "SURAT KETERANGAN", style: "bold", underline: true }], { size: S, align: "center" });
  p.line([{ text: `Nomor : ${inp.no}`, style: "bold" }], { size: S, align: "center" });
  p.blank(S, 1.15);
  p.line([{ text: "Bersama ini kami menyatakan bahwa :" }], { size: S, spacing: 1.15 });
  p.blank(S, 1.15);
  /* Tab kustom 1965 twip menghapus tab bawaan di kirinya; tiga tab dari label
     mana pun berakhir di 2880 twip (2"), sama dengan indent gantung Alamat. */
  const tab = 2880 * TWIP;
  p.field("Nama", inp.nama, { size: S, spacing: 1.5, tab });
  p.field("Tempat/Tgl Lahir", inp.tempatTanggalLahir || "-", { size: S, spacing: 1.5, tab });
  p.field("Jenis Kelamin", inp.jenisKelamin || "-", { size: S, spacing: 1.5, tab });
  p.field("Alamat", inp.alamat || "-", { size: S, spacing: 1.5, tab });
  p.field("Agama", inp.agama || "-", { size: S, spacing: 1.5, tab });
  p.field("Status", inp.statusKawin || "-", { size: S, spacing: 1.5, tab });
  p.blank(S, 1.15);
  const sejak = longDate(inp.tanggalMulai || inp.tanggal);
  p.line([{ text: "Benar bekerja sebagai karyawan di " }, { text: "PT. SYUKUR BERSAUDARA", style: "bold" }, { text: ` sejak ${sejak}` }], { size: S, spacing: 1.5 });
  p.line([{ text: `sampai dengan sekarang, dengan jabatan ${inp.jabatan}.` }], { size: S, spacing: 1.5 });
  p.para("Demikian surat keterangan ini kami buat agar dipergunakan sebagaimana mestinya.", { size: S, spacing: 1.15 });
  p.blank(S, 1.15); p.blank(S, 1.15);
  const ind = 5760 * TWIP;
  p.line([{ text: `Samarinda, ${longDate(inp.tanggal)}` }], { size: S, spacing: 1.15, align: "center", indent: ind });
  p.line([{ text: "PT. Syukur Bersaudara", style: "bold" }], { size: S, spacing: 1.15, align: "center", indent: ind });
  p.blank(S, 1.15); p.blank(S, 1.15); p.blank(S, 1.15);
  p.line([{ text: inp.penandaTangan, style: "bold", underline: true }], { size: S, spacing: 1.15, align: "center", indent: ind });
  p.line([{ text: inp.jabatanPenandaTangan || "HRD", style: "bold" }], { size: S, spacing: 1.15, align: "center", indent: ind });
  spFooter(p);
}

/** Satu halaman surat sebagai satu blok tak terpecah. */
function letterBlock(inp: HrLetterInput, left: number, right: number): Block {
  return {
    plan: (ctx) => ({
      splittable: false,
      segments: [{
        height: ctx.bottom - ctx.y0 - 0.5,
        draw: (c, rec) => {
          const p = new Pen(c.pdf, rec, left, right, 0);
          if (inp.kind === "sp1" || inp.kind === "sp2") spLetter(p, c.pdf, inp);
          else if (inp.kind === "phk") phkLetter(p, inp);
          else if (inp.kind === "pengalaman") pengalamanLetter(p, inp);
          else keteranganLetter(p, inp);
          c.pdf.setTextColor(0, 0, 0);
        },
      }],
    }),
  };
}

const TITLES: Record<HrLetterKind, string> = {
  sp1: "Surat Peringatan 1",
  sp2: "Surat Peringatan 2",
  phk: "Surat Pemutusan Hubungan Kerja",
  pengalaman: "Surat Pengalaman Kerja",
  keterangan: "Surat Keterangan",
};

export function hrLetterDoc(inp: HrLetterInput, opts: DocOptions = {}): Document {
  const isLetter = inp.kind === "phk";
  /* Margin dokumen kecil: margin asli template dipakai di dalam blok. Batas
     kanan = lebar kertas - margin kanan template. */
  const pageW = isLetter ? 215.9 : 210;
  const marginRight = inp.kind === "sp1" || inp.kind === "sp2" ? 1134 * TWIP : inp.kind === "keterangan" ? 1134 * TWIP : 1440 * TWIP;
  const left = inp.kind === "keterangan" ? 1134 * TWIP : 1440 * TWIP;
  const d = new Document({
    format: isLetter ? "letter" : "a4",
    marginMm: 6,
    title: `${TITLES[inp.kind]} ${inp.no}`,
    subject: `${TITLES[inp.kind]} - ${inp.nama}`,
    footer: () => "",
    addressFooter: false,
    ...opts,
  });
  d.add(letterBlock(inp, left, pageW - marginRight));
  return d;
}

/** Petakan jenis surat aplikasi ke template. null = bukan surat bertemplate. */
export function hrLetterKindOf(jenis: string): HrLetterKind | null {
  const j = jenis.trim();
  if (/pengalaman/i.test(j)) return "pengalaman";
  if (/keterangan/i.test(j)) return "keterangan";
  if (/pemutusan|phk/i.test(j)) return "phk";
  // SP3 = surat pemutusan kerja (catatan CTO 19 Okt: "ini surat pemutusan kerja nya / sp3").
  if (/^SP\s*3$/i.test(j) || /peringatan\s*(ke-?)?\s*3/i.test(j)) return "phk";
  if (/^SP\s*2$/i.test(j) || /peringatan\s*(ke-?)?\s*2/i.test(j)) return "sp2";
  if (/^SP\s*1$/i.test(j) || /peringatan/i.test(j)) return "sp1";
  return null;
}
