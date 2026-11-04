import { type ExcelSheet } from "../utils/export";
import { COA_EXCEL, type CoaExcel } from "./financeExcel";

export interface FinancialWorkbookParams {
  asOf: string;
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

function yearOrFull(parts: string[], y: string): string {
  if (parts.length === 3) {
    return `${y} (Per ${parts[2]} ${BULAN_ID[Number(parts[1]) - 1] ?? ""} ${y})`;
  }
  return y;
}

function makeBar(pct: number, maxBlocks = 20): string {
  const p = Math.max(0, Math.min(100, pct));
  const filled = Math.round((p / 100) * maxBlocks);
  const empty = maxBlocks - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${p.toFixed(1)}%`;
}

/**
 * Membangun seluruh sheets laporan keuangan standar sesuai format referensi klien
 * (Financial Format (1).xlsx).
 */
export function buildFinancialFormatSheets(params: FinancialWorkbookParams): ExcelSheet[] {
  const {
    asOf,
    coaRows,
    manJournals,
    nrNeraca,
    kasLiveRows = [],
    kasRep = { saldo: {}, masuk: {}, keluar: {} },
    hutLive = [],
    piuLive = [],
    plMonthly = [],
  } = params;

  const periodeStr = formatPeriodeJudul(asOf);

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

  const aktivaLancarAccs = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("1-1"));
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
  const aktivaTetapPerolehan = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("1-2") && !c.kode.startsWith("1-27") && !c.kode.startsWith("1-28") && !c.kode.startsWith("1-29"));
  const aktivaTetapPenyusutan = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("1-27") || c.kode.startsWith("1-28") || c.kode.startsWith("1-29"));

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

  const kewajibanLancarAccs = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("2-1"));
  let sumKewajibanLancar = 0;
  for (const acc of kewajibanLancarAccs) {
    const val = getSaldo(acc.kode);
    sumKewajibanLancar += val;
    rightRows.push([acc.kode, acc.nama, "", val, ""]);
  }
  rightRows.push(["", "Jumlah Kewajiban Lancar", "", "", sumKewajibanLancar]);
  rightRows.push(["", "", "", "", ""]);

  rightRows.push(["2-200", "K E W A J I B A N   J A N G K A   P A N J A N G", "", "", ""]);
  const kewajibanJpAccs = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("2-2"));
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

  rightRows.push(["3-100", "Modal Usaha", "", modalUsaha, ""]);
  rightRows.push(["3-200", "Laba Ditahan", "", labaDitahan, ""]);
  rightRows.push(["", "Laba (Rugi) Berjalan", "", labaBerjalan, ""]);
  if (balancing !== 0) {
    rightRows.push(["3-999", "Historical Balancing", "", balancing, ""]);
  }
  rightRows.push(["", "Jumlah Ekuitas", "", "", sumEkuitas]);
  rightRows.push(["", "", "", "", ""]);

  const grandTotalPasiva = sumKewajibanLancar + sumKewajibanJp + sumEkuitas;
  rightRows.push(["", "TOTAL PASIVA", "", "", grandTotalPasiva]);

  // Gabungkan Aktiva (Kiri: A-E) dan Pasiva (Kanan: G-K) dengan F sebagai pemisah
  const neracaRows: unknown[][] = [
    ["PT SYUKUR BERSAUDARA", "", "", "", "", "", "PT SYUKUR BERSAUDARA", "", "", "", ""],
    ["NERACA", "", "", "", "", "", "NERACA", "", "", "", ""],
    [periodeStr, "", "", "", "", "", periodeStr, "", "", "", ""],
    ["NO", "POS-POS", "", "SUB-TOTAL", "TOTAL", "", "NO", "POS-POS", "", "SUB-TOTAL", "TOTAL"],
    ["AKUN", "", "", "", "", "", "AKUN", "", "", "", ""],
  ];

  const maxLen = Math.max(leftRows.length, rightRows.length);
  for (let i = 0; i < maxLen; i++) {
    const l = leftRows[i] ?? ["", "", "", "", ""];
    const r = rightRows[i] ?? ["", "", "", "", ""];
    neracaRows.push([...l, "", ...r]);
  }

  /* =======================================================================
   * 2. SHEET: LABA RUGI (RINCIAN COA LENGKAP 4-000 s/d 7-000)
   * ======================================================================= */
  const lrExcelRows: unknown[][] = [
    ["PT SYUKUR BERSAUDARA", "", "", "", ""],
    ["LAPORAN LABA-RUGI", "", "", "", ""],
    [periodeStr, "", "", "", ""],
    ["NO", "POS-POS", "", "SUB-TOTAL", "TOTAL"],
    ["AKUN", "", "", "", ""],
  ];

  // 4-000 PENDAPATAN
  lrExcelRows.push(["4-000", "P E N D A P A T A N", "", "", ""]);
  const revAccs = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("4-"));
  let totPendapatan = 0;
  for (const acc of revAccs) {
    const v = getSaldo(acc.kode);
    totPendapatan += v;
    lrExcelRows.push([acc.kode, acc.nama, "", v, ""]);
  }
  lrExcelRows.push(["", "Total Pendapatan", "", "", totPendapatan]);
  lrExcelRows.push(["", "", "", "", ""]);

  // 5-000 BEBAN POKOK PENDAPATAN (HPP)
  lrExcelRows.push(["5-000", "B E B A N   P O K O K   P E N D A P A T A N", "", "", ""]);
  const hppAccs = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("5-"));
  let totHpp = 0;
  for (const acc of hppAccs) {
    const v = getSaldo(acc.kode);
    totHpp += v;
    lrExcelRows.push([acc.kode, acc.nama, "", v, ""]);
  }
  lrExcelRows.push(["", "Total Beban Pokok Pendapatan", "", "", totHpp]);

  const labaKotor = totPendapatan - totHpp;
  lrExcelRows.push(["", "LABA KOTOR", "", "", labaKotor]);
  lrExcelRows.push(["", "", "", "", ""]);

  // 6-000 BIAYA USAHA (OPERASIONAL)
  lrExcelRows.push(["6-000", "B I A Y A   U S A H A", "", "", ""]);
  const opexAccs = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("6-"));
  let totOpex = 0;
  for (const acc of opexAccs) {
    const v = getSaldo(acc.kode);
    totOpex += v;
    lrExcelRows.push([acc.kode, acc.nama, "", v, ""]);
  }
  lrExcelRows.push(["", "Jumlah Biaya Usaha", "", "", totOpex]);

  const labaUsaha = labaKotor - totOpex;
  lrExcelRows.push(["", "LABA USAHA", "", "", labaUsaha]);
  lrExcelRows.push(["", "", "", "", ""]);

  // 7-000 PENDAPATAN & BIAYA LAIN-LAIN
  lrExcelRows.push(["7-000", "P E N D A P A T A N   &   B I A Y A   L A I N - L A I N", "", "", ""]);
  const otherAccs = Array.from(coaMap.values()).filter((c) => c.kode.startsWith("7-"));
  let totOtherIncome = 0;
  let totOtherExpense = 0;
  for (const acc of otherAccs) {
    const v = getSaldo(acc.kode);
    // 7-100 / 7-200 = pendapatan lain, 7-300 / 7-400 = biaya lain
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

  /* =======================================================================
   * 3. SHEET: DASHBOARD & VISUAL GRAFIK
   * ======================================================================= */
  const marginPct = totPendapatan > 0 ? (labaBersih / totPendapatan) * 100 : 0;
  const hppPct = totPendapatan > 0 ? (totHpp / totPendapatan) * 100 : 0;
  const opexPct = totPendapatan > 0 ? (totOpex / totPendapatan) * 100 : 0;

  const dashboardRows: unknown[][] = [
    ["PT SYUKUR BERSAUDARA", "", "", "", ""],
    ["RINGKASAN & GRAFIK KEUANGAN EKSEKUTIF", "", "", "", ""],
    [periodeStr, "", "", "", ""],
    [],
    ["INDIKATOR KEUANGAN UTAMA (KPI)", "NILAI (RP)", "STATUS / TARGET", "VISUAL BAR", "% DARI PENDAPATAN"],
    ["Total Pendapatan (Revenue)", totPendapatan, "Utama", makeBar(100), 100],
    ["Beban Pokok Pendapatan (HPP)", totHpp, "Biaya Proyek", makeBar(hppPct), `${hppPct.toFixed(1)}%`],
    ["Laba Kotor (Gross Profit)", labaKotor, labaKotor >= 0 ? "Sehat" : "Defisit", makeBar(100 - hppPct), `${(100 - hppPct).toFixed(1)}%`],
    ["Biaya Usaha / Operasional (Opex)", totOpex, "Overhead", makeBar(opexPct), `${opexPct.toFixed(1)}%`],
    ["Laba Bersih (Net Profit)", labaBersih, labaBersih >= 0 ? "SURPLUS" : "DEFISIT", makeBar(marginPct), `${marginPct.toFixed(1)}%`],
    [],
    ["STRUKTUR NERACA & POSISI KEUANGAN", "NILAI (RP)", "KOMPOSISI", "VISUAL BAR", ""],
    ["Total Aktiva (Aset Galangan)", grandTotalAktiva, "100%", makeBar(100), ""],
    ["- Aktiva Lancar (Kas/Bank/Piutang)", sumAktivaLancar, `${((sumAktivaLancar / (grandTotalAktiva || 1)) * 100).toFixed(1)}%`, makeBar((sumAktivaLancar / (grandTotalAktiva || 1)) * 100), ""],
    ["- Aktiva Tetap Bersih (Aset Fisik)", nilaiBukuTetap, `${((nilaiBukuTetap / (grandTotalAktiva || 1)) * 100).toFixed(1)}%`, makeBar((nilaiBukuTetap / (grandTotalAktiva || 1)) * 100), ""],
    ["Total Kewajiban (Hutang)", sumKewajibanLancar + sumKewajibanJp, `${(((sumKewajibanLancar + sumKewajibanJp) / (grandTotalPasiva || 1)) * 100).toFixed(1)}%`, makeBar(((sumKewajibanLancar + sumKewajibanJp) / (grandTotalPasiva || 1)) * 100), ""],
    ["Total Ekuitas (Modal & Laba)", sumEkuitas, `${((sumEkuitas / (grandTotalPasiva || 1)) * 100).toFixed(1)}%`, makeBar((sumEkuitas / (grandTotalPasiva || 1)) * 100), ""],
    [],
    ["DATA TREN BULANAN (SIAP BUAT GRAFIK EXCEL)", "PENDAPATAN", "HPP", "OPEX", "LABA BERSIH"],
    ...plMonthly.map((p) => [p.period, p.revenue, p.costProj, p.salary, p.laba]),
  ];

  /* =======================================================================
   * 4. SHEET: NERACA LAJUR (10 KOLOM)
   * ======================================================================= */
  const neracaLajurRows: unknown[][] = [
    ["NERACA LAJUR", "", "", "", "", "", "", "", "", ""],
    [periodeStr, "", "", "", "", "", "", "", "", ""],
    ["NO", "NAMA AKUN", "AKUN", "NERACA SALDO", "", "AKUN", "LABA-RUGI", "", "NERACA", ""],
    ["AKUN", "", "D/K", "DEBIT", "KREDIT", "NR/LR", "DEBIT", "KREDIT", "DEBIT", "KREDIT"],
  ];

  let nsTotD = 0, nsTotK = 0, lrTotD = 0, lrTotK = 0, nrTotD = 0, nrTotK = 0;

  for (const c of Array.from(coaMap.values())) {
    const d = debitMap.get(c.kode) ?? 0;
    const k = kreditMap.get(c.kode) ?? 0;
    const net = d - k;
    let nsD = 0, nsK = 0;
    if (net >= 0) nsD = net;
    else nsK = Math.abs(net);

    let lrD = 0, lrK = 0, nrD = 0, nrK = 0;
    if (c.nrlr === "LR") {
      lrD = nsD;
      lrK = nsK;
    } else {
      nrD = nsD;
      nrK = nsK;
    }

    nsTotD += nsD; nsTotK += nsK;
    lrTotD += lrD; lrTotK += lrK;
    nrTotD += nrD; nrTotK += nrK;

    neracaLajurRows.push([
      c.kode, c.nama, c.dk,
      nsD, nsK,
      c.nrlr,
      lrD, lrK,
      nrD, nrK,
    ]);
  }

  neracaLajurRows.push([
    "JUMLAH", "", "",
    nsTotD, nsTotK,
    "",
    lrTotD, lrTotK,
    nrTotD, nrTotK,
  ]);

  /* =======================================================================
   * 5. SHEET: JU, KAS, BANK
   * ======================================================================= */
  const kasBankRows: unknown[][] = [
    ["BANK & JURNAL TRANSAKSI", "", "", "", "", "", "", "", ""],
    [periodeStr, "", "", "", "", "", "", "", ""],
  ];

  if (kasLiveRows.length > 0) {
    kasBankRows.push(
      ["REKAPITULASI REKENING KAS & BANK", "", "", "", "", "", "", "", ""],
      ["KODE", "NAMA REKENING", "SALDO AWAL", "MUTASI MASUK", "MUTASI KELUAR", "SALDO AKHIR", "", "", ""],
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
    ["RINCIAN TRANSAKSI KAS & BANK (BUKU KAS / BANK)", "", "", "", "", "", "", "", ""],
    ["TANGGAL", "KODE PEMBANTU", "DOKUMEN", "URAIAN", "AKUN DB", "AKUN KR", "KAS DEBIT", "KAS KREDIT", "SALDO"],
    ["", "PEMBANTU", "", "", "DB", "KR", "DEBIT", "KREDIT", ""],
  );

  let rollingSaldo = 0;
  for (const j of manJournals) {
    if (j.status === "Void") continue;
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
    ["HUTANG DAGANG", "", "", ""],
    [periodeStr, "", "", ""],
    ["NO", "KODE PEMBANTU", "SALDO AWAL BULAN", "AKHIR SALDO"],
  ];
  hutLive.forEach((h, idx) => {
    hutangRows.push([idx + 1, h.v, Math.round(h.total), Math.round(h.total)]);
  });

  /* =======================================================================
   * 7. SHEET: PIUTANG
   * ======================================================================= */
  const piutangRows: unknown[][] = [
    ["PIUTANG USAHA", "", "", ""],
    [periodeStr, "", "", ""],
    ["NO", "KODE PEMBANTU", "SALDO AWAL BULAN", "AKHIR BULAN"],
  ];
  piuLive.forEach((p, idx) => {
    piutangRows.push([idx + 1, p.c, Math.round(p.total), Math.round(p.total)]);
  });

  /* =======================================================================
   * 8. SHEET: BUKU BESAR
   * ======================================================================= */
  const bbRows: unknown[][] = [
    ["BUKU BESAR", "", "", "", "", ""],
    [periodeStr, "", "", "", "", ""],
    ["KODE AKUN", "NAMA AKUN", "D/K", "TOTAL DEBIT", "TOTAL KREDIT", "SALDO AKHIR"],
  ];
  for (const c of Array.from(coaMap.values())) {
    const d = debitMap.get(c.kode) ?? 0;
    const k = kreditMap.get(c.kode) ?? 0;
    const saldo = getSaldo(c.kode);
    bbRows.push([c.kode, c.nama, c.dk, d, k, saldo]);
  }

  /* =======================================================================
   * 9. SHEET: AKUN (COA)
   * ======================================================================= */
  const akunRows: unknown[][] = [
    ["DAFTAR AKUN", "", "", ""],
    ["NO AKUN", "NAMA AKUN", "AKUN D/K", "AKUN NR/LR"],
  ];
  for (const c of Array.from(coaMap.values())) {
    akunRows.push([c.kode, c.nama, c.dk, c.nrlr]);
  }

  return [
    { name: "Dashboard & Grafik", rows: dashboardRows },
    { name: "Neraca", rows: neracaRows },
    { name: "Laba Rugi", rows: lrExcelRows },
    { name: "Neraca Lajur", rows: neracaLajurRows },
    { name: "JU, Kas, Bank", rows: kasBankRows },
    { name: "Hutang", rows: hutangRows },
    { name: "Piutang", rows: piutangRows },
    { name: "Buku Besar", rows: bbRows },
    { name: "Akun", rows: akunRows },
  ];
}

