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
import { keyValue, paragraph, table, signatures, divider, callout, spacer, type Block } from "../blocks.js";
import { COLOR, TYPE } from "../theme.js";
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

function hrCompanyFooter(): Block {
  return paragraph({
    text: "Kantor : Jl. Mulawarman no. 23 Tlp. (0541) 742529 Fax. (0541) 731034 Samarinda\nShipyard : Jl. Olah bebaya Kampung tengah Pulau atas (Samarinda ilir)\nEmail: Syukurbersaudara@gmail.com · Web: www.syukurbersaudara.com",
    size: TYPE.base - 2,
    color: COLOR.steel,
    align: "center",
  });
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

function spBody(d: Document, input: SuratHrInput, locale: Locale): void {
  const spNum = /1/.test(input.jenis) ? "1" : /2/.test(input.jenis) ? "2" : "3";
  d.add(
    paragraph({
      text: L(locale, "Surat peringatan ini diberikan Kepada :", "This warning letter is issued to:"),
      size: TYPE.base,
      font: "bold",
    }),
  );
  d.add(spacer(1));
  d.add(
    keyValue({
      labelW: 30,
      pairs: [
        { label: L(locale, "Nama", "Name"), value: input.namaKaryawan, bold: true },
        { label: L(locale, "Jabatan", "Position"), value: `${input.jabatan}${input.unit && input.unit !== "-" ? ` - ${input.unit}` : ""}` },
      ],
    }),
  );
  d.add(spacer(2));
  d.add(
    paragraph({
      text: L(
        locale,
        `Sehubungan kinerja Saudara sebagai karyawan yang harus mematuhi dan melaksanakan semua kewajiban dan tata tertib serta disiplin dalam bekerja yang harus saudara laksanakan sepenuhnya. Maka, dengan ini kami memberikan Surat Peringatan Ke-${spNum} Kepada Saudara atas tindakan penyimpangan yang telah di lakukan oleh saudara sebagai berikut :`,
        `Regarding your performance as an employee who must obey and carry out all obligations, rules, and work discipline. Therefore, we hereby issue Warning Letter No. ${spNum} to you for the following infraction:`,
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(1));
  d.add(
    callout([input.pelanggaran && input.pelanggaran !== "-" ? input.pelanggaran : "Pelanggaran tata tertib dan disiplin kerja"], {
      fill: COLOR.softFill,
      border: COLOR.hair,
      bold: true,
    }),
  );
  d.add(spacer(1));
  const tind = spNum === "1"
    ? L(locale, "Jika dalam jangka waktu 1 (Satu) Bulan kedepan sejak Surat Peringatan ini diterbitkan dan ternyata saudara kembali melakukan tindakan pelanggaran yang sama, maka kami akan mengeluarkan Surat Peringatan yang kedua.", "If within 1 (one) month after this Warning Letter is issued you repeat the same violation, we will issue a Second Warning Letter.")
    : spNum === "2"
      ? L(locale, "Jika dalam jangka waktu 1 (Satu) Bulan kedepan sejak Surat Peringatan ini diterbitkan dan ternyata saudara kembali melakukan tindakan pelanggaran yang sama, maka kami akan mengeluarkan Surat Peringatan yang Terakhir atau PHK.", "If within 1 (one) month after this Warning Letter is issued you repeat the same violation, we will issue a Final Warning Letter or Employment Termination (PHK).")
      : L(locale, "Jika dalam jangka waktu 1 (Satu) Bulan kedepan sejak Surat Peringatan ini diterbitkan dan ternyata saudara kembali melakukan tindakan pelanggaran yang sama, maka kami akan mengeluarkan tindakan Pemutusan Hubungan Kerja (PHK).", "If within 1 (one) month after this Warning Letter is issued you repeat the same violation, we will proceed with Employment Termination (PHK).");
  d.add(paragraph({ text: tind, size: TYPE.base }));
  d.add(spacer(2));
  d.add(
    paragraph({
      text: L(
        locale,
        "Demikian surat ini kami sampaikan dan berlaku selama menjadi karyawan PT. SYUKUR BERSAUDARA. Kepada yang bersangkutan harap di perhatikan dan di perbaiki dengan segera.",
        "Thus we convey this letter, effective as long as you are an employee of PT. SYUKUR BERSAUDARA. Please pay attention and improve immediately.",
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(4));
  d.add(
    signatures([
      { role: L(locale, "Management", "Management"), name: input.namaPemberi || "Management", rows: 4 },
    ]),
  );
  d.add(spacer(2));
  d.add(hrCompanyFooter());
}

function phkBody(d: Document, input: SuratHrInput, locale: Locale): void {
  d.add(
    paragraph({
      text: `${L(locale, "Kepada Yth,", "To,")}\n${L(locale, "Sdr.", "Mr./Ms.")} ${input.namaKaryawan}\n${L(locale, "Di-Tempat", "In place")}`,
      size: TYPE.base,
    }),
  );
  d.add(spacer(2));
  d.add(
    paragraph({
      text: L(
        locale,
        `Dengan Hormat,\nSehubungan dengan Saudara masih melakukan pelanggaran disiplin berupa ${input.pelanggaran && input.pelanggaran !== "-" ? input.pelanggaran : "ketidakhadiran tanpa adanya konfirmasi"}.`,
        `Respectfully,\nIn connection with your continued disciplinary violation in the form of ${input.pelanggaran && input.pelanggaran !== "-" ? input.pelanggaran : "unconfirmed absence"}.`,
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(2));
  const tglAkhir = longDate(input.berlakuSampai || input.tanggal);
  d.add(
    paragraph({
      text: L(
        locale,
        `Dengan demikian, terhitung mulai tanggal ${tglAkhir} hubungan kerja antara PT. SYUKUR BERSAUDARA dengan Sdr. ${input.namaKaryawan} dinyatakan sudah berakhir. Dan atas nama lembaga, kami menyampaikan banyak terima kasih atas kinerja yang Saudara berikan selama ini.`,
        `Therefore, effective as of ${tglAkhir}, the employment relationship between PT. SYUKUR BERSAUDARA and ${input.namaKaryawan} is declared terminated. On behalf of the company, we express our gratitude for the performance you have provided.`,
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(2));
  d.add(
    paragraph({
      text: L(
        locale,
        "Demikian surat pemutusan hubungan kerja ini kami sampaikan, dan agar dapat dimaklumi, terima kasih.",
        "Thus we convey this letter of employment termination, and thank you for your understanding.",
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(4));
  d.add(
    signatures([
      { role: L(locale, "HR / HRD", "HR / HRD"), name: input.namaPemberi || "Suci Permata Sari", rows: 4 },
    ]),
  );
  d.add(spacer(2));
  d.add(hrCompanyFooter());
}

function pengalamanKerjaBody(d: Document, input: SuratHrInput, locale: Locale): void {
  d.add(
    paragraph({
      text: L(locale, "Kepada yang berkepentingan,", "To whom it may concern,"),
      size: TYPE.base,
    }),
  );
  d.add(spacer(1));
  d.add(
    paragraph({
      text: L(locale, "Dengan ini kami dari PT. SYUKUR BERSAUDARA menyatakan bahwa :", "We hereby from PT. SYUKUR BERSAUDARA certify that:"),
      size: TYPE.base,
    }),
  );
  d.add(spacer(1));
  d.add(
    keyValue({
      labelW: 30,
      pairs: [
        { label: L(locale, "Nama", "Name"), value: input.namaKaryawan, bold: true },
        { label: L(locale, "Alamat", "Address"), value: input.alamat || "-" },
        { label: L(locale, "Jabatan", "Position"), value: `${input.jabatan}${input.unit && input.unit !== "-" ? ` - ${input.unit}` : ""}` },
      ],
    }),
  );
  d.add(spacer(2));
  const tMulai = input.tanggalMulai ? longDate(input.tanggalMulai) : "-";
  const tSelesai = input.tanggalSelesai ? longDate(input.tanggalSelesai) : longDate(input.tanggal);
  const periode = `${tMulai} ${L(locale, "sampai dengan", "to")} ${tSelesai}`;
  d.add(
    paragraph({
      text: L(
        locale,
        `Telah benar-benar bekerja pada perusahaan kami dalam kurun waktu :\n${periode}`,
        `Has truly worked at our company during the period:\n${periode}`,
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(2));
  d.add(
    paragraph({
      text: L(
        locale,
        "Yang bersangkutan telah memberikan konstribusi yang baik bagi perusahaan dan selama bergabung tidak pernah melakukan tindakan yang merugikan perusahaan kami.",
        "The person concerned has made a good contribution to the company and during employment has never taken any actions detrimental to our company.",
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(2));
  d.add(
    paragraph({
      text: L(
        locale,
        "Kami berterima kasih atas segala kerjasama, kontribusi dan segala upaya yang telah diberikan guna perkembangan perusahaan yang lebih baik.",
        "We thank you for all the cooperation, contribution, and efforts given for the better development of the company.",
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(4));
  d.add(
    signatures([
      { role: L(locale, "PT. Syukur Bersaudara (HR)", "PT. Syukur Bersaudara (HR)"), name: input.namaPemberi || "Suci Permata Sari", rows: 4 },
    ]),
  );
  d.add(spacer(2));
  d.add(hrCompanyFooter());
}

function keteranganBekerjaBody(d: Document, input: SuratHrInput, locale: Locale): void {
  d.add(
    paragraph({
      text: L(locale, "Bersama ini kami menyatakan bahwa :", "We hereby certify that:"),
      size: TYPE.base,
    }),
  );
  d.add(spacer(1));
  d.add(
    keyValue({
      labelW: 42,
      pairs: [
        { label: L(locale, "Nama", "Name"), value: input.namaKaryawan, bold: true },
        { label: L(locale, "Tempat/Tgl Lahir", "Place/Date of Birth"), value: input.tempatTanggalLahir || "-" },
        { label: L(locale, "Jenis Kelamin", "Gender"), value: input.jenisKelamin || "-" },
        { label: L(locale, "Alamat", "Address"), value: input.alamat || "-" },
        { label: L(locale, "Agama", "Religion"), value: input.agama || "Islam" },
        { label: L(locale, "Status", "Marital Status"), value: input.statusKawin || "Belum Menikah" },
      ],
    }),
  );
  d.add(spacer(2));
  const sejak = input.tanggalMulai ? longDate(input.tanggalMulai) : longDate(input.tanggal);
  d.add(
    paragraph({
      text: L(
        locale,
        `Benar bekerja sebagai karyawan di PT. SYUKUR BERSAUDARA sejak ${sejak} sampai dengan sekarang, dengan jabatan ${input.jabatan}.`,
        `Is currently an active employee at PT. SYUKUR BERSAUDARA since ${sejak} until now, with the position of ${input.jabatan}.`,
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(2));
  d.add(
    paragraph({
      text: L(
        locale,
        "Demikian surat keterangan ini kami buat agar dipergunakan sebagaimana mestinya.",
        "This certificate is issued to be used appropriately.",
      ),
      size: TYPE.base,
    }),
  );
  d.add(spacer(4));
  d.add(
    signatures([
      { role: L(locale, "PT. Syukur Bersaudara (HRD)", "PT. Syukur Bersaudara (HRD)"), name: input.namaPemberi || "Suci Permata Sari", rows: 4 },
    ]),
  );
  d.add(spacer(2));
  d.add(hrCompanyFooter());
}

export function suratHrDoc(input: SuratHrInput, opts: DocOptions = {}): Document {
  const locale = input.locale ?? "id";
  const jenis = input.jenis.trim();
  const isSp = /^SP\s*[123]$/i.test(jenis) || /peringatan/i.test(jenis);
  const isPhk = /pemutusan|phk/i.test(jenis);
  const isPengalaman = /pengalaman/i.test(jenis);
  const isKeterangan = /keterangan/i.test(jenis);

  let docJudul = input.jenis.toUpperCase();
  let refLabel = `${L(locale, "No", "No")}. ${input.no}`;

  if (input.kontrak) {
    docJudul = input.kontrak.sebelumnya
      ? L(locale, "SURAT PERPANJANGAN KONTRAK KERJA", "EMPLOYMENT CONTRACT EXTENSION")
      : L(locale, "SURAT PERJANJIAN KERJA", "EMPLOYMENT AGREEMENT");
  } else if (isSp) {
    const spNum = /1/.test(jenis) ? "1" : /2/.test(jenis) ? "2" : "3";
    docJudul = `SURAT PERINGATAN ${spNum}`;
    refLabel = `No: ${input.no}`;
  } else if (isPhk) {
    docJudul = "SURAT PEMUTUSAN HUBUNGAN KERJA";
    refLabel = `Nomor : ${input.no}   Perihal : Surat Pemutusan Hubungan Kerja`;
  } else if (isPengalaman) {
    docJudul = "SURAT PENGALAMAN KERJA";
    refLabel = `No: ${input.no}   Hal: Surat Pengalaman Kerja`;
  } else if (isKeterangan) {
    docJudul = "SURAT KETERANGAN";
    refLabel = `Nomor : ${input.no}`;
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
  if (isKeterangan) {
    keteranganBekerjaBody(d, input, locale);
    return d;
  }
  if (isPengalaman) {
    pengalamanKerjaBody(d, input, locale);
    return d;
  }
  if (isPhk) {
    phkBody(d, input, locale);
    return d;
  }
  if (isSp) {
    spBody(d, input, locale);
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
      text: `${input.namaPemberi}\n${input.jabatanPemberi}`,
      size: TYPE.base - 1,
      align: "right",
    }),
  );

  return d;
}