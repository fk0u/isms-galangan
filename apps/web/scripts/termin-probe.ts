import { buildTermins } from "../src/utils/termin";

/* F3-I-05: tiga skema menghasilkan termin dengan total tepat; pembulatan
   rupiah tanpa selisih. */
declare const process: { exit(code: number): never };
let failures = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.error(`FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}
const total = (r: ReturnType<typeof buildTermins>): number => (r.ok ? r.lines.reduce((s, l) => s + l.amount, 0) : -1);

const kontan = buildTermins(1_234_567_891, { type: "Kontan", parts: [] });
assert("Kontan = satu termin senilai kontrak", kontan.ok && kontan.lines.length === 1 && total(kontan) === 1_234_567_891);

const pct = buildTermins(1_000_000_001, { type: "Persentase", parts: [{ label: "A", pct: 33.33 }, { label: "B", pct: 33.33 }, { label: "C", pct: 33.34 }] });
assert("Persentase 33,33/33,33/33,34 total tepat", pct.ok && total(pct) === 1_000_000_001, JSON.stringify(pct));
assert("Semua nominal bilangan bulat", pct.ok && pct.lines.every((l) => Number.isInteger(l.amount)));
const pctBad = buildTermins(100_000_000, { type: "Persentase", parts: [{ label: "A", pct: 50 }, { label: "B", pct: 40 }] });
assert("Persentase ≠ 100% ditolak", !pctBad.ok);

const dp = buildTermins(500_000_000, { type: "DP", parts: [{ label: "DP 1", pct: 30 }, { label: "DP 2", amount: 125_000_000 }] });
assert("DP 30% + Rp125jt + pelunasan otomatis", dp.ok && dp.lines.length === 3 && dp.lines[2].label === "Pelunasan" && dp.lines[2].amount === 225_000_000 && total(dp) === 500_000_000, JSON.stringify(dp));
const dpOver = buildTermins(100_000_000, { type: "DP", parts: [{ label: "DP 1", amount: 150_000_000 }] });
assert("DP melebihi nilai ditolak", !dpOver.ok);
const dpOdd = buildTermins(999_999_999, { type: "DP", parts: [{ label: "DP 1", pct: 33.333 }] });
assert("DP persen ganjil: total tetap tepat", dpOdd.ok && total(dpOdd) === 999_999_999);
assert("Nilai 0 ditolak", !buildTermins(0, { type: "Kontan", parts: [] }).ok);

if (failures > 0) {
  console.error(`termin-probe: ${failures} gagal.`);
  process.exit(1);
}
console.log("Semua pemeriksaan skema termin (F3-I-05) lolos.");
