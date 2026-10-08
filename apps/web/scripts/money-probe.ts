// Probe verifikasi format input uang dan parser rupiah (F3-A-02)
import "./browser-shims";
import { fmtRupiah, parseRupiah } from "../src/utils/format";

declare const process: { exit(code: number): never };

let failCount = 0;

function assert(name: string, ok: boolean, details?: string) {
  if (ok) {
    console.log(`PASS  ${name}`);
  } else {
    failCount++;
    console.error(`FAIL  ${name}${details ? ` -> ${details}` : ""}`);
  }
}

// Simulasi logika formatting MoneyInput
function formatMoneyDisplay(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits === "") return "";
  return Number(digits).toLocaleString("id-ID");
}

// Simulasi sanitasi onChange MoneyInput
function sanitizeMoneyInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

async function run() {
  console.log("=== ISMS Money Input & Parse Probe (F3-A-02) ===");

  // 1. Uji formatting 1000000 -> "1.000.000" dan fmtRupiah
  const formatted1M = formatMoneyDisplay("1000000");
  assert("Format 1000000 menghasilkan '1.000.000'", formatted1M === "1.000.000", `got: ${formatted1M}`);
  assert("fmtRupiah(1000000) menghasilkan 'Rp 1.000.000'", fmtRupiah(1000000) === "Rp 1.000.000");

  const formattedLarge = formatMoneyDisplay("15750000000");
  assert("Format 15750000000 menghasilkan '15.750.000.000'", formattedLarge === "15.750.000.000", `got: ${formattedLarge}`);

  // 2. Uji parse balik via parseRupiah
  assert("parseRupiah('1.000.000') menghasilkan 1000000", parseRupiah("1.000.000") === 1000000);
  assert("parseRupiah('Rp 1.000.000') menghasilkan 1000000", parseRupiah("Rp 1.000.000") === 1000000);
  assert("parseRupiah('15.750.000.000') menghasilkan 15750000000", parseRupiah("15.750.000.000") === 15750000000);
  assert("Round-trip format -> parse konsisten", parseRupiah(formatMoneyDisplay("25000000")) === 25000000);

  // 3. Uji nilai kosong / falsy
  assert("Format string kosong menghasilkan ''", formatMoneyDisplay("") === "");
  assert("parseRupiah('') menghasilkan 0", parseRupiah("") === 0);
  assert("parseRupiah(null) menghasilkan 0", parseRupiah(null as unknown as string) === 0);
  assert("parseRupiah(undefined) menghasilkan 0", parseRupiah(undefined as unknown as string) === 0);

  // 4. Uji input negatif ditolak / disanitasi menjadi digit murni
  const sanitizedNeg = sanitizeMoneyInput("-1000000");
  assert("Input negatif disanitasi tanpa tanda minus (-1000000 -> 1000000)", sanitizedNeg === "1000000", `got: ${sanitizedNeg}`);
  assert("Input karakter non-digit disanitasi (Rp 50.000,- -> 50000)", sanitizeMoneyInput("Rp 50.000,-") === "50000");

  // 5. Uji nilai tersimpan di record (invariant DB: number, bukan string bertitik)
  const mockPayload = {
    budget: parseRupiah(formatMoneyDisplay("500000000")),
    rate: parseRupiah("1.500.000"),
    amount: parseRupiah("10.000.000"),
  };
  assert("Field tersimpan bertipe number", typeof mockPayload.budget === "number" && typeof mockPayload.rate === "number");
  assert("Field tersimpan bernilai number murni tanpa titik", mockPayload.budget === 500000000 && mockPayload.rate === 1500000);
  assert("Field tersimpan bukan NaN", !Number.isNaN(mockPayload.amount));

  if (failCount > 0) {
    console.error(`\nGAGAL: ${failCount} pemeriksaan money input gagal.`);
    process.exit(1);
  }
  console.log("Semua pemeriksaan format dan parsing input harga (F3-A-02) lolos.\n");
  process.exit(0);
}

void run();
