/* project-stages-probe.ts — migrasi tahap proyek 7 → 8 tahap: pemetaan, idempoten,
 * riwayat utuh, dan revert mengembalikan data persis. */
import { STAGE_V1_TO_V2, migrateStage, revertStage } from "../src/projectStages.js";

let fail = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  if (cond) console.log(`[PASS] ${name}`); else { fail++; console.error(`[FAIL] ${name} ${detail}`); }
};
const V1 = ["Inquiry", "Quotation", "Kontrak", "Desain", "Produksi", "Trial", "Handover"];
const V2 = ["Quotation", "Estimasi", "Kontrak", "Produksi", "Bill", "Invoice", "Sea Trial + Dock Report", "Pelunasan + Handover"];
ok("semua tahap lama terpetakan ke tahap 8 skema", V1.every((t) => V2.includes(STAGE_V1_TO_V2[t] ?? "")));
ok("urutan tidak mundur", V1.map((t) => V2.indexOf(STAGE_V1_TO_V2[t] ?? "")).every((n, i, a) => i === 0 || n >= (a[i - 1] ?? 0)));

const lama = { name: "TB Contoh", tahap: "Trial", tahapLog: [{ from: "Produksi", to: "Trial", date: "2026-10-01" }] };
const baru = migrateStage(lama);
ok("Trial → Sea Trial + Dock Report, tahapVersi 2", baru?.tahap === "Sea Trial + Dock Report" && baru?.tahapVersi === 2 && baru?.tahapV1 === "Trial");
ok("tahapLog tidak diubah", JSON.stringify(baru?.tahapLog) === JSON.stringify(lama.tahapLog));
ok("idempoten: proyek 8 tahap dilewati", baru !== null && migrateStage(baru) === null);
ok("revert mengembalikan data persis", baru !== null && JSON.stringify(revertStage(baru)) === JSON.stringify(lama), JSON.stringify(baru && revertStage(baru)));
ok("revert melewati proyek yang dibuat langsung 8 tahap", revertStage({ tahap: "Bill", tahapVersi: 2 }) === null);
ok("tahap kosong/asing → Produksi", migrateStage({ tahap: "" })?.tahap === "Produksi");

if (fail) { console.error(`\n${fail} pemeriksaan migrasi tahap gagal.`); process.exitCode = 1; } else console.log("\nSemua pemeriksaan migrasi tahap proyek lolos.");
