import {
  buildUnitConversion,
  conversionRuleForCategory,
  defaultPurchaseUnitForCategory,
  formatUnitConversion,
  hasUnitConversionDraft,
  purchaseUnitsForCategory,
  unitConversionOf,
} from "../src/utils/unitConversion";

declare const process: { exit(code: number): never };
let failures = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.error(`FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

const cat = buildUnitConversion("Cat", "drum", { conversionAmount: "200" });
assert("Kategori Cat memakai konversi volume", conversionRuleForCategory("Cat")?.kind === "volume");
assert("Kategori Cairan memakai konversi volume", conversionRuleForCategory("Cairan")?.baseUnit === "liter");
assert("Satuan default Cat dipilih sebagai drum", defaultPurchaseUnitForCategory("Cat", "pcs") === "drum");
assert("Satuan Plat dibatasi ke lembar", purchaseUnitsForCategory("Plat", "").join(",") === "lembar");
assert("Konversi Cat menolak satuan pembelian yang tak sesuai", buildUnitConversion("Cat", "pcs", { conversionAmount: "200" }) === null);
assert("1 drum cat tersimpan sebagai 200 liter", cat?.baseUnit === "liter" && cat.perUnit === 200);
assert("Ringkasan memenuhi format 1 drum = 200 L", formatUnitConversion("drum", cat, "id") === "1 drum = 200 L");
assert("Nilai volume nol ditolak", buildUnitConversion("Cat", "drum", { conversionAmount: "0" }) === null);

const plate = buildUnitConversion("Plat", "lembar", {
  conversionLengthMm: "6000",
  conversionWidthMm: "1500",
  conversionThicknessMm: "10",
  conversionWeightKg: "706.5",
});
assert("Plat menyimpan berat dasar dan dimensi millimeter", plate?.baseUnit === "kg"
  && plate.perUnit === 706.5
  && plate.dims?.lengthMm === 6000
  && plate.dims.widthMm === 1500
  && plate.dims.thicknessMm === 10);
assert("Plat menolak ukuran yang belum lengkap", buildUnitConversion("Pelat", "lembar", {
  conversionLengthMm: "6000",
  conversionWidthMm: "1500",
  conversionWeightKg: "706.5",
}) === null);

const pipe = buildUnitConversion("Pipa", "batang", {
  conversionLengthMm: "6000",
  conversionWeightKg: "24",
});
assert("Pipa menyimpan panjang dasar meter dan berat per batang", pipe?.baseUnit === "meter"
  && pipe.perUnit === 6
  && pipe.dims?.lengthMm === 6000
  && pipe.dims.weightKg === 24);
assert("Besi menggunakan aturan batang", conversionRuleForCategory("Besi")?.kind === "bar");

const tonnage = buildUnitConversion("Tonase", "ton", { conversionAmount: "1000" });
assert("Tonase disimpan dalam kg per satuan pembelian", tonnage?.baseUnit === "kg" && tonnage.perUnit === 1000);
assert("Konversi kategori bebas menyimpan satuan dasar yang diberikan", buildUnitConversion("Listrik", "roll", {
  conversionBaseUnit: "meter",
  conversionAmount: "100",
})?.perUnit === 100);
assert("Draft kosong tidak dianggap sebagai konversi", !hasUnitConversionDraft({}));
assert("Draft generik terdeteksi", hasUnitConversionDraft({ conversionBaseUnit: "meter" }));

const roundTrip = unitConversionOf({ conversion: plate });
assert("Konversi baru dapat dibaca kembali dengan dimensi", roundTrip?.perUnit === 706.5
  && roundTrip.dims?.thicknessMm === 10);
const legacy = unitConversionOf({ uom2: "liter", konversi: 200 });
assert("Field UOM2 lama tetap terbaca sebagai konversi", legacy?.baseUnit === "liter" && legacy.perUnit === 200);
assert("Konversi tidak valid ditolak saat dibaca", unitConversionOf({ conversion: { baseUnit: "liter", perUnit: -1 } }) === null);

if (failures > 0) {
  console.error(`\n${failures} pemeriksaan unit-conversion gagal.`);
  process.exit(1);
}
console.log("Semua pemeriksaan konversi satuan (F3-G-02) lolos.");
