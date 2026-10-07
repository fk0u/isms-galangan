import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Generator data sintetis untuk seed:bulk (F0-02)
// Menggunakan Mulberry32 PRNG dengan seed deterministik (42).
// Menghasilkan 11 file JSON di services/api/seed-data-synthetic/
// dengan skema dan jumlah baris identik dengan kebutuhan seedBulk.ts,
// tanpa memuat data riil (nama orang riil, rekening riil, email riil).

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(here, "../seed-data-synthetic");

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const VENDOR_PREFIXES = ["PT", "CV", "UD"];
const VENDOR_NAMES = [
  "Baja Utama Borneo", "Samudra Logam Perkasa", "Borneo Maritim Teknik",
  "Kaltim Sumber Makmur", "Mitra Steel Mandiri", "Cipta Karya Bahari",
  "Pelumas Nusantara Indah", "Multi Teknik Galangan", "Dua Saudara Marine",
  "Pilar Energi Borneo", "Bina Mahakam Mandiri", "Surya Samudra Perkasa",
  "Delta Perkasa Teknik", "Harapan Jaya Logam", "Karya Bersama Steel",
  "Sentosa Marine Supply", "Indo Baja Lestari", "Tridaya Teknik Marine"
];

const CLIENT_NAMES = [
  "PT Pelayaran Samudra Nusantara", "PT Borneo Trans Logistik", "PT Mahakam Energi Maritim",
  "PT Barito Coal Transport", "PT Samudra Perkasa Abadi", "PT Kutai Bahari Shipping",
  "PT Nusantara Lines Maritim", "PT Pelayaran Kaltim Jaya", "PT Berau Coal Trans",
  "PT Mega Pratama Shipping", "PT Bintang Laut Transport", "PT Arung Samudra Lines"
];

const VESSEL_NAMES = [
  "TB Nusantara 01", "TB Mahakam Jaya 09", "TB Borneo Star 02", "TB Barito Perkasa 07",
  "TB Kutai Indah 03", "TB Samudra Trans 05", "BG Samudra 3001", "BG Mahakam 3302",
  "BG Borneo Coal 3005", "TB Paser Pratama 06", "TB Segara Mas 08", "BG Bahari 2701"
];

const ITEM_CATEGORIES = [
  { name: "Plat Baja BKI", units: ["lembar", "kg"], minCost: 14000, maxCost: 18000 },
  { name: "Pipa Seamless Sch40", units: ["btg", "meter"], minCost: 450000, maxCost: 1200000 },
  { name: "Cat Epoxy Primer", units: ["pail", "liter"], minCost: 85000, maxCost: 120000 },
  { name: "Kawat Las E7018", units: ["dus", "kg"], minCost: 35000, maxCost: 65000 },
  { name: "Baut Mur Hex Galvanis", units: ["pcs", "set"], minCost: 3500, maxCost: 15000 },
  { name: "Zinc Anode 10kg", units: ["pcs"], minCost: 180000, maxCost: 240000 },
  { name: "Kabel Laut Marine", units: ["roll", "meter"], minCost: 120000, maxCost: 350000 },
  { name: "Valve Globe Bronze", units: ["pcs"], minCost: 650000, maxCost: 1800000 },
  { name: "Bearing Main Engine", units: ["pcs"], minCost: 350000, maxCost: 1500000 },
  { name: "Oli Mesin Diesel SAE 40", units: ["drum", "liter"], minCost: 45000, maxCost: 75000 },
  { name: "Helm & Rompi Safety K3", units: ["pcs", "set"], minCost: 150000, maxCost: 450000 },
];

const PIC_NAMES = ["Ahmad Fauzi", "Joko Susilo", "Rudi Hartono", "Dedi Prasetyo", "Budi Santoso", "Hendra Wijaya", "Wawan Kurniawan", "Agus Setiawan", "Rian Hidayat", "Bambang Irawan"];

