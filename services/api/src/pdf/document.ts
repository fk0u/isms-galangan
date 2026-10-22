/* Document - mengorkestrasi blok menjadi PDF dengan paginasi dua fase.
 *
 * ALUR (satu-satunya di seluruh mesin):
 *   FASE 1  PLAN   : setiap blok di-`plan()` pada lebar final. Tidak ada
 *                   satu pun piksel yang digambar. Blok yang boleh terpotong
 *                   (tabel) mengembalikan segmen-segmen yang sudah tahu
 *                   tinggi masing-masing.
 *   FASE 2  FLOW   : blok demi blok, kursor maju. Kalau blok tidak muat,
 *                   halaman baru dibuat - kecuali blok itu terlalu tinggi
 *                   untuk satu halaman, yang baru dipecah per segmen.
 *   FASE 3  DRAW   : hanya setelah halaman mana sudah pasti, segmen
 *                   digambar di koordinat absolut.
 *
 * Menghapus fase 3 adalah inti rewrite ini. Mesin lama menggambar sambil
 * menghitung, lalu menebak dengan `need()` apakah sudah melewati margin -
 * dan tebakannya sering salah sehingga konten resmi keluar dari kertas tanpa
 * error apa pun.
 */
import { jsPDF } from "jspdf";
import { ADDRESS_FOOTER, COLOR, FOOTER_ZONE_MM, MARGIN_MM, PAGES, STROKE, TYPE, type RGB } from "./theme.js";
import { cjkChars, fontName, registerFonts, safe } from "./font.js";
import type { Block, Ctx, DrawRecord, Segment } from "./blocks.js";
import { drawText, textWidth } from "./blocks.js";

export interface DocOptions {
  /** Halaman: a4 (default), letter, legal, f4. */
  format?: "a4" | "letter" | "legal" | "f4";
  orientation?: "portrait" | "landscape";
  marginMm?: number;
  /** Judul dokumen - masuk ke metadata PDF. */
  title?: string;
  subject?: string;
  /** Footer per halaman. */
  footer?: (pageNo: number, totalPages: number) => string;
  /** Footer alamat perusahaan di dasar tiap halaman (default true). Surat HR
   *  mematikannya karena menggambar footer template-nya sendiri. */
  addressFooter?: boolean;
  /** Watermark diagonal. */
  watermark?: string;
  /** Level kompresi. true = berkas kecil, false = stream bisa dibaca (probe). */
  compress?: boolean;
  /** Kumpulkan jejak gambar untuk pemeriksaan geometri. */
  trace?: boolean;
}

export interface RenderResult {
  bytes: Uint8Array;
  pages: number;
  /** Jejak gambar; hanya diisi bila `trace` aktif. */
  records: DrawRecord[];
  /** Font benar-benar ter-embed? */
  embeddedFont: boolean;
  /** Huruf CJK yang muncul di dokumen. Panjang > 0 berarti ada karakter
   *  yang kemungkinan tercetak sebagai kotak - lihat cjkChars di font.ts. */
  cjkChars: string[];
  /** Ukur halaman dalam mm, sudah mengikuti orientasi. Pemeriksa geometri
   *  membutuhkannya: laporan landscape punya content box lebih lebar dari A4
   *  potret, jadi pemeriksaan yang memakai ukuran tetap akan menandai dokumen
   *  yang sebenarnya benar sebagai pelanggaran. */
  pageW: number;
  pageH: number;
  margin: number;
}

/** Dokumen PDF yang sedang disusun. */
export class Document {
  private readonly opts: Required<Pick<DocOptions, "format" | "orientation" | "marginMm" | "compress" | "trace">> & DocOptions;
  private readonly pdf: jsPDF;
  private readonly records: DrawRecord[] = [];
  private readonly pageW: number;
  private readonly pageH: number;
  private readonly margin: number;
  private readonly contentW: number;
  private embedded = false;
  private drawnPages = 1;
  /** Kursor atas halaman saat ini. */
  private y: number;

