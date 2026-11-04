import { styledRow, type ExcelSheet, type RowKind } from "../utils/export";
import { COA_EXCEL, type CoaExcel } from "./financeExcel";

export interface FinancialWorkbookParams {
  asOf: string;
  /** Periode terpilih di filter (mis. "November 2026"); kosong → turunan asOf. */
  periodLabel?: string;
  coaRows: Array<{ kode: string; nama: string; dk: string; nrlr?: string; saldo?: number }>;
  manJournals: Array<{
    date?: string;
    dokumen?: string;
    uraian?: string;
    db?: string;
    kr?: string;
    amount?: number | string;
    sumber?: string;
    status?: string;
  }>;
  nrNeraca: {
    aktiva: Array<{ kode: string; nama: string; nilai: number }>;
    kewajiban: Array<{ kode: string; nama: string; nilai: number }>;
    ekuitas: Array<{ kode: string; nama: string; nilai: number }>;
    laba: number;
    totalAktiva: number;
    selisih: number;
    totalPasiva: number;
  };
  lrRows?: {
    rows: Array<{ kode: string; pos: string; nilai: number }>;
    pend: number;
    bebanPokok: number;
    biayaUsaha: number;
    lainMasuk: number;
    lainKeluar: number;
  };
  lrLive?: {
    revenue: number;
    costProj: number;
    salary: number;
    writeoff: number;
    laba: number;
    n: number;
    period: { revenue: number; costProj: number; salary: number; writeoff: number; laba: number };
  };
  kasLiveRows?: Array<{ kode: string; nama: string }>;
  kasRep?: {
    saldo: Record<string, number>;
    masuk: Record<string, number>;
    keluar: Record<string, number>;
  };
  hutLive?: Array<{ v: string; total: number; count: number }>;
  piuLive?: Array<{ c: string; total: number; count: number }>;
  plMonthly?: Array<{ period: string; revenue: number; costProj: number; salary: number; laba: number }>;
}

/** Nama perusahaan di kop Excel mengikuti nama aplikasi. */
const COMPANY_NAME = "PT Syukur Bersaudara";

const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatPeriodeJudul(asOf: string): string {
  if (!asOf) return "Bulan Berjalan";
  const parts = asOf.split("-");
  if (parts.length >= 2) {
    const m = Number(parts[1]) - 1;
    const y = parts[0];
    const monthName = BULAN_ID[m] ?? parts[1];
    return `Bulan ${monthName} ${yearOrFull(parts, y)}`;
  }
  return `Per ${asOf}`;
}

/** Periode kop laporan dari filter historis halaman (Bulan → "November 2026"). */
export function fmtPeriodeLaporan(
  hist: { mode: string; hari: string; bulan: string; tahun: string; dari: string; sampai: string },
  asOf: string,
): string {
  const tgl = (iso: string): string => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${BULAN_ID[(m || 1) - 1]} ${y}`;
  };
  if (hist.mode === "Bulan" && hist.bulan) {
    const [y, m] = hist.bulan.split("-").map(Number);
    return `${BULAN_ID[(m || 1) - 1]} ${y}`;
  }
  if (hist.mode === "Tahun" && hist.tahun) return `Tahun ${hist.tahun}`;
  if (hist.mode === "Hari" && hist.hari) return `Per ${tgl(hist.hari)}`;
  if (hist.mode === "Rentang" && hist.dari && hist.sampai) return `${tgl(hist.dari)} – ${tgl(hist.sampai)}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? `Per ${tgl(asOf)}` : "";
}

function yearOrFull(parts: string[], y: string): string {
  if (parts.length === 3) {
    return `${y} (Per ${parts[2]} ${BULAN_ID[Number(parts[1]) - 1] ?? ""} ${y})`;
  }
  return y;
}

/** Jenis baris laporan dari kolom kode & nama: judul pos (x-y00 tanpa nilai),
 *  subtotal ("Jumlah…"/"Laba…"), atau total akhir ("TOTAL…"/laba bersih). */