function genTonase() {
  return {
    plat_5x20: [
      ["8.0", "1884.0"], ["9.0", "2119.5"], ["10.0", "2355.0"], ["11.0", "2590.5"],
      ["12.0", "2826.0"], ["14.0", "3297.0"], ["15.0", "3532.5"], ["16.0", "3768.0"],
      ["18.0", "4239.0"], ["19.0", "4474.5"], ["20.0", "4710.0"], ["22.0", "5181.0"],
      ["24.0", "5652.0"], ["25.0", "5887.5"], ["28.0", "6594.0"], ["30.0", "7065.0"],
      ["32.0", "7536.0"], ["35.0", "8242.5"], ["38.0", "8949.0"], ["40.0", "9420.0"],
      ["42.0", "9891.0"], ["45.0", "10597.5"], ["50.0", "11775.0"]
    ],
    plat_6x20: [
      ["8.0", "2260.8"], ["9.0", "2543.4"], ["10.0", "2826.0"], ["11.0", "3108.6"],
      ["12.0", "3391.2"], ["14.0", "3956.4"], ["15.0", "4239.0"], ["16.0", "4521.6"],
      ["18.0", "5086.8"], ["19.0", "5369.4"], ["20.0", "5652.0"], ["22.0", "6217.2"],
      ["24.0", "6782.4"], ["25.0", "7065.0"], ["28.0", "7912.8"], ["30.0", "8478.0"],
      ["32.0", "9043.2"], ["35.0", "9891.0"], ["38.0", "10738.8"], ["40.0", "11304.0"],
      ["42.0", "11869.2"], ["45.0", "12717.0"], ["50.0", "14130.0"]
    ],
    plat_bordes_4x8: [
      ["2.3", "67.7"], ["3.0", "85.8"], ["3.2", "91.3"], ["4.0", "113.1"],
      ["4.5", "126.6"], ["6.0", "167.3"], ["8.0", "222.0"]
    ],
    hbeam: [
      ["100 x 100", "21.4", "257.0"], ["125 x 125", "23.8", "286.0"],
      ["150 x 150", "31.5", "378.0"], ["175 x 175", "40.2", "482.0"],
      ["200 x 200", "49.9", "599.0"], ["250 x 250", "72.4", "869.0"],
      ["300 x 300", "94.0", "1128.0"], ["350 x 350", "137.0", "1644.0"],
      ["400 x 400", "172.0", "2064.0"], ["148 x 100", "21.1", "253.0"],
      ["198 x 149", "32.0", "384.0"], ["248 x 199", "45.0", "540.0"],
      ["298 x 201", "56.0", "672.0"], ["346 x 250", "79.0", "948.0"],
      ["394 x 398", "147.0", "1764.0"]
    ],
    siku_a: [
      ["40 x 40 x 3", "1.8"], ["40 x 40 x 4", "2.4"], ["40 x 40 x 5", "3.0"],
      ["50 x 50 x 4", "3.1"], ["50 x 50 x 5", "3.8"], ["50 x 50 x 6", "4.4"],
      ["60 x 60 x 5", "4.6"], ["60 x 60 x 6", "5.4"], ["65 x 65 x 6", "5.9"],
      ["70 x 70 x 6", "6.4"], ["70 x 70 x 7", "7.4"], ["75 x 75 x 6", "6.9"],
      ["75 x 75 x 8", "9.0"], ["80 x 80 x 8", "9.7"], ["90 x 90 x 9", "12.2"],
      ["100 x 100 x 8", "12.3"], ["100 x 100 x 10", "15.1"], ["120 x 120 x 10", "18.2"],
      ["120 x 120 x 12", "21.6"], ["130 x 130 x 12", "23.6"], ["150 x 150 x 12", "27.3"],
      ["150 x 150 x 15", "33.8"], ["200 x 200 x 20", "59.7"]
    ],
    siku_b: [
      ["50 x 30 x 4", "2.4"], ["60 x 40 x 5", "3.8"], ["65 x 50 x 5", "4.4"],
      ["70 x 45 x 6", "5.2"], ["75 x 50 x 6", "5.7"], ["80 x 60 x 6", "6.4"],
      ["90 x 60 x 6", "6.9"], ["90 x 75 x 6", "7.6"], ["100 x 50 x 6", "6.9"],
      ["100 x 65 x 7", "8.8"], ["100 x 75 x 7", "9.3"], ["120 x 80 x 8", "12.2"],
      ["125 x 75 x 7", "10.7"], ["125 x 75 x 10", "14.9"], ["135 x 65 x 8", "12.2"],
      ["150 x 75 x 9", "15.4"], ["150 x 90 x 9", "16.5"], ["150 x 100 x 10", "19.0"],
      ["175 x 90 x 10", "20.2"], ["200 x 100 x 10", "23.0"], ["200 x 150 x 12", "31.9"],
      ["250 x 90 x 12", "31.1"]
    ],
    strip: [
      ["19 x 3", "0.45", "2.7"], ["25 x 3", "0.59", "3.5"], ["25 x 5", "0.98", "5.9"],
      ["32 x 3", "0.75", "4.5"], ["32 x 5", "1.26", "7.6"], ["38 x 3", "0.89", "5.4"],
      ["38 x 6", "1.79", "10.7"], ["50 x 3", "1.18", "7.1"], ["50 x 5", "1.96", "11.8"],
      ["50 x 6", "2.36", "14.1"], ["50 x 9", "3.53", "21.2"], ["65 x 6", "3.06", "18.4"],
      ["65 x 9", "4.59", "27.6"], ["75 x 6", "3.53", "21.2"], ["75 x 9", "5.30", "31.8"],
      ["75 x 12", "7.07", "42.4"], ["100 x 6", "4.71", "28.3"], ["100 x 9", "7.07", "42.4"],
      ["100 x 12", "9.42", "56.5"], ["125 x 9", "8.83", "53.0"], ["125 x 12", "11.78", "70.7"],
      ["150 x 9", "10.60", "63.6"], ["150 x 12", "14.13", "84.8"]
    ],
    roundbar: [
      { size: "6 mm", batang6m: "1.33", kgm: "0.222" },
      { size: "8 mm", batang6m: "2.37", kgm: "0.395" },
      { size: "10 mm", batang6m: "3.70", kgm: "0.617" },
      { size: "12 mm", batang6m: "5.33", kgm: "0.888" },
      { size: "16 mm", batang6m: "9.47", kgm: "1.578" },
      { size: "19 mm", batang6m: "13.35", kgm: "2.226" },
      { size: "22 mm", batang6m: "17.90", kgm: "2.984" },
      { size: "25 mm", batang6m: "23.12", kgm: "3.853" },
      { size: "28 mm", batang6m: "28.99", kgm: "4.832" },
      { size: "32 mm", batang6m: "37.88", kgm: "6.313" },
      { size: "36 mm", batang6m: "47.94", kgm: "7.990" },
      { size: "40 mm", batang6m: "59.19", kgm: "9.865" },
      { size: "45 mm", batang6m: "74.91", kgm: "12.485" },
      { size: "50 mm", batang6m: "92.48", kgm: "15.413" },
      { size: "60 mm", batang6m: "133.17", kgm: "22.195" },
      { size: "70 mm", batang6m: "181.26", kgm: "30.210" },
      { size: "80 mm", batang6m: "236.75", kgm: "39.458" },
      { size: "100 mm", batang6m: "369.92", kgm: "61.653" }
    ]
  };
}

