/* Dokumen HR: surat persetujuan cuti/izin dan surat HR (SP1/SP2/SP3).
 *
 * Permintaan client 2 Oktober untuk surat persetujuan cuti: "generate surat
 * persetujuan cuti/izin berdasarkan nama, tipe pengajuan, durasi, dari dan
 * sampai kapan, dll." Semua field itu ada di baris `leaves` - yang belum ada
 * adalah dokumennya, jadi factory ini merakit dari data itu apa adanya,
 * tidak menebak dan tidak membaca dari layar.
 *
 * Surat persetujuan adalah dokumen yang dibaca karyawan, jadi dua hal
 * dijaga: nama dan tanggal pengajuan HARUS tercetak (surat tanpa nama tidak
 * berlaku), dan durasi harus terhitung sendiri dari tanggal - bukan
 * menampilkan angka yang diketik user, karena angka itulah yang paling sering
 * tidak sinkron dengan rentang tanggal.
 */
import { Document, type DocOptions } from "../document.js";
import { keyValue, paragraph, signatures, divider, callout } from "../blocks.js";
import { TYPE } from "../theme.js";
import { companyKop, docTitle, longDate, shortDate, L, type Locale } from "./shared.js";

export interface CutiDocInput {
  no: string;
  /** Nama lengkap karyawan. */
  nama: string;
  /** NIK / NIP. */
  nik: string;
  jabatan: string;
  unit: string;
  /** "Tahunan" | "Sakit" | "Izin" | "Melahirkan" | "Lainnya". */
  tipe: string;
  from: string;
  to: string;
  /** Alasan; boleh kosong. */
  alasan: string;
  /** Nama & jabatan pemberi persetujuan HRD. */
  approverNama: string;
  approverJabatan: string;
  /** Tanggal persetujuan. */
  tanggalPersetujuan: string;
  locale?: Locale;
}

/** Jumlah hari inklusif antara dua tanggal ISO; 0 bila tidak valid. */
export function durationDays(from: string, to: string): number {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(from ?? ""));
  const b = /^(\d{4})-(\d{2})(-(\d{2}))?/.exec(String(to ?? ""));
  if (!a || !b) return 0;
  const start = Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  const end = Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3] ?? "01"));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

export function suratPersetujuanCutiDoc(input: CutiDocInput, opts: DocOptions = {}): Document {
  const locale = input.locale ?? "id";
  const days = durationDays(input.from, input.to);
  const d = new Document({
    title: `Surat Persetujuan Cuti/Izin ${input.no}`,
    subject: "Persetujuan pengajuan cuti dan izin",
    ...opts,
  });

  d.add(companyKop());
  d.add(
    docTitle({
      title: L(locale, "SURAT PERSETUJUAN CUTI/IZIN", "LEAVE/PERMISSION APPROVAL LETTER"),
      ref: `${L(locale, "No", "No")}. ${input.no}`,
    }),
  );

  d.add(
    paragraph({
      text: L(
        locale,
        "Yang bertanda tangan di bawah ini menerangkan bahwa:",
        "The undersigned hereby certifies that:",
      ),
      size: TYPE.base,
    }),
  );

  d.add(
    keyValue({
      labelW: 40,
      pairs: [
        { label: L(locale, "Nama", "Name"), value: input.nama, bold: true },
        { label: "NIK/NIP", value: input.nik },
        { label: L(locale, "Jabatan", "Position"), value: input.jabatan },
        { label: L(locale, "Unit Kerja", "Work Unit"), value: input.unit },
      ],
    }),
  );

  d.add(divider());

  d.add(
    paragraph({
      text: L(locale, "Telah disetujui pengajuan:", "The following request has been approved:"),
      size: TYPE.base,
      font: "bold",
    }),
  );

  d.add(
    keyValue({
      labelW: 40,
      pairs: [
        { label: L(locale, "Jenis", "Type"), value: input.tipe, bold: true },
        { label: L(locale, "Periode", "Period"), value: `${shortDate(input.from)} - ${shortDate(input.to)}` },
        { label: L(locale, "Durasi", "Duration"), value: `${days} ${L(locale, "hari", "days")}`, bold: true },
        { label: L(locale, "Alasan", "Reason"), value: input.alasan || "-" },
      ],
    }),
  );

  if (input.alasan.trim() !== "") {
    d.add(
      callout([
        L(
          locale,
          "Surat ini diterbitkan sebagai bukti persetujuan resmi. Karyawan yang bersangkutan diharapkan menyelesaikan tugas-tugas yang tertunda sebelum meninggalkan pekerjaan.",
          "This letter is issued as proof of official approval. The employee is expected to complete pending tasks before leaving work.",
        ),
      ]),
    );
  }

  d.add(divider());

  d.add(
    paragraph({
      text: L(
        locale,
        `Demikian surat persetujuan ini diterbitkan pada ${longDate(input.tanggalPersetujuan)} untuk dipergunakan sebagaimana mestinya.`,
        `This approval letter is issued on ${longDate(input.tanggalPersetujuan)} for proper use.`,
      ),
      size: TYPE.base,
    }),
  );

  d.add(
    signatures([
      { role: L(locale, "Disetujui oleh", "Approved by"), name: input.approverNama, rows: 4 },
    ]),
  );

  d.add(
    paragraph({
      text: `${input.approverNama}\n${input.approverJabatan}`,
      size: TYPE.base - 1,
      align: "right",
    }),
  );

  return d;
}

