/* Probe F3-B-06: Rumus progres proyek berbobot (ADR-0011).
   Jalankan: npm run probe:progress */
import { calcProjectProgress, projectProgressOf } from "../src/utils/projectProgress";
import type { WbsItem, StoreItem } from "../src/data/store";

declare const process: { exit(code: number): never };

let fail = 0;
const assert = (ok: boolean, label: string, detail = ""): void => {
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail !== "" ? ` -> ${detail}` : ""}`);
};

console.log("=== ISMS Project Progress Probe (F3-B-06 & ADR-0011) ===");

// 1. Kasus 1: Bobot BoQ (Tingkat 1)
{
  const wbs: WbsItem[] = [
    { task: "Fabrikasi Lambung", start: "2026-01", end: "2026-03", progress: 100, weight: 10 },
    { task: "Pemasangan Mesin", start: "2026-04", end: "2026-06", progress: 50, weight: 90 },
  ];
  // Nilai BoQ: Fabrikasi Lambung = 3 Miliar, Pemasangan Mesin = 1 Miliar
  // Dengan BoQ: (100 * 3M + 50 * 1M) / 4M = 350M / 4M = 87.5% -> dibulatkan 88%
  // Jika pakai w.weight: (100 * 10 + 50 * 90) / 100 = 55%
  const boq: StoreItem[] = [
    { id: "BQ-1", projectId: "PRJ-1", name: "Fabrikasi Lambung Section 1-4", totalPrice: 3000000000 },
    { id: "BQ-2", projectId: "PRJ-1", name: "Pemasangan Mesin Utama", totalPrice: 1000000000 },
  ];

  const result = calcProjectProgress(wbs, boq);
  assert(result === 88, "Progres dihitung berbobot nilai BoQ saat BoQ tersedia (88%)", `hasil: ${result}`);
}

// 2. Kasus 2: Fallback ke bobot WBS task (w.weight) saat tidak ada BoQ cocok (Tingkat 2)
{
  const wbs: WbsItem[] = [
    { task: "Tahap Persiapan", start: "2026-01", end: "2026-02", progress: 100, weight: 20 },
    { task: "Tahap Eksekusi", start: "2026-03", end: "2026-05", progress: 0, weight: 80 },
  ];
  // Tanpa BoQ: (100 * 20 + 0 * 80) / 100 = 20%
  const result = calcProjectProgress(wbs, []);
  assert(result === 20, "Fallback ke bobot task w.weight saat BoQ kosong (20%)", `hasil: ${result}`);
}

// 3. Kasus 3: Fallback ke bobot sama saat total weight = 0 (Tingkat 3)
{
  const wbs: WbsItem[] = [
    { task: "Task A", start: "2026-01", end: "2026-02", progress: 40, weight: 0 },
    { task: "Task B", start: "2026-03", end: "2026-05", progress: 60, weight: 0 },
  ];
  // Rata-rata sama: (40 + 60) / 2 = 50%
  const result = calcProjectProgress(wbs);
  assert(result === 50, "Fallback ke bobot sama saat w.weight = 0 (50%)", `hasil: ${result}`);
}

// 4. Kasus 4: Sanitasi batas (clamping 0 - 100) dan handling data anomali
{
  const wbs: WbsItem[] = [
    { task: "Task Negatif", start: "2026-01", end: "2026-02", progress: -20, weight: 50 },
    { task: "Task Melebihi", start: "2026-03", end: "2026-05", progress: 150, weight: 50 },
  ];
  // Dijepit ke [0, 100]: (0 * 50 + 100 * 50) / 100 = 50%
  const result = calcProjectProgress(wbs);
  assert(result === 50, "Clamping progres task ke rentang [0, 100]", `hasil: ${result}`);
}

// 5. Kasus 5: WBS kosong
{
  assert(calcProjectProgress([]) === 0, "calcProjectProgress([]) mengembalikan 0");
  assert(calcProjectProgress(null) === 0, "calcProjectProgress(null) mengembalikan 0");
}

// 6. Kasus 6: projectProgressOf helper
{
  const p1: StoreItem = { id: "PRJ-01", progress: 45 };
  const wbsMap: Record<string, WbsItem[]> = {
    "PRJ-01": [
      { task: "Task 1", start: "2026-01", end: "2026-02", progress: 100, weight: 50 },
      { task: "Task 2", start: "2026-03", end: "2026-04", progress: 60, weight: 50 },
    ],
  };

  const p1Prog = projectProgressOf(p1, wbsMap);
  assert(p1Prog === 80, "projectProgressOf membaca dari wbsByProject (80%)", `hasil: ${p1Prog}`);

  const p2: StoreItem = { id: "PRJ-LEGACY", progress: 65 };
  const p2Prog = projectProgressOf(p2, wbsMap);
  assert(p2Prog === 65, "projectProgressOf fallback ke p.progress bawaan bila tidak ada WBS khusus (65%)", `hasil: ${p2Prog}`);
}

if (fail > 0) {
  console.error(`\nProbe F3-B-06 gagal: ${fail} kesalahan.`);
  process.exit(1);
} else {
  console.log("\nSemua pengujian rumus progres proyek berbobot (F3-B-06 & ADR-0011) PASS.");
}