function genSubkon() {
  return {
    title: "RINCIAN PEKERJAAN TB NUSANTARA 01 (CV MANDIRI TEKNIK)",
    sub: "Pak Yusuf",
    vessel: "TB Nusantara 01",
    lines: [
      {
        row: 7,
        uraian: "∟ Ganti Baru Ban Daprah Ø 1200",
        cols: ["", "∟", "Ganti Baru Ban Daprah Ø 1200", "", "", "", "", "", "", "", "", ""]
      },
      {
        row: 9,
        uraian: "2 Ganti Baru Tanda Selar (Number Hull)",
        cols: ["2", "Ganti Baru Tanda Selar (Number Hull)", "", "", "", "", "", "", "", "", "", ""]
      },
      {
        row: 10,
        uraian: "∟ Plate",
        cols: ["", "∟", "Plate", "", "", "", "", "1530", "x", "300", "x", "8"]
      },
      {
        row: 12,
        uraian: "⌐",
        cols: ["", "", "⌐", "Plate", "", "", "", "100", "x", "100", "x", "8"]
      },
      {
        row: 14,
        uraian: "5 Dilakukan pressure test tank",
        cols: ["5", "Dilakukan pressure test tank", "", "", "", "", "", "", "", "", "", ""]
      }
    ],
    subtotal: 300000,
    pph: -1500,
    total: 298500,
    note: "Pph untuk setiap pemborong/subkontaktor bisa berbeda; 0.5% dan 2%",
    brokenRef: {
      row: 108,
      formula: "=#REF!+#REF!"
    }
  };
}