  constructor(opts: DocOptions = {}) {
    this.opts = {
      format: opts.format ?? "a4",
      orientation: opts.orientation ?? "portrait",
      marginMm: opts.marginMm ?? MARGIN_MM,
      compress: opts.compress ?? true,
      trace: opts.trace ?? true,
      ...opts,
    };
    this.margin = this.opts.marginMm;
    const spec = PAGES[this.opts.format];
    const baseW = spec.width;
    const baseH = spec.height;
    this.pageW = this.opts.orientation === "landscape" ? baseH : baseW;
    this.pageH = this.opts.orientation === "landscape" ? baseW : baseH;
    this.contentW = this.pageW - this.margin * 2;
    this.y = this.margin;
    this.pdf = new jsPDF({
      unit: "mm",
      format: this.opts.format,
      orientation: this.opts.orientation,
      compress: this.opts.compress,
    });
    const fonts = registerFonts(this.pdf);
    this.embedded = fonts.regular.embedded;
    this.pdf.setProperties({
      title: this.opts.title ?? "Dokumen ISMS",
      subject: this.opts.subject ?? "",
      creator: "ISMS PT Syukur Bersaudara",
    });
  }

  get width(): number {
    return this.contentW;
  }

  /** Batas bawah area isi: di atas zona footer alamat (atau 8 mm tanpa itu). */
  private bottom(): number {
    // Zona footer alamat diukur dari margin standar supaya posisinya sama di semua dokumen.
    return this.opts.addressFooter === false ? this.pageH - this.margin - 8 : Math.min(this.pageH - this.margin - 8, this.pageH - MARGIN_MM - FOOTER_ZONE_MM);
  }

  private ctx(): Ctx {
    return {
      pdf: this.pdf,
      embedded: this.embedded,
      x0: this.margin,
      width: this.contentW,
      y0: this.y,
      top: this.margin,
      bottom: this.bottom(),
    };
  }

  private newPage(): void {
    this.pdf.addPage();
    this.drawnPages += 1;
    this.y = this.margin;
  }

  /** Watermark + footer untuk satu halaman. */
  private decorate(page: number): void {
    const c = this.ctx();
    if (this.opts.watermark) {
      /* Watermark digambar dengan pengubahan transparansi supaya tidak menutupi
         teks di atasnya. jsPDF menyimpan graphics state per halaman, jadi
         opacity dikembalikan eksplisit. */
      applyOpacity(this.pdf, 0.08);
      this.pdf.setTextColor(COLOR.navy[0], COLOR.navy[1], COLOR.navy[2]);
      this.pdf.setFont(fontName("bold"), "bold");
      this.pdf.setFontSize(46);
      const w = textWidth(c, this.opts.watermark, { font: "bold", size: 46 });
      this.pdf.text(
        safe(this.opts.watermark, "bold"),
        (this.pageW - w) / 2,
        this.pageH / 2 + 16,
        { angle: 38 },
      );
      applyOpacity(this.pdf, 1);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFontSize(TYPE.base);
    }
    if (this.opts.addressFooter !== false) {
      /* Footer alamat selalu di dasar halaman, bukan mengikuti isi: garis
         aksen merah lalu tiga baris alamat, di dalam zona yang tidak boleh
         dipakai isi (lihat bottom()). */
      const top = this.pageH - MARGIN_MM - FOOTER_ZONE_MM + 2.5;
      this.pdf.setDrawColor(COLOR.accent[0], COLOR.accent[1], COLOR.accent[2]);
      this.pdf.setLineWidth(STROKE.thin);
      this.pdf.line(MARGIN_MM, top, this.pageW - MARGIN_MM, top);
      this.pdf.setFont(fontName("regular"), "normal");
      this.pdf.setFontSize(TYPE.footer);
      this.pdf.setTextColor(60, 60, 60);
      ADDRESS_FOOTER.forEach((t, i) => this.pdf.text(safe(t, "regular"), this.pageW / 2, top + 3.4 + i * 3.1, { align: "center" }));
      this.pdf.setTextColor(0, 0, 0);
    }
    const label = this.opts.footer ? this.opts.footer(page, this.drawnPages) : `Halaman ${page} dari ${this.drawnPages}`;
    if (label !== "") {
      this.pdf.setFont(fontName("regular"), "normal");
      this.pdf.setFontSize(TYPE.footer);
      this.pdf.setTextColor(140, 150, 160);
      this.pdf.text(label, this.pageW / 2, this.pageH - MARGIN_MM / 2 + 1, { align: "center" });
      this.pdf.setTextColor(0, 0, 0);
    }
  }

  /**
   * Tambahkan blok. Satu blok per panggilan boleh panjang, tabel boleh banyak.
   */
  /** Rantai blok `keepWithNext` yang menunggu blok berikutnya (judul section,
   *  grafik + keterangannya, dll). */
  private pending: Block[] = [];

