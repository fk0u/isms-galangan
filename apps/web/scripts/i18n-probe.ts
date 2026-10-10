/* i18n-probe.ts — F6-03 bagian (a): setiap kunci ID punya pasangan EN dan
 * sebaliknya, di semua berkas src/i18n/n_*.ts. Kunci yang hilang di satu
 * bahasa tampil sebagai "undefined" di layar tanpa error apa pun. */
const modules = import.meta.glob<Record<string, unknown>>("../src/i18n/n_*.ts", { eager: true });

function keysOf(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}

let failed = 0;
let total = 0;
for (const [file, mod] of Object.entries(modules)) {
  for (const [name, value] of Object.entries(mod)) {
    const v = value as { id?: unknown; en?: unknown };
    if (!v || typeof v !== "object" || !("id" in v) || !("en" in v)) continue;
    total += 1;
    const id = new Set(keysOf(v.id));
    const en = new Set(keysOf(v.en));
    const onlyId = [...id].filter((k) => !en.has(k));
    const onlyEn = [...en].filter((k) => !id.has(k));
    if (onlyId.length === 0 && onlyEn.length === 0) {
      console.log(`PASS  ${name} (${id.size} kunci)`);
    } else {
      failed += 1;
      console.error(`FAIL  ${name} [${file}] hanya ID: ${onlyId.slice(0, 8).join(", ") || "-"} | hanya EN: ${onlyEn.slice(0, 8).join(", ") || "-"}`);
    }
  }
}
if (total === 0) throw new Error("FAIL  tidak ada modul i18n yang terbaca");
if (failed > 0) throw new Error(`${failed}/${total} modul i18n tidak simetris.`);
console.log(`Semua ${total} modul i18n simetris ID/EN.`);