function genHutang() {
  const items: Array<Record<string, unknown>> = [];
  for (let i = 1; i <= 48; i++) {
    const vPrefix = randChoice(VENDOR_PREFIXES);
    const vName = randChoice(VENDOR_NAMES);
    const vendor = `${vPrefix} ${vName}`;
    const amount = randInt(15, 450) * 1000000;
    const isPaid = rng() > 0.4;
    const pay1 = isPaid ? Math.round(amount * (rng() > 0.5 ? 1 : 0.5)) : 0;
    const pay2 = isPaid && pay1 < amount ? amount - pay1 : 0;
    items.push({
      id: String(i),
      vendor,
      tglTagihan: `2026-0${randInt(5, 9)}-${String(randInt(1, 28)).padStart(2, "0")}`,
      noPo: `PO-2026-${String(randInt(100, 999))}`,
      noInvoice: `INV-${String(randInt(1000, 9999))}`,
      keterangan: randChoice(VESSEL_NAMES),
      jenisBarang: randChoice(ITEM_CATEGORIES).name,
      jumlah: amount,
      pay1: pay1 || null,
      pay1note: pay1 ? `${randInt(1, 28)}/08/26 Bayar termin 1 (Bank)` : null,
      pay2: pay2 || null,
      pay2note: pay2 ? `${randInt(1, 28)}/09/26 Pelunasan (Bank)` : null,
    });
  }
  return { bank: "Bank Mandiri 000-0000-101", items };
}