/* ==========================================================================
   Surat Peringatan (SP1/SP2/SP3)
   ========================================================================== */

export interface SuratHrInput {
  no: string;
  tanggal: string;
  /** "SP 1" | "SP 2" | "SP 3" | "Pemutusan Hubungan Kerja (PHK)" | "Surat Pengalaman Kerja" | "Surat Keterangan Bekerja" | "Mutasi" | dll. */
  jenis: string;
  namaKaryawan: string;
  nik: string;
  jabatan: string;
  unit: string;
  /** Pelanggaran yang dilakukan atau alasan pemutusan/keterangan. */
  pelanggaran: string;
  /** Tanggal pelanggaran. */
  tanggalPelanggaran: string;
  /** Tindakan yang diambil. */
  tindakan: string;
  /** Berlaku sampai kapan (untuk SP dengan masa berlaku atau tanggal efektif PHK). */
  berlakuSampai?: string;
  namaPemberi: string;
  jabatanPemberi: string;
  /** Terisi hanya untuk surat kontrak / perpanjangan (F3-L-05). */
  kontrak?: { nomor: string; mulai: string; selesai: string; sebelumnya?: string; tipe: string };
  alamat?: string;
  tempatTanggalLahir?: string;
  jenisKelamin?: string;
  agama?: string;
  statusKawin?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  locale?: Locale;
}


/* Surat kontrak memakai badan surat sendiri: template SP berbicara tentang
   pelanggaran, dan mencetak kontrak dengan kalimat itu menyesatkan. */
function kontrakBody(d: Document, input: SuratHrInput, locale: Locale): void {
  const k = input.kontrak!;
  d.add(
    paragraph({
      text: k.sebelumnya
        ? L(locale,
          "Dengan ini perusahaan memperpanjang perjanjian kerja dengan karyawan berikut:",
          "The company hereby extends the employment agreement with the following employee:")
        : L(locale,
          "Dengan ini perusahaan mengikat perjanjian kerja dengan karyawan berikut:",
          "The company hereby enters into an employment agreement with the following employee:"),
      size: TYPE.base,
    }),
  );
  d.add(
    keyValue({
      labelW: 44,
      pairs: [
        { label: L(locale, "Nama", "Name"), value: input.namaKaryawan, bold: true },
        { label: L(locale, "NIK", "Employee no."), value: input.nik },
        { label: L(locale, "Jabatan / Unit", "Position / Unit"), value: `${input.jabatan} - ${input.unit}` },
        { label: L(locale, "Tipe karyawan", "Employment type"), value: k.tipe },
        { label: L(locale, "No. kontrak", "Contract no."), value: k.nomor, bold: true },
        { label: L(locale, "Berlaku mulai", "Valid from"), value: longDate(k.mulai) },
        { label: L(locale, "Berlaku sampai", "Valid until"), value: longDate(k.selesai), bold: true },
        ...(k.sebelumnya
          ? [{ label: L(locale, "Menggantikan kontrak", "Supersedes contract"), value: k.sebelumnya }]
          : []),
      ],
    }),
  );
  if (input.pelanggaran !== "-" && input.pelanggaran.trim() !== "") {
    d.add(divider());
    d.add(paragraph({ text: input.pelanggaran, size: TYPE.base }));
  }
  d.add(
    signatures([
      { role: L(locale, "Karyawan", "Employee"), name: input.namaKaryawan, rows: 4 },
      { role: L(locale, "Perusahaan", "Company"), name: input.namaPemberi, rows: 4 },
    ]),
  );
}