function kindOf(row: readonly unknown[]): RowKind | undefined {
  const kode = String(row[0] ?? "");
  const nama = String(row[1] ?? "");
  if (!kode && /^TOTAL\b|^Laba Bersih/.test(nama)) return "grand";
  if (!kode && /^(Jumlah|Nilai Buku|Laba )/.test(nama)) return "total";
  if (/^\d-\d00$/.test(kode) && row.slice(2).every((c) => c === "" || c == null)) return "section";
  return undefined;
}

function makeBar(pct: number, maxBlocks = 20): string {
  const p = Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct));
  const filled = Math.round((p / 100) * maxBlocks);
  const empty = Math.max(0, maxBlocks - filled);
  return "█".repeat(filled) + "░".repeat(empty) + ` ${p.toFixed(1)}%`;
}

/**
 * Membangun seluruh sheets laporan keuangan standar sesuai format referensi klien
 * (Financial Format (1).xlsx) plus Semi-Dashboard Keuangan; tiap sheet
 * memakai kop laporan resmi (perusahaan, judul, periode).
 */
export function buildFinancialFormatSheets(params: FinancialWorkbookParams): ExcelSheet[] {
  const {
    asOf,
    periodLabel,
    coaRows,
    manJournals,
    nrNeraca,
    kasLiveRows = [],
    kasRep = { saldo: {}, masuk: {}, keluar: {} },
    hutLive = [],
    piuLive = [],
    plMonthly = [],
  } = params;

  const periodeStr = periodLabel || formatPeriodeJudul(asOf);
  const kop = (title: string): ExcelSheet["header"] => ({ company: COMPANY_NAME, title, period: periodeStr });

  // Map master COA
  const coaMap = new Map<string, CoaExcel>();
  for (const c of COA_EXCEL) coaMap.set(c.kode, c);
  for (const c of coaRows) {
    if (!coaMap.has(c.kode)) {
      coaMap.set(c.kode, { kode: c.kode, nama: c.nama, dk: c.dk || "D", nrlr: c.nrlr || "NR" });
    }
  }

  // Hitung saldo debit dan kredit per akun dari jurnal yang valid s.d. tanggal asOf
  const debitMap = new Map<string, number>();
  const kreditMap = new Map<string, number>();

  for (const j of manJournals) {
    if (j.status === "Void") continue;
    const jDate = String(j.date ?? "").slice(0, 10);
    if (asOf && jDate > asOf) continue;
    const amount = Number(j.amount ?? 0);
    if (!amount) continue;
    const db = String(j.db ?? "").trim();
    const kr = String(j.kr ?? "").trim();
    if (db) debitMap.set(db, (debitMap.get(db) ?? 0) + amount);
    if (kr) kreditMap.set(kr, (kreditMap.get(kr) ?? 0) + amount);
  }

  // Akun judul (D/K "-", mis. 1-100 Aktiva Lancar) sudah jadi baris seksi; jangan dicetak ulang sebagai pos bernilai 0.
  const postable = Array.from(coaMap.values()).filter((c) => c.dk !== "-");
  const isJudul = (c: CoaExcel): boolean => c.dk === "-";

  // Saldo akun:
  // Akun D (Aktiva 1-xxx, Beban 5-xxx, 6-xxx): Debit - Kredit
  // Akun K (Kewajiban 2-xxx, Ekuitas 3-xxx, Pendapatan 4-xxx): Kredit - Debit
  const getSaldo = (kode: string): number => {
    const d = debitMap.get(kode) ?? 0;
    const k = kreditMap.get(kode) ?? 0;
    const info = coaMap.get(kode);
    const dk = info ? info.dk : (kode.startsWith("1") || kode.startsWith("5") || kode.startsWith("6") ? "D" : "K");
    return dk === "D" ? d - k : k - d;
  };

  /* =======================================================================
   * 1. SHEET: NERACA (2 KOLOM: KIRI AKTIVA, KANAN PASIVA)
   * ======================================================================= */
  const leftRows: Array<[string, string, string, number | string, number | string]> = [];
  const rightRows: Array<[string, string, string, number | string, number | string]> = [];

  // AKTIVA LANCAR (1-100 s.d. 1-199)
  leftRows.push(["1-000", "A K T I V A", "", "", ""]);
  leftRows.push(["1-100", "A K T I V A   L A N C A R", "", "", ""]);

  const aktivaLancarAccs = postable.filter((c) => c.kode.startsWith("1-1"));
  let sumAktivaLancar = 0;
  for (const acc of aktivaLancarAccs) {
    const val = getSaldo(acc.kode);
    sumAktivaLancar += val;
    leftRows.push([acc.kode, acc.nama, "", val, ""]);
  }
  leftRows.push(["", "Jumlah Aktiva Lancar", "", "", sumAktivaLancar]);
  leftRows.push(["", "", "", "", ""]);

  // AKTIVA TETAP (1-200 s.d. 1-299)
  leftRows.push(["1-200", "A K T I V A   T E T A P", "", "", ""]);
  const aktivaTetapPerolehan = postable.filter((c) => c.kode.startsWith("1-2") && !c.kode.startsWith("1-27") && !c.kode.startsWith("1-28") && !c.kode.startsWith("1-29"));
  const aktivaTetapPenyusutan = postable.filter((c) => c.kode.startsWith("1-27") || c.kode.startsWith("1-28") || c.kode.startsWith("1-29"));

  let sumPerolehan = 0;
  for (const acc of aktivaTetapPerolehan) {
    const val = getSaldo(acc.kode);
    sumPerolehan += val;
    leftRows.push([acc.kode, acc.nama, "", val, ""]);
  }
  leftRows.push(["", "Jumlah Harga Perolehan", "", sumPerolehan, ""]);

  let sumAkumPenyusutan = 0;
  for (const acc of aktivaTetapPenyusutan) {
    const val = getSaldo(acc.kode);
    sumAkumPenyusutan += val;
    leftRows.push([acc.kode, acc.nama, "", val, ""]);
  }
  leftRows.push(["", "Jumlah Akum. Penyusutan", "", sumAkumPenyusutan, ""]);

  const nilaiBukuTetap = sumPerolehan - sumAkumPenyusutan;
  leftRows.push(["", "Nilai Buku Aktiva Tetap", "", "", nilaiBukuTetap]);
  leftRows.push(["", "", "", "", ""]);

  const grandTotalAktiva = sumAktivaLancar + nilaiBukuTetap;
  leftRows.push(["", "TOTAL AKTIVA", "", "", grandTotalAktiva]);

  // PASIVA: KEWAJIBAN & EKUITAS
  rightRows.push(["2-000", "K E W A J I B A N", "", "", ""]);
  rightRows.push(["2-100", "K E W A J I B A N   L A N C A R", "", "", ""]);

  const kewajibanLancarAccs = postable.filter((c) => c.kode.startsWith("2-1"));
  let sumKewajibanLancar = 0;
  for (const acc of kewajibanLancarAccs) {
    const val = getSaldo(acc.kode);
    sumKewajibanLancar += val;
    rightRows.push([acc.kode, acc.nama, "", val, ""]);
  }
  rightRows.push(["", "Jumlah Kewajiban Lancar", "", "", sumKewajibanLancar]);
  rightRows.push(["", "", "", "", ""]);

  rightRows.push(["2-200", "K E W A J I B A N   J A N G K A   P A N J A N G", "", "", ""]);
  const kewajibanJpAccs = postable.filter((c) => c.kode.startsWith("2-2"));
  let sumKewajibanJp = 0;
  for (const acc of kewajibanJpAccs) {
    const val = getSaldo(acc.kode);
    sumKewajibanJp += val;
    rightRows.push([acc.kode, acc.nama, "", val, ""]);
  }
  rightRows.push(["", "Jumlah Kewajiban Jangka Panjang", "", "", sumKewajibanJp]);
  rightRows.push(["", "", "", "", ""]);

  // EKUITAS
  rightRows.push(["3-000", "E K U I T A S", "", "", ""]);
  const modalUsaha = getSaldo("3-100");
  const labaDitahan = getSaldo("3-200");
  const labaBerjalan = nrNeraca.laba;
  const balancing = nrNeraca.selisih;
  const sumEkuitas = modalUsaha + labaDitahan + labaBerjalan + balancing;

  rightRows.push(["3-100", "Modal", "", modalUsaha, ""]);
  rightRows.push(["3-200", "Laba Ditahan", "", labaDitahan, ""]);
  rightRows.push(["3-300", "Laba Tahun Berjalan", "", labaBerjalan, ""]);
  if (balancing !== 0) {
    rightRows.push(["3-999", "Historical Balancing", "", balancing, ""]);
  }
  rightRows.push(["", "Jumlah Ekuitas", "", "", sumEkuitas]);
  rightRows.push(["", "", "", "", ""]);

  const grandTotalPasiva = sumKewajibanLancar + sumKewajibanJp + sumEkuitas;
  rightRows.push(["", "TOTAL PASIVA", "", "", grandTotalPasiva]);

  // Sejajarkan jumlah baris aktiva dan pasiva
  const maxRows = Math.max(leftRows.length, rightRows.length);
  while (leftRows.length < maxRows) leftRows.push(["", "", "", "", ""]);
  while (rightRows.length < maxRows) rightRows.push(["", "", "", "", ""]);

  const isBalance = Math.abs(grandTotalAktiva - grandTotalPasiva) < 1;
  const auditStatusStr = isBalance ? "✅ STATUS AUDIT: SEIMBANG / 100% BALANCE (Rp 0 Selisih)" : `⚠️ STATUS AUDIT: ADA SELISIH Rp ${Math.abs(grandTotalAktiva - grandTotalPasiva).toLocaleString("id-ID")}`;

  const neracaRows: unknown[][] = [
    styledRow("head", ["NO AKUN", "NAMA AKUN", "", "JUMLAH", "TOTAL", "", "NO AKUN", "NAMA AKUN", "", "JUMLAH", "TOTAL"]),
  ];

  for (let i = 0; i < maxRows; i++) {
    const l = leftRows[i];
    const r = rightRows[i];
    const kl = kindOf(l);
    const kr = kindOf(r);
    neracaRows.push(styledRow(
      [...Array<RowKind | undefined>(5).fill(kl), undefined, ...Array<RowKind | undefined>(5).fill(kr)],
      [l[0], l[1], l[2], l[3], l[4], "", r[0], r[1], r[2], r[3], r[4]],
    ));
  }

  // Baris footer audit di bagian paling bawah
  neracaRows.push([]);
  neracaRows.push(styledRow("note", [
    "AUDIT BALANCE CHECK",
    `Total Aktiva: ${grandTotalAktiva.toLocaleString("id-ID")}`,
    "", "", "", "",
    "AUDIT BALANCE CHECK",
    `Total Pasiva: ${grandTotalPasiva.toLocaleString("id-ID")}`,
    "",
    auditStatusStr,
    "",
  ]));

  /* =======================================================================
   * 2. SHEET: LABA RUGI (LENGKAP RINCIAN POS COA)
   * ======================================================================= */
  let lrExcelRows: unknown[][] = [
    ["NO AKUN", "NAMA AKUN", "", "JUMLAH", "TOTAL"],
  ];

  // 4-000 PENDAPATAN
  lrExcelRows.push(["4-000", "P E N D A P A T A N", "", "", ""]);
  const pendAccs = postable.filter((c) => c.kode.startsWith("4-"));
  let totPendapatan = 0;
  for (const acc of pendAccs) {
    const v = getSaldo(acc.kode);
    totPendapatan += v;
    lrExcelRows.push([acc.kode, acc.nama, "", v, ""]);
  }
  lrExcelRows.push(["", "Jumlah Pendapatan Operasional", "", "", totPendapatan]);
  lrExcelRows.push(["", "", "", "", ""]);

  // 5-000 BEBAN POKOK PENDAPATAN (HPP)
  lrExcelRows.push(["5-000", "B E B A N   P O K O K   P E N D A P A T A N   ( H P P )", "", "", ""]);
  const hppAccs = postable.filter((c) => c.kode.startsWith("5-"));
  let totHpp = 0;
  for (const acc of hppAccs) {
    const v = getSaldo(acc.kode);
    totHpp += v;
    lrExcelRows.push([acc.kode, acc.nama, "", v, ""]);
  }
  lrExcelRows.push(["", "Jumlah Beban Pokok Pendapatan", "", "", totHpp]);
  lrExcelRows.push(["", "", "", "", ""]);

  const labaKotor = totPendapatan - totHpp;
  lrExcelRows.push(["", "Laba Kotor Usaha (Gross Profit)", "", "", labaKotor]);
  lrExcelRows.push(["", "", "", "", ""]);

  // 6-000 BIAYA USAHA / OPERASIONAL (OPEX)
  lrExcelRows.push(["6-000", "B I A Y A   U S A H A   /   O P E R A S I O N A L", "", "", ""]);
  const opexAccs = postable.filter((c) => c.kode.startsWith("6-"));
  let totOpex = 0;
  for (const acc of opexAccs) {
    const v = getSaldo(acc.kode);
    totOpex += v;
    lrExcelRows.push([acc.kode, acc.nama, "", v, ""]);
  }
  lrExcelRows.push(["", "Jumlah Biaya Usaha / Operasional", "", "", totOpex]);
  lrExcelRows.push(["", "", "", "", ""]);

  const labaUsaha = labaKotor - totOpex;
  lrExcelRows.push(["", "Laba Usaha Operasional (EBIT)", "", "", labaUsaha]);
  lrExcelRows.push(["", "", "", "", ""]);

  // 7-000 PENDAPATAN & BIAYA LAIN-LAIN
  lrExcelRows.push(["7-000", "P E N D A P A T A N   &   B I A Y A   L A I N - L A I N", "", "", ""]);
  const otherAccs = postable.filter((c) => c.kode.startsWith("7-"));
  let totOtherIncome = 0;
  let totOtherExpense = 0;
  for (const acc of otherAccs) {
    const v = getSaldo(acc.kode);
    if (acc.kode.startsWith("7-1") || acc.kode.startsWith("7-2")) {
      totOtherIncome += v;
    } else {
      totOtherExpense += v;
    }
    lrExcelRows.push([acc.kode, acc.nama, "", v, ""]);
  }
  const netOther = totOtherIncome - totOtherExpense;
  lrExcelRows.push(["", "Jumlah Pendapatan & Biaya Lain-Lain", "", "", netOther]);

  const labaBersih = labaUsaha + netOther;
  lrExcelRows.push(["", "Laba Bersih Usaha Sebelum Pajak", "", "", labaBersih]);
  lrExcelRows = lrExcelRows.map((row) => {
    const k = kindOf(row);
    return k ? styledRow(k, row) : row;
  });

  /* =======================================================================
   * 3. SHEET: DASHBOARD & GRAFIK (SEMI-DASHBOARD ADVANCED COCKPIT)
   * ======================================================================= */
  const marginPct = totPendapatan > 0 ? (labaBersih / totPendapatan) * 100 : 0;
  const hppPct = totPendapatan > 0 ? (totHpp / totPendapatan) * 100 : 0;
  const opexPct = totPendapatan > 0 ? (totOpex / totPendapatan) * 100 : 0;
  const grossMarginPct = totPendapatan > 0 ? (labaKotor / totPendapatan) * 100 : 0;

  // Rasio Keuangan
  const currentRatio = sumKewajibanLancar > 0 ? sumAktivaLancar / sumKewajibanLancar : 99;
  const derRatio = sumEkuitas > 0 ? (sumKewajibanLancar + sumKewajibanJp) / sumEkuitas : 0;
  const totalKasBank = kasLiveRows.reduce((s, r) => s + (kasRep.saldo[r.kode] ?? 0), 0);
  const totalHutangVal = hutLive.reduce((s, h) => s + h.total, 0);
  const totalPiutangVal = piuLive.reduce((s, p) => s + p.total, 0);

  const dashboardRows: unknown[][] = [
    styledRow("note", [`As-Of: ${asOf || "Live"}`, "Mata Uang: IDR (Rupiah)", `Integritas: ${auditStatusStr}`, "", ""]),
    [],
    // KARTU KINERJA UTAMA (SCORECARD)
    styledRow("head", ["KARTU KINERJA KEUANGAN EKSEKUTIF (SCORECARD)", "NILAI", "STATUS / BENCHMARK", "BAR VISUALISASI", "ANALISIS VERTIKAL"]),
    ["Total Pendapatan (Revenue)", totPendapatan, "100% Target Operasional", makeBar(100), "100.0%"],
    ["Beban Pokok Pendapatan (HPP)", totHpp, hppPct <= 75 ? "Efisien" : "Perlu Efisiensi", makeBar(hppPct), `${hppPct.toFixed(1)}%`],
    ["Laba Kotor (Gross Profit)", labaKotor, grossMarginPct >= 25 ? "Sangat Sehat" : "Waspada", makeBar(grossMarginPct), `${grossMarginPct.toFixed(1)}%`],
    ["Biaya Operasional (Opex)", totOpex, opexPct <= 20 ? "Terkendali" : "Tinggi", makeBar(opexPct), `${opexPct.toFixed(1)}%`],
    ["Laba Bersih Usaha (Net Profit)", labaBersih, labaBersih >= 0 ? "SURPLUS" : "DEFISIT", makeBar(marginPct), `${marginPct.toFixed(1)}%`],
    [],
    // KESEHATAN KEUANGAN & LIKUIDITAS
    styledRow("head", ["INDIKATOR KESEHATAN KEUANGAN & RASIO", "NILAI RASIO", "STANDAR INDUSTRI GALANGAN", "STATUS KESEHATAN", ""]),
    ["Likuiditas (Current Ratio)", `${currentRatio.toFixed(2)}x`, "Min. 1.2x s.d. 2.0x", currentRatio >= 1.5 ? "SANGAT AMAN" : (currentRatio >= 1.0 ? "CUKUP" : "KETAT"), ""],
    ["Solvabilitas (Debt to Equity / DER)", `${derRatio.toFixed(2)}x`, "Maks. 2.5x", derRatio <= 1.5 ? "SEHAT" : (derRatio <= 2.5 ? "SEDANG" : "TINGGI"), ""],
    ["Total Kas & Bank Siap Pakai", totalKasBank, "Buffer Minimal Operasional", totalKasBank >= 50000000 ? "LANCAR" : "PERLU INJEKSI", ""],
    ["Posisi Likuiditas Netto (Piutang - Hutang)", totalPiutangVal - totalHutangVal, "Surplus Modal Kerja", totalPiutangVal >= totalHutangVal ? "SURPLUS MODAL" : "DEFISIT AP", ""],
    [],
    // STRUKTUR ASET & PASIVA
    styledRow("head", ["STRUKTUR ASSET & MODAL GALANGAN", "NOMINAL (RP)", "PORSI %", "VISUAL BAR", ""]),
    ["Total Aktiva (Aset Galangan)", grandTotalAktiva, "100%", makeBar(100), ""],
    ["• Aktiva Lancar (Kas/Bank/Piutang)", sumAktivaLancar, `${((sumAktivaLancar / (grandTotalAktiva || 1)) * 100).toFixed(1)}%`, makeBar((sumAktivaLancar / (grandTotalAktiva || 1)) * 100), ""],
    ["• Aktiva Tetap Bersih (Fasilitas Dok)", nilaiBukuTetap, `${((nilaiBukuTetap / (grandTotalAktiva || 1)) * 100).toFixed(1)}%`, makeBar((nilaiBukuTetap / (grandTotalAktiva || 1)) * 100), ""],
    ["Total Kewajiban (Hutang AP)", sumKewajibanLancar + sumKewajibanJp, `${(((sumKewajibanLancar + sumKewajibanJp) / (grandTotalPasiva || 1)) * 100).toFixed(1)}%`, makeBar(((sumKewajibanLancar + sumKewajibanJp) / (grandTotalPasiva || 1)) * 100), ""],
    ["Total Ekuitas (Modal Saham & Laba)", sumEkuitas, `${((sumEkuitas / (grandTotalPasiva || 1)) * 100).toFixed(1)}%`, makeBar((sumEkuitas / (grandTotalPasiva || 1)) * 100), ""],
    [],
    // TABEL TREN MULTI-BULAN
    styledRow("head", ["TREN KINERJA KEUANGAN PER BULAN", "PENDAPATAN", "HPP PROYEK", "OPEX GAJI/ADM", "LABA BERSIH"]),
    ...plMonthly.map((p) => [p.period, p.revenue, p.costProj, p.salary, p.laba]),
    [],
    // TOP 5 HUTANG & PIUTANG
    styledRow("head", ["TOP 5 REKAPITULASI HUTANG USAHA (AP)", "TOTAL HUTANG", "JUMLAH PO", "STATUS JATUH TEMPO", ""]),
    ...hutLive.slice(0, 5).map((h) => [h.v, Math.round(h.total), `${h.count} Dokumen`, "Aktif Berjalan", ""]),
    [],
    styledRow("head", ["TOP 5 REKAPITULASI PIUTANG USAHA (AR)", "TOTAL PIUTANG", "JUMLAH INVOICE", "STATUS PENAGIHAN", ""]),
    ...piuLive.slice(0, 5).map((p) => [p.c, Math.round(p.total), `${p.count} Dokumen`, "Aktif Berjalan", ""]),
  ];

  /* =======================================================================
   * 4. SHEET: NERACA LAJUR (10 KOLOM)
   * ======================================================================= */
  const neracaLajurRows: unknown[][] = [
    ["NO", "NAMA AKUN", "AKUN", "NERACA SALDO", "", "AKUN", "LABA-RUGI", "", "NERACA", ""],
    styledRow("head", ["AKUN", "", "D/K", "DEBIT", "KREDIT", "NR/LR", "DEBIT", "KREDIT", "DEBIT", "KREDIT"]),
  ];

  let nsTotD = 0, nsTotK = 0, lrTotD = 0, lrTotK = 0, nrTotD = 0, nrTotK = 0;

  for (const c of Array.from(coaMap.values())) {
    const d = debitMap.get(c.kode) ?? 0;
    const k = kreditMap.get(c.kode) ?? 0;
    const net = d - k;
    let nsD = 0, nsK = 0;
    if (net >= 0) nsD = net;
    else nsK = Math.abs(net);

    let lD = 0, lK = 0, nD = 0, nK = 0;
    if (c.nrlr === "LR") {
      lD = nsD;
      lK = nsK;
    } else {
      nD = nsD;
      nK = nsK;
    }

    nsTotD += nsD;
    nsTotK += nsK;
    lrTotD += lD;
    lrTotK += lK;
    nrTotD += nD;
    nrTotK += nK;

    if (isJudul(c)) {
      neracaLajurRows.push(styledRow("section", [c.kode, c.nama, "", "", "", "", "", "", "", ""]));
      continue;
    }
    neracaLajurRows.push([
      c.kode, c.nama, c.dk,
      nsD, nsK,
      c.nrlr,
      lD, lK,
      nD, nK,
    ]);
  }

  neracaLajurRows.push(styledRow("grand", [
    "", "TOTAL", "",
    nsTotD, nsTotK,
    "",
    lrTotD, lrTotK,
    nrTotD, nrTotK,
  ]));

  /* =======================================================================
   * 5. SHEET: JU, KAS, BANK
   * ======================================================================= */
  const kasBankRows: unknown[][] = [
  ];

  if (kasLiveRows.length > 0) {
    kasBankRows.push(
      styledRow("section", ["REKAPITULASI REKENING KAS & BANK", "", "", "", "", "", "", "", ""]),
      styledRow("head", ["KODE", "NAMA REKENING", "SALDO AWAL", "MUTASI MASUK", "MUTASI KELUAR", "SALDO AKHIR", "", "", ""]),
    );
    for (const r of kasLiveRows) {
      kasBankRows.push([
        r.kode,
        r.nama,
        kasRep.saldo[r.kode] ?? 0,
        kasRep.masuk[r.kode] ?? 0,
        kasRep.keluar[r.kode] ?? 0,
        kasRep.saldo[r.kode] ?? 0,
      ]);
    }
    kasBankRows.push([]);
  }

  kasBankRows.push(
    styledRow("section", ["RINCIAN TRANSAKSI KAS & BANK (BUKU KAS / BANK)", "", "", "", "", "", "", "", ""]),
    styledRow("head", ["TANGGAL", "KODE PEMBANTU", "DOKUMEN", "URAIAN", "AKUN DB", "AKUN KR", "KAS DEBIT", "KAS KREDIT", "SALDO"]),
  );

  let rollingSaldo = 0;
  for (const j of manJournals) {
    if (j.status === "Void") continue;
    if (asOf && String(j.date ?? "").slice(0, 10) > asOf) continue;
    const isKasOrBank = j.sumber === "Kas" || j.sumber === "Bank";
    const amount = Number(j.amount ?? 0);
    const dbAmt = isKasOrBank && String(j.db ?? "").startsWith("1-1") ? amount : 0;
    const krAmt = isKasOrBank && String(j.kr ?? "").startsWith("1-1") ? amount : 0;
    rollingSaldo += (dbAmt - krAmt);

    kasBankRows.push([
      String(j.date ?? ""),
      "-",
      String(j.dokumen ?? "-"),
      String(j.uraian ?? ""),
      String(j.db ?? "-"),
      String(j.kr ?? "-"),
      dbAmt,
      krAmt,
      rollingSaldo,
    ]);
  }

  /* =======================================================================
   * 6. SHEET: HUTANG
   * ======================================================================= */
  const hutangRows: unknown[][] = [
    styledRow("head", ["NO", "KODE PEMBANTU", "SALDO AWAL BULAN", "AKHIR SALDO"]),
  ];
  hutLive.forEach((h, idx) => {
    hutangRows.push([idx + 1, h.v, Math.round(h.total), Math.round(h.total)]);
  });

  /* =======================================================================
   * 7. SHEET: PIUTANG
   * ======================================================================= */
  const piutangRows: unknown[][] = [
    styledRow("head", ["NO", "KODE PEMBANTU", "SALDO AWAL BULAN", "AKHIR BULAN"]),
  ];
  piuLive.forEach((p, idx) => {
    piutangRows.push([idx + 1, p.c, Math.round(p.total), Math.round(p.total)]);
  });

  /* =======================================================================
   * 8. SHEET: BUKU BESAR
   * ======================================================================= */
  const bbRows: unknown[][] = [
    styledRow("head", ["KODE AKUN", "NAMA AKUN", "D/K", "TOTAL DEBIT", "TOTAL KREDIT", "SALDO AKHIR"]),
  ];
  for (const c of Array.from(coaMap.values())) {
    const d = debitMap.get(c.kode) ?? 0;
    const k = kreditMap.get(c.kode) ?? 0;
    const saldo = getSaldo(c.kode);
    bbRows.push(isJudul(c) ? styledRow("section", [c.kode, c.nama, "", "", "", ""]) : [c.kode, c.nama, c.dk, d, k, saldo]);
  }

  /* =======================================================================
   * 9. SHEET: AKUN (COA)
   * ======================================================================= */
  const akunRows: unknown[][] = [
    styledRow("head", ["NO AKUN", "NAMA AKUN", "AKUN D/K", "AKUN NR/LR"]),
  ];
  for (const c of Array.from(coaMap.values())) {
    akunRows.push(isJudul(c) ? styledRow("section", [c.kode, c.nama, "", ""]) : [c.kode, c.nama, c.dk, c.nrlr]);
  }

  return [
    { name: "Dashboard & Grafik", rows: dashboardRows, header: kop("Dashboard Keuangan") },
    { name: "Neraca", rows: neracaRows, header: kop("Neraca") },
    { name: "Laba Rugi", rows: lrExcelRows, header: kop("Laba Rugi") },
    { name: "Neraca Lajur", rows: neracaLajurRows, header: kop("Neraca Lajur") },
    { name: "JU, Kas, Bank", rows: kasBankRows, header: kop("Jurnal Kas & Bank") },
    { name: "Hutang", rows: hutangRows, header: kop("Hutang Dagang") },
    { name: "Piutang", rows: piutangRows, header: kop("Piutang Usaha") },
    { name: "Buku Besar", rows: bbRows, header: kop("Buku Besar") },
    { name: "Akun", rows: akunRows, header: kop("Daftar Akun") },
  ];
}
