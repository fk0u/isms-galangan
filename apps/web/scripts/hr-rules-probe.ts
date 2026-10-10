import { ptkpCode, parsePtkp } from "../src/utils/ptkp";
import { applyWeeklyCap, dailyOvertime, weekKey, workedHours } from "../src/utils/overtime";

/* F3-L-02 (PTKP, 8 kombinasi) & F3-L-07 (lembur otomatis). */
declare const process: { exit(code: number): never };
let failures = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) console.log(`PASS  ${name}`);
  else { failures++; console.error(`FAIL  ${name}${detail ? ` -> ${detail}` : ""}`); }
}
const combos: [string, number, string][] = [["TK", 0, "TK/0"], ["TK", 1, "TK/1"], ["TK", 2, "TK/2"], ["TK", 3, "TK/3"], ["K", 0, "K/0"], ["K", 1, "K/1"], ["K", 2, "K/2"], ["K", 3, "K/3"]];
for (const [m, d, code] of combos) assert(`PTKP ${m} + ${d} tanggungan = ${code}`, ptkpCode(m, d) === code);
assert("Tanggungan > 3 dibatasi 3", ptkpCode("K", 5) === "K/3");
assert("Kode lama terurai", parsePtkp("K/2").marital === "K" && parsePtkp("K/2").dependents === 2);

assert("08:00–17:00 = 9 jam", workedHours("08:00", "17:00") === 9);
assert("22:00–06:00 lewat tengah malam = 8 jam", workedHours("22:00", "06:00") === 8);
assert("9 jam kerja → lembur 1 jam", dailyOvertime(9) === 1);
assert("14 jam kerja → lembur dibatasi 4 jam", dailyOvertime(14) === 4);
assert("7 jam kerja → tanpa lembur", dailyOvertime(7) === 0);
assert("Minggu dimulai Senin", weekKey("2026-10-11") === "2026-10-05" && weekKey("2026-10-12") === "2026-10-12");
const week = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"].map((date) => ({ date, hours: 12 }));
const capped = applyWeeklyCap(week);
assert("6 hari × 4 jam dibatasi 18 jam/minggu", capped.reduce((s, d) => s + d.overtime, 0) === 18, JSON.stringify(capped));
assert("Hari ke-5 hanya 2 jam, hari ke-6 nol", capped[4].overtime === 2 && capped[5].overtime === 0);
const twoWeeks = applyWeeklyCap([...week, { date: "2026-10-12", hours: 12 }]);
assert("Minggu baru mulai dari nol", twoWeeks[6].overtime === 4);

if (failures > 0) { console.error(`hr-rules-probe: ${failures} gagal.`); process.exit(1); }
console.log("Semua pemeriksaan PTKP & lembur (F3-L-02, F3-L-07) lolos.");
