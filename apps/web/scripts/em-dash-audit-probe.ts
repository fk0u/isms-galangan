/* em-dash-audit-probe.ts — Verifikasi kepatuhan Issue #103:
 * 1. Seluruh string copywriting pada berkas i18n (src/i18n/n_*.ts) bebas dari em dash (—).
 * 2. Memastikan intentional exclusions (pengecualian yang disengaja) terjaga:
 *    - Domain teknis WBS ("Outfitting — Machinery", "Painting — Priming") pada seeds/store.
 *    - Empty cell placeholder visual ("—").
 */
import { services } from "../src/data/index";
import { seedChecklistResponses } from "../src/data/seeds";

declare const process: { exit(code: number): never };

const i18nModules = import.meta.glob<Record<string, unknown>>("../src/i18n/n_*.ts", { eager: true });

function collectStrings(obj: unknown, prefix = ""): { path: string; val: string }[] {
  if (typeof obj === "string") return [{ path: prefix, val: obj }];
  if (Array.isArray(obj)) {
    return obj.flatMap((item, idx) => collectStrings(item, `${prefix}[${idx}]`));
  }
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      collectStrings(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return [];
}

let emDashFoundCount = 0;
let totalStringsChecked = 0;
const violations: string[] = [];

for (const [file, mod] of Object.entries(i18nModules)) {
  for (const [exportName, exportVal] of Object.entries(mod)) {
    const bundle = exportVal as { id?: unknown; en?: unknown };
    if (!bundle || typeof bundle !== "object" || !("id" in bundle) || !("en" in bundle)) continue;

    const idStrings = collectStrings(bundle.id, `${exportName}.id`);
    const enStrings = collectStrings(bundle.en, `${exportName}.en`);

    for (const item of [...idStrings, ...enStrings]) {
      totalStringsChecked += 1;
      if (item.val.includes("—")) {
        emDashFoundCount += 1;
        violations.push(`[${file}] ${item.path}: "${item.val}"`);
      }
    }
  }
}

console.log(`[em-dash-audit] Total string i18n diperiksa: ${totalStringsChecked}`);
if (emDashFoundCount > 0) {
  console.error(`[em-dash-audit] FAIL: Ditemukan ${emDashFoundCount} em dash pada copywriting i18n:`);
  for (const v of violations.slice(0, 10)) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}
console.log(`[em-dash-audit] PASS: 0 em dash ditemukan di seluruh copywriting i18n.`);

// Verifikasi intentional exclusions domain teknis WBS
const hasOutfittingMachinery = (services || []).some((s) => String(s.wbsTask) === "Outfitting — Machinery");
if (!hasOutfittingMachinery) {
  console.error("FAIL: Intentional exclusion 'Outfitting — Machinery' pada services hilang!");
  process.exit(1);
}

const hasPaintingPriming = (seedChecklistResponses || []).some((c) => String(c.wbsTask) === "Painting — Priming");
if (!hasPaintingPriming) {
  console.error("FAIL: Intentional exclusion 'Painting — Priming' pada seedChecklistResponses hilang!");
  process.exit(1);
}

console.log("[em-dash-audit] PASS: Intentional exclusion WBS domain terverifikasi utuh.");
console.log("[em-dash-audit] Sukses: seluruh copy UI bersih dari em dash dan data domain WBS tetap terjaga.");
