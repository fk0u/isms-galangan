/**
 * Konversi angka rupiah ke kalimat terbilang bahasa Indonesia & bahasa Inggris
 * untuk dokumen resmi / enterprise-grade (BoQ, Invoice, Kontrak).
 */

const ANGKA_ID = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

function angkaKeKataId(n: number): string {
  if (n < 12) return ANGKA_ID[n] ?? "";
  if (n < 20) return `${angkaKeKataId(n - 10)} Belas`;
  if (n < 100) return `${angkaKeKataId(Math.floor(n / 10))} Puluh ${angkaKeKataId(n % 10)}`.trim();
  if (n < 200) return `Seratus ${angkaKeKataId(n - 100)}`.trim();
  if (n < 1000) return `${angkaKeKataId(Math.floor(n / 100))} Ratus ${angkaKeKataId(n % 100)}`.trim();
  if (n < 2000) return `Seribu ${angkaKeKataId(n - 1000)}`.trim();
  if (n < 1000000) return `${angkaKeKataId(Math.floor(n / 1000))} Ribu ${angkaKeKataId(n % 1000)}`.trim();
  if (n < 1000000000) return `${angkaKeKataId(Math.floor(n / 1000000))} Juta ${angkaKeKataId(n % 1000000)}`.trim();
  if (n < 1000000000000) return `${angkaKeKataId(Math.floor(n / 1000000000))} Miliar ${angkaKeKataId(n % 1000000000)}`.trim();
  return `${angkaKeKataId(Math.floor(n / 1000000000000))} Triliun ${angkaKeKataId(n % 1000000000000)}`.trim();
}

export function terbilangRupiah(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  if (rounded === 0) return "Nol Rupiah";
  const kata = angkaKeKataId(rounded);
  return `${kata} Rupiah`;
}

const ONES_EN = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS_EN = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numToWordsEn(n: number): string {
  if (n < 20) return ONES_EN[n] ?? "";
  if (n < 100) return `${TENS_EN[Math.floor(n / 10)]} ${ONES_EN[n % 10]}`.trim();
  if (n < 1000) return `${ONES_EN[Math.floor(n / 100)]} Hundred ${numToWordsEn(n % 100)}`.trim();
  if (n < 1000000) return `${numToWordsEn(Math.floor(n / 1000))} Thousand ${numToWordsEn(n % 1000)}`.trim();
  if (n < 1000000000) return `${numToWordsEn(Math.floor(n / 1000000))} Million ${numToWordsEn(n % 1000000)}`.trim();
  if (n < 1000000000000) return `${numToWordsEn(Math.floor(n / 1000000000))} Billion ${numToWordsEn(n % 1000000000)}`.trim();
  return `${numToWordsEn(Math.floor(n / 1000000000000))} Trillion ${numToWordsEn(n % 1000000000000)}`.trim();
}

export function spelledOutCurrency(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  if (rounded === 0) return "Zero Indonesian Rupiah";
  return `${numToWordsEn(rounded)} Indonesian Rupiah`;
}