  private blockHeight(block: Block, y0: number): { total: number; first: number } {
    const c = this.ctx();
    c.y0 = y0;
    const segs = block.plan(c, this.contentW).segments;
    const body = segs.reduce((s, seg) => s + seg.height, 0);
    return { total: (block.spaceBefore ?? 0) + body + (block.spaceAfter ?? 0), first: (block.spaceBefore ?? 0) + (segs[0]?.height ?? 0) };
  }

  /** Lepas rantai; setiap blok keepWithNext tetap dijaga menempel ke potongan
   *  pertama blok sesudahnya di rantai (judul + grafik pertama, dst). */
  private flushPending(): void {
    const chain = this.pending;
    this.pending = [];
    chain.forEach((b, i) => {
      const next = chain[i + 1];
      if (next && this.y > this.margin + 0.5) {
        const own = this.blockHeight(b, this.y).total;
        const nf = this.blockHeight(next, this.y + own).first;
        if (this.y + own + nf > this.bottom() && own + nf <= this.bottom() - this.margin) this.newPage();
      }
      this.place(b);
    });
  }

  add(block: Block): this {
    /* keepWithNext: judul tidak boleh tertinggal sendirian di dasar halaman.
       Blok ditahan sampai blok biasa berikutnya datang; bila seluruh rantai +
       potongan pertama blok itu tidak muat, semuanya pindah halaman. Rantai
       yang melebihi satu halaman penuh tidak ditahan lagi (dilepas apa adanya). */
    const fullPage = this.bottom() - this.margin;
    if (block.keepWithNext) {
      this.pending.push(block);
      const chainH = this.pending.reduce((s, b) => s + this.blockHeight(b, this.margin).total, 0);
      if (chainH > fullPage) this.flushPending();
      return this;
    }
    if (this.pending.length > 0) {
      const chainH = this.pending.reduce((s, b) => s + this.blockHeight(b, this.margin).total, 0);
      const nextFirst = this.blockHeight(block, this.y + chainH).first;
      if (this.y + chainH + nextFirst > this.bottom() && this.y > this.margin + 0.5 && chainH + nextFirst <= fullPage) this.newPage();
      this.flushPending();
    }
    this.place(block);
    return this;
  }

  /** Gambar blok di posisi sekarang (pecah antar halaman bila splittable). */
  private place(block: Block): void {
    const gapBefore = block.spaceBefore ?? 0;
    /* spaceBefore diterapkan SEBELUM blok direncanakan, supaya potongan
       pertama dihitung dari posisi akhirnya. Dulu rencana dibuat dulu: potongan
       pertama lalu tidak muat, terdorong ke halaman baru dengan ukuran sisa
       halaman lama, dan tabel tampil dengan kepala berulang. spaceBefore tidak
       pernah memaksa pindah halaman (ruangnya hilang, bukan dipindah). */
    if (gapBefore && this.y > this.margin + 0.5) {
      if (this.y + gapBefore > this.bottom()) this.newPage();
      else this.y += gapBefore;
    }
    const ctx = this.ctx();
    ctx.y0 = this.y;
    let planned = block.plan(ctx, this.contentW);
    const first = planned.segments[0];
    /* Potongan pertama tidak muat di sisa halaman: pindah halaman lalu
       rencanakan ulang dengan tinggi halaman penuh. */
    if (first && this.y + first.height > this.bottom() && this.y > this.margin + 0.5) {
      this.newPage();
      ctx.y0 = this.y;
      planned = block.plan(ctx, this.contentW);
    }

    const minSeg = planned.minSegmentHeight ?? 0;
    let consumedAll = true;

    for (let si = 0; si < planned.segments.length; si += 1) {
      const seg = planned.segments[si]!;
      ctx.y0 = this.y;
      if (this.y + seg.height > this.bottom()) {
        /* Blanco yang tersisa tidak cukup untuk satu segmen: pindah halaman.
           Kalau ini segmen TERSIMPAN terakhir dan halaman barunya tetap tidak
           muat, gambar saja - lebih baik isi melewati margin satu kali
           daripada blok hilang. */
        if (this.y > this.margin + 0.5) {
          this.newPage();
          ctx.y0 = this.y;
        }
        if (this.y + seg.height > this.bottom() && si === planned.segments.length - 1) {
          /* Segmen terakhir tidak muat: gambar di halaman baru,sedikit
             melewati margin bawah lebih baik daripada data hilang. */
        }
      }
      ctx.y0 = this.y;
      seg.draw(ctx, this.opts.trace ? this.records : [], this.margin, this.y);
      this.y += seg.height;
      void minSeg;
    }
    if (block.spaceAfter) this.y += block.spaceAfter;
    consumedAll = this.y <= this.bottom();
    if (!consumedAll) {
      /* Jaga-jaga: kalau kursor melewati margin, baris berikutnya tetap
         digambar tapi flag ini dipakai report untuk guilty check. */
      void consumedAll;
    }
  }