function genWarehouse() {
  // Generate 139 suppliers
  const suppliers: Array<{ kode: string; nama: string }> = [];
  for (let i = 1; i <= 139; i++) {
    const pfx = randChoice(VENDOR_PREFIXES);
    const nm = randChoice(VENDOR_NAMES);
    suppliers.push({
      kode: `SUP-${String(i).padStart(3, "0")}`,
      nama: `${pfx} ${nm} ${i}`,
    });
  }

  // Generate 4784 barang
  const barang: Array<{ kode: string; nama: string }> = [];
  for (let i = 1; i <= 4784; i++) {
    const cat = randChoice(ITEM_CATEGORIES);
    const specNum = randInt(1, 99);
    barang.push({
      kode: `BRG-${String(i).padStart(4, "0")}`,
      nama: `${cat.name} Spec-${specNum} (${cat.units[0]})`,
    });
  }

  // Generate warehouse_stock (2986 items)
  const stock: Array<{ kode: string; nama: string; awal: number; masuk: number; keluar: number; akhir: number }> = [];
  for (let i = 0; i < 2986; i++) {
    const b = barang[i];
    const awal = randInt(10, 500);
    const masuk = randInt(5, 250);
    const keluar = randInt(0, awal + masuk - 5);
    const akhir = awal + masuk - keluar;
    stock.push({
      kode: b.kode,
      nama: b.nama,
      awal,
      masuk,
      keluar,
      akhir,
    });
  }

  // Generate warehouse_in (2668 items)
  const win: Array<Record<string, unknown>> = [];
  for (let i = 1; i <= 2668; i++) {
    const b = randChoice(barang);
    const s = randChoice(suppliers);
    const cat = ITEM_CATEGORIES.find((c) => b.nama.startsWith(c.name)) ?? ITEM_CATEGORIES[0];
    const qty = randInt(1, 50);
    const unitPrice = randInt(cat.minCost, cat.maxCost);
    const subtotal = qty * unitPrice;
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + tax;
    win.push({
      tanggal: `2026-0${randInt(1, 9)}-${String(randInt(1, 28)).padStart(2, "0")}`,
      kode: b.kode,
      nama: b.nama,
      supKode: s.kode,
      supNama: s.nama,
      jumlah: qty,
      satuan: cat.units[0],
      hargaNonPpn: unitPrice,
      pajak: tax,
      total,
      vendor: s.nama,
      purpose: randChoice(["Stok Gudang Samarinda", "Kebutuhan Proyek"]),
    });
  }

  // Generate warehouse_out (16260 items)
  const wout: Array<Record<string, unknown>> = [];
  for (let i = 1; i <= 16260; i++) {
    const b = randChoice(barang);
    const cat = ITEM_CATEGORIES.find((c) => b.nama.startsWith(c.name)) ?? ITEM_CATEGORIES[0];
    const qty = randInt(1, 20);
    wout.push({
      tanggal: `2026-0${randInt(1, 9)}-${String(randInt(1, 28)).padStart(2, "0")}`,
      purpose: randChoice(VESSEL_NAMES),
      kode: b.kode,
      nama: b.nama,
      jumlah: qty,
      satuan: cat.units[0],
      pic: randChoice(PIC_NAMES),
      keterangan: randChoice(["Pekerjaan reparasi hull", "Penggantian pipa", "Pengecatan deck", "Overhaul mesin", "Inspeksi rutin"]),
    });
  }

  return { suppliers, barang, stock, win, wout };
}

