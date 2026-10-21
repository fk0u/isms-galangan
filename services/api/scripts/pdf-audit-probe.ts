/* Audit ekspor PDF seluruh modul (catatan klien 17 Okt, K17-UMUM-02).
 *
 * Berbeda dari pdf-db-probe (satu baris contoh per jenis), probe ini merender
 * SETIAP baris (maks. AUDIT_LIMIT per jenis) untuk semua jenis dokumen yang
 * terdaftar, lalu memeriksa:
 *   - prepare + render tidak melempar error dan menghasilkan %PDF-;
 *   - model tidak memuat nilai rusak: "undefined", "NaN", "[object Object]",
 *     "Invalid Date" - tanda field salah nama atau tipe yang tak tertangani;
 *   - geometri halaman aman (tidak ada teks keluar margin/tumpang tindih).
 * Hanya membaca DB. Jalankan setelah migrate + seed (lihat `npm run check`). */
import { closeDb, q } from "../src/db.js";
import { DOC_KINDS, buildFromModel, findRecipe } from "../src/pdf/registry.js";
import { checkGeometry } from "../src/pdf/document.js";

const AUDIT_LIMIT = Number(process.env.PDF_AUDIT_LIMIT ?? 40);
const BAD = /\b(undefined|NaN)\b|\[object Object\]|Invalid Date/;
const DOC_TYPE: Record<string, string> = {
  suratJalan: "Surat Jalan", deliveryOrder: "Delivery Order", tandaTerima: "Tanda Terima", transmittal: "Transmittal",
};

const failures: string[] = [];
let checked = 0;

async function idsFor(kind: string, field: string): Promise<string[]> {
  if (field === "documents") {
    const type = DOC_TYPE[kind];
    if (!type) return [];
    return (await q<{ id: string }>(`SELECT id FROM documents WHERE data LIKE ? LIMIT ?`, [`%"${type}"%`, AUDIT_LIMIT])).map((r) => String(r.id));
  }
  return (await q<{ id: string }>(`SELECT id FROM ${field} LIMIT ?`, [AUDIT_LIMIT])).map((r) => String(r.id));
}

type Run = { id: string; filters: Record<string, unknown>; label: string };

/** Laporan tidak punya baris asal: diuji dengan filter yang dipakai aplikasi. */
async function reportRuns(kind: string): Promise<Run[]> {
  const projects = (await q<{ id: string }>("SELECT id FROM projects LIMIT ?", [AUDIT_LIMIT])).map((r) => String(r.id));
  const periods = [...new Set((await q<{ data: string }>("SELECT data FROM payroll", []))
    .map((r) => String((JSON.parse(String(r.data)) as Record<string, unknown>).period ?? ""))
    .filter((p) => /^\d{4}-\d{2}$/.test(p)))].slice(0, 6);
  if (kind === "laporanProyek") return projects.map((projectId) => ({ id: "", filters: { projectId }, label: projectId }));
  if (kind === "laporan") return [{ id: "", filters: { mode: "Mingguan" }, label: "Mingguan" }, ...periods.map((period) => ({ id: "", filters: { mode: "Bulanan", period }, label: `Bulanan ${period}` }))];
  if (kind === "analitik") return [{ id: "", filters: { scope: "Dashboard", months: 12 }, label: "Dashboard" }, { id: "", filters: { scope: "Analytics", months: 6 }, label: "Analytics" }];
  if (kind === "rekapPayroll") return periods.flatMap((period) => [{ id: "", filters: { period }, label: period }, { id: "", filters: { period, mode: "THR" }, label: `${period} THR` }]);
  return [{ id: "", filters: {}, label: "default" }];
}

async function main(): Promise<void> {
  const perKind: string[] = [];
  for (const kind of DOC_KINDS) {
    const recipe = findRecipe(kind);
    if (!recipe) { failures.push(`${kind}: tidak terdaftar`); continue; }
    const runs: Run[] = recipe.report
      ? await reportRuns(kind)
      : (await idsFor(kind, recipe.entity.field)).map((id) => ({ id, filters: {}, label: id }));
    let bad = 0;
    for (const run of runs) {
      const id = run.id;
      const ctx = { locale: "id" as const, branch: "SEMUA", filters: run.filters };
      const label = `${kind} ${run.label}`;
      try {
        const model = await recipe.prepare(id, ctx);
        const json = JSON.stringify(model);
        const hit = BAD.exec(json);
        // PDF_AUDIT_QUIET=1: tanpa potongan isi, aman dijalankan pada data produksi.
        const ctxText = process.env.PDF_AUDIT_QUIET === "1" ? "" : ` (…${json.slice(Math.max(0, hit?.index ?? 0) - 60, (hit?.index ?? 0) + 20)}…)`;
        if (hit) { failures.push(`${label}: model memuat "${hit[0]}"${ctxText}`); bad++; continue; }
        const res = buildFromModel(recipe, model, ctx).render();
        if (Buffer.from(res.bytes.subarray(0, 5)).toString() !== "%PDF-") { failures.push(`${label}: bukan PDF`); bad++; continue; }
        const geo = checkGeometry(res, res.margin, { width: res.pageW, height: res.pageH });
        if (geo.length > 0) { failures.push(`${label}: geometri - ${geo[0]?.reason ?? "?"}`); bad++; continue; }
        // Q28: semua dokumen memakai template kop gambar yang sama di halaman 1.
        if (!res.records.some((r) => r.page === 1 && r.kind === "image")) { failures.push(`${label}: tanpa kop template`); bad++; continue; }
        checked++;
      } catch (err) {
        failures.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
        bad++;
      }
    }
    perKind.push(`${kind}: ${runs.length - bad}/${runs.length}`);
  }
  console.log(`Audit PDF per jenis (baris lolos/diuji):\n  ${perKind.join("\n  ")}`);
  if (failures.length > 0) {
    console.log(`\n${failures.length} masalah:\n  ${failures.slice(0, 60).join("\n  ")}`);
    await closeDb();
    process.exit(1);
  }
  console.log(`\nAudit PDF lolos: ${checked} dokumen dari ${DOC_KINDS.length} jenis dirender tanpa nilai rusak atau masalah geometri.`);
  await closeDb();
}

void main();