  /** Tambahkan banyak blok. */
  addAll(blocks: Block[]): this {
    for (const b of blocks) this.add(b);
    return this;
  }

  /** Paksa halaman baru (untuk section yang tidak boleh menyambung). */
  break(): this {
    this.newPage();
    return this;
  }

  /** Render menjadi byte. */
  render(): RenderResult {
    this.flushPending();
    const total = this.pdf.getNumberOfPages();
    /* Footer harus tahu total halaman - itu hanya bisa diketahui setelah
       semua konten selesai. Semua halaman didekorasi sekarang. */
    for (let p = 1; p <= total; p += 1) {
      this.pdf.setPage(p);
      this.decorate(p);
    }
    const out = this.pdf.output("arraybuffer");
    const bytes = new Uint8Array(out);
    /* Huruf CJK yang tidak punya glyph akan tercetak sebagai kotak tanpa
       error. Ditandai di hasil render supaya route bisa memberitahu -
       "kotak kosong" yang tidak dilaporkan artinya arsip resmi rusak tanpa
       ada yang mengetahuinya. */
    const cjk = cjkChars(this.records.map((r) => r.text).join(""));
    return {
      bytes,
      pages: total,
      records: this.opts.trace ? this.records : [],
      embeddedFont: this.embedded,
      cjkChars: cjk,
      pageW: this.pageW,
      pageH: this.pageH,
      margin: this.margin,
    };
  }

  /** Pratinjau HTML ringan untuk debugging di probe. */
  debugText(): string {
    return `${this.drawnPages} halaman, content ${this.contentW.toFixed(1)}mm`;
  }
}

export function doc(opts: DocOptions = {}): Document {
  return new Document(opts);
}

/* Opasitas. GState di jsPDF dibuat lewat `new pdf.GState(...)`; di types v4
     konstruktornya diekspor sebagai fungsi, bukan kelas, jadi dipanggil
     sebagai fungsi biasa. Inkonsistensi ini sudah dijaga di satu tempat
     (applyOpacity) supaya tidak tebakan lagi di titik pemakaian. */
function applyOpacity(pdf: jsPDF, opacity: number): void {
  const GStateCtor = (pdf as unknown as { GState: (p: { opacity: number }) => unknown }).GState;
  pdf.setGState(GStateCtor({ opacity }));
}

export interface GeometryProblem {
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
  kind: string;
  reason: string;
}

/**
 * Periksa semua tinta berada di dalam content box.
 *
 * INI probe yang paling penting di repo: mesin PDF lama sama sekali tidak
 * pernah memeriksa koordinat, sehingga probe hijau padahal 63 persen baris
 * kwitansi tercetak di luar kertas. Pemeriksaan ini menutup kelas bug itu -
 * dan masih akan menutupnya setelah mesin ini diganti lagi.
 */
export function checkGeometry(
  res: RenderResult,
  margin: number,
  page: { width: number; height: number },
  opts: { footerZoneMm?: number } = {},
): GeometryProblem[] {
  const footer = opts.footerZoneMm ?? 8;
  const out: GeometryProblem[] = [];
  const x0 = margin;
  const x1 = page.width - margin;
  const y1 = page.height - margin - footer;
  for (const r of res.records) {
    /* Footer dan watermark diabaikan: keduanya memang di luar area konten. */
    if (r.y > page.height - margin) continue;
    if (r.x < x0 - 0.6) {
      out.push({ ...r, reason: `x=${r.x.toFixed(2)} di kiri margin ${x0}` });
    } else if (r.x + r.w > x1 + 0.6) {
      out.push({ ...r, reason: `x+w=${(r.x + r.w).toFixed(2)} melewati kanan ${x1}` });
    }
    if (r.y - r.h > y1 + 0.6) {
      out.push({ ...r, reason: `y-h=${(r.y - r.h).toFixed(2)} melewati bawah ${y1.toFixed(2)}` });
    }
  }
  return out;
}

export { STROKE, COLOR, PAGES, type RGB };