function genFinance() {
  const fhutang: Array<{ no: string; nama: string; saldoAwal: number; saldoAkhir: number }> = [];
  for (let i = 1; i <= 54; i++) {
    const pfx = randChoice(VENDOR_PREFIXES);
    const nm = randChoice(VENDOR_NAMES);
    const awal = randInt(10, 300) * 1000000;
    const akhir = Math.round(awal * (rng() > 0.3 ? 0.3 : 1));
    fhutang.push({
      no: String(i),
      nama: `${pfx} ${nm} ${i}`,
      saldoAwal: awal,
      saldoAkhir: akhir,
    });
  }

  const fpiu: Array<{ no: string; nama: string; saldoAwal: number; saldoAkhir: number }> = [];
  for (let i = 1; i <= 65; i++) {
    const nm = randChoice(CLIENT_NAMES);
    const awal = randInt(50, 800) * 1000000;
    const akhir = Math.round(awal * (rng() > 0.5 ? 0.2 : 0.8));
    fpiu.push({
      no: String(i),
      nama: `${nm} ${i}`,
      saldoAwal: awal,
      saldoAkhir: akhir,
    });
  }

  const banks = [
    { nama: "Bank Mandiri 000-0000-101", debit: 2500000000, saldo: 3450000000 },
    { nama: "Bank BCA 000-0000-202", debit: 1200000000, saldo: 1850000000 },
    { nama: "Bank BNI 000-0000-303", debit: 800000000, saldo: 950000000 },
    { nama: "Bank BRI 000-0000-404", debit: 450000000, saldo: 600000000 }
  ];

  const jurnal: Array<Record<string, unknown>> = [];
  for (let i = 1; i <= 38; i++) {
    const debit = randInt(5, 150) * 1000000;
    const kredit = rng() > 0.5 ? debit : 0;
    jurnal.push({
      tanggal: `2026-08-${String(randInt(1, 28)).padStart(2, "0")}`,
      pihak: randChoice(VENDOR_NAMES),
      dok: `BKM-${String(randInt(100, 999))}`,
      uraian: randChoice(["Pembayaran tagihan vendor", "Penerimaan termin proyek", "Biaya operasional bengkel", "Beli sparepart mendesak"]),
      akunDb: "1110-Kas Bank",
      akunKr: "2110-Hutang Usaha",
      debit,
      kredit,
      saldo: debit - kredit,
    });
  }

  const faset: Array<Record<string, unknown>> = [];
  const ASSET_NAMES = [
    "Mesin Las Inverter 400A", "Overhead Crane 10 Ton", "Kompresor Screw 50 HP",
    "Plasma Cutting CNC", "Hydroblasting Unit 500 Bar", "Forklift 5 Ton",
    "Genset 250 KVA", "Mesin Bending Plat", "Mesin Bubut Heavy Duty",
    "Airless Spray Painting Unit", "Truk Crane 8 Ton", "Winch Elektrik 20 Ton"
  ];

  for (let i = 1; i <= 88; i++) {
    const nilai = randInt(25, 450) * 1000000;
    const susutTahun = Math.round(nilai * 0.125);
    const akumulasi = susutTahun * randInt(1, 3);
    faset.push({
      no: i,
      nama: `${randChoice(ASSET_NAMES)} #${i}`,
      kelompok: randChoice(["Golongan 1", "Golongan 2", "Mesin & Peralatan"]),
      bln: randInt(1, 12),
      thn: randInt(2021, 2025),
      nilai,
      sisaAwal: Math.max(0, nilai - akumulasi),
      metKomersial: "Garis Lurus",
      metFiskal: "Garis Lurus",
      susutTahun,
      akumulasi,
    });
  }

  return { fhutang, fpiu, banks, jurnal, faset };
}

function main() {
  console.log(`[seed:gen] Menghasilkan data sintetis ke ${OUT_DIR}...`);
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 1. tonase.json
  fs.writeFileSync(path.join(OUT_DIR, "tonase.json"), JSON.stringify(genTonase(), null, 2));

  // 2. subkon.json
  fs.writeFileSync(path.join(OUT_DIR, "subkon.json"), JSON.stringify(genSubkon(), null, 2));

  // 3. hutang.json
  fs.writeFileSync(path.join(OUT_DIR, "hutang.json"), JSON.stringify(genHutang(), null, 2));

  // 4-7. warehouse files
  const wh = genWarehouse();
  fs.writeFileSync(path.join(OUT_DIR, "warehouse_kode.json"), JSON.stringify({ barang: wh.barang, supplier: wh.suppliers }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "warehouse_stock.json"), JSON.stringify(wh.stock, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "warehouse_in.json"), JSON.stringify(wh.win, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "warehouse_out.json"), JSON.stringify(wh.wout, null, 2));

  // 8-11. finance files
  const fin = genFinance();
  fs.writeFileSync(path.join(OUT_DIR, "finance_hutang.json"), JSON.stringify(fin.fhutang, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "finance_piutang.json"), JSON.stringify(fin.fpiu, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "finance_bank.json"), JSON.stringify({ banks: fin.banks, jurnal: fin.jurnal }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "finance_aset.json"), JSON.stringify(fin.faset, null, 2));

  console.log("[seed:gen] Selesai: 11 berkas data sintetis berhasil dibuat.");
}

main();