export function suratHrDoc(input: SuratHrInput, opts: DocOptions = {}): Document {
  const locale = input.locale ?? "id";
  /* SP, PHK, Pengalaman Kerja, dan Surat Keterangan dicetak lewat hrLetter.ts
     (format template Word klien). Fungsi ini menangani kontrak & surat lain. */
  let docJudul = input.jenis.toUpperCase();
  const refLabel = `${L(locale, "No", "No")}. ${input.no}`;
  if (input.kontrak) {
    docJudul = input.kontrak.sebelumnya
      ? L(locale, "SURAT PERPANJANGAN KONTRAK KERJA", "EMPLOYMENT CONTRACT EXTENSION")
      : L(locale, "SURAT PERJANJIAN KERJA", "EMPLOYMENT AGREEMENT");
  }

  const d = new Document({
    title: `${docJudul} ${input.no}`,
    subject: `${docJudul} - ${input.namaKaryawan}`,
    ...opts,
  });

  d.add(companyKop());
  d.add(
    docTitle({
      title: docJudul,
      ref: refLabel,
    }),
  );

  if (input.kontrak) {
    kontrakBody(d, input, locale);
    return d;
  }
  d.add(
    paragraph({
      text: L(locale, "Kepada Yth,", "To,"),
      size: TYPE.base,
    }),
  );
  d.add(
    paragraph({
      text: input.namaKaryawan,
      size: TYPE.base,
      font: "bold",
    }),
  );
  d.add(
    paragraph({
      text: `${input.jabatan} - ${input.unit}`,
      size: TYPE.base - 1,
    }),
  );

  d.add(divider());

  d.add(
    paragraph({
      text: L(
        locale,
        "Dengan ini kami sampaikan bahwa berdasarkan evaluasi terhadap kinerja dan perilaku Saudara, ditemukan pelanggaran sebagai berikut:",
        "We hereby inform you that based on evaluation of your performance and conduct, the following violation has been found:",
      ),
      size: TYPE.base,
    }),
  );

  d.add(
    keyValue({
      labelW: 40,
      pairs: [
        { label: L(locale, "Jenis Pelanggaran", "Violation Type"), value: input.pelanggaran, bold: true },
        { label: L(locale, "Tanggal", "Date"), value: longDate(input.tanggalPelanggaran) },
        { label: L(locale, "Tindakan", "Action"), value: input.tindakan, bold: true },
      ],
    }),
  );

  if (input.berlakuSampai) {
    d.add(
      callout([
        L(
          locale,
          `Surat peringatan ini berlaku hingga ${longDate(input.berlakuSampai)}. Apabila dalam masa tersebut Saudara mengulangi pelanggaran yang sama atau melakukan pelanggaran lain, maka akan dikenakan tindakan yang lebih tegas.`,
          `This warning letter is valid until ${longDate(input.berlakuSampai)}. If you repeat the same violation or commit another violation during this period, stricter action will be taken.`,
        ),
      ]),
    );
  }

  d.add(divider());

  d.add(
    paragraph({
      text: L(
        locale,
        "Kami mengharapkan Saudara dapat memperbaiki kinerja dan perilaku sesuai dengan ketentuan yang berlaku di perusahaan. Demikian surat ini disampaikan untuk menjadi perhatian dan dilaksanakan sebagaimana mestinya.",
        "We expect you to improve your performance and conduct in accordance with company regulations. This letter is conveyed for your attention and proper implementation.",
      ),
      size: TYPE.base,
    }),
  );

  d.add(
    signatures([
      { role: L(locale, "Hormat kami", "Sincerely"), name: input.namaPemberi, rows: 4 },
    ]),
  );

  d.add(
    paragraph({
      text: `${input.namaPemberi}\n${input.jabatanPemberi || "HRD"}`,
      size: TYPE.base - 1,
      align: "right",
    }),
  );

  return d;
}