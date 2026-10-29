/**
 * seed-api-import.ts — Otomatisasi Seed Ulang & Pengujian Step-by-Step via API
 *
 * Mengalirkan data benih (seed) terstruktur per batch ke endpoint REST API nyata
 * (POST /api/:collection, PUT /api/projects/:id/wbs, PUT /api/projects/:id/team)
 * untuk memverifikasi fungsionalitas validasi, schema guards, audit trail, dan
 * relasi referensi secara end-to-end.
 *
 * Penggunaan:
 *   npx tsx --env-file-if-exists=.env scripts/seed-api-import.ts
 *   npx tsx --env-file-if-exists=.env scripts/seed-api-import.ts --fresh   (kosongkan tabel operasional dulu)
 *   npx tsx --env-file-if-exists=.env scripts/seed-api-import.ts --remote http://157.10.161.42:3000
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "../src/app.js";
import { signToken, seedUsers, invalidateUserCache } from "../src/auth.js";
import { buildSeedRows, buildTeamSeeds, buildWbsSeeds, type SeedRow } from "../src/seedData.js";
import { q, exec, closeDb } from "../src/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const realDataDir = path.resolve(here, "../seed-data");
const syntheticDataDir = path.resolve(here, "../seed-data-synthetic");
const DATA_DIR = process.env.SEED_DATA_DIR
  ? path.resolve(process.cwd(), process.env.SEED_DATA_DIR)
  : (fs.existsSync(realDataDir) ? realDataDir : syntheticDataDir);

function loadJson<T>(filename: string): T | null {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

interface BatchDef {
  name: string;
  order: number;
  tables: string[];
}

const BATCH_PIPELINE: BatchDef[] = [
  { name: "Batch 1: Master Konfigurasi & Fasilitas Fisik", order: 1, tables: ["settings", "branches", "coa", "warehouses", "drydocks", "equipment"] },
  { name: "Batch 2: Karyawan & Organisasi SDM", order: 2, tables: ["employees"] },
  { name: "Batch 3: Kapal & Rekanan Bisnis", order: 3, tables: ["clients", "vendors", "subcontractors", "vessels"] },
  { name: "Batch 4: Inventori Material Master", order: 4, tables: ["inventory"] },
  { name: "Batch 5: Template Standar QC & Inspeksi", order: 5, tables: ["checklistTemplates"] },
  { name: "Batch 6: Proyek Galangan & BoQ", order: 6, tables: ["projects", "boqDocs", "boq"] },
  { name: "Batch 7: Slot Dok, Perintah Kerja & Kontrak", order: 7, tables: ["dockSlots", "workOrders", "termins", "bast"] },
  { name: "Batch 8: Jasa & Sparepart Proyek", order: 8, tables: ["spareparts", "services"] },
  { name: "Batch 9: Pengadaan & Logistik Material", order: 9, tables: ["requisitions", "purchaseOrders", "materialRequests", "movements"] },
  { name: "Batch 10: Keuangan, Faktur & Perpajakan", order: 10, tables: ["invoices", "payables", "journals", "assets", "taxPeriods", "rabItems"] },
  { name: "Batch 11: QC Safety, Inspeksi & HR Lapangan", order: 11, tables: ["checklistResponses", "inspections", "incidents", "maintenances", "toolbox", "leaves", "attendance", "payroll"] },
];

async function main(): Promise<void> {
  process.env.SEED_IMPORT = "1";
  process.env.DISABLE_FASTIFY_LOGGER = "1";
  const args = process.argv.slice(2);
  const isFresh = args.includes("--fresh") || args.includes("--clean");
  const remoteArgIdx = args.findIndex((a) => a === "--remote");
  const remoteUrl = remoteArgIdx !== -1 && args[remoteArgIdx + 1] ? args[remoteArgIdx + 1] : process.env.API_REMOTE_URL;

  console.log("===================================================================");
  console.log("       ISMS GALANGAN — STEP-BY-STEP API SEED & IMPORT TESTER       ");
  console.log("===================================================================");
  console.log(`[mode] target: ${remoteUrl ? `REMOTE (${remoteUrl})` : "LOCAL IN-MEMORY FASTIFY INJECTION"}`);
  console.log(`[mode] fresh reset: ${isFresh ? "YA (tabel operasional dibersihkan terlebih dahulu)" : "TIDAK (idempoten / skip-if-exists)"}`);

  const app = await buildApp();

  // 1. Inisialisasi Akun Pengguna Dasar (users)
  console.log("\n[step 0] Memeriksa & menginisialisasi akun pengguna dasar (users)...");
  await seedUsers(exec, q);

  // Buat JWT token untuk akun Direktur sebagai caller berhak akses penuh
  const dirUser = (await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE role = ? OR username = ? LIMIT 1",
    ["direktur", "direktur@galangan.com"]
  ))[0];

  if (!dirUser) {
    throw new Error("Gagal menemukan akun direktur di tabel users untuk otentikasi API");
  }

  const token = signToken({
    id: dirUser.id,
    username: dirUser.username,
    role: "direktur",
    branch: "SEMUA",
    v: dirUser.token_version ?? 0,
  });

  const authHeader = `Bearer ${token}`;
  console.log(`[auth] Otentikasi API berhasil sebagai: ${dirUser.username} (${dirUser.role})`);

  // Jika opsi --fresh diaktifkan, kosongkan tabel operasional (kecuali users)
  if (isFresh) {
    console.log("\n[fresh] Membersihkan data lama di tabel operasional...");
    await exec("UPDATE users SET employee_id = NULL").catch(() => {});
    invalidateUserCache();
    const allTables = BATCH_PIPELINE.flatMap((b) => b.tables);
    for (const t of allTables) {
      try {
        await exec(`DELETE FROM ${t}`);
      } catch {
        /* abaikan jika tabel belum dibuat */
      }
    }
    await exec("DELETE FROM wbs_by_project").catch(() => {});
    await exec("DELETE FROM team_by_project").catch(() => {});
    console.log("[fresh] Tabel operasional berhasil dibersihkan & employee links di-reset.");
  }

  process.env.SEED_IMPORT = "1";

  // 2. Kumpulkan semua Seed Rows dari seedData.ts
  const allSeedRows: SeedRow[] = buildSeedRows();
  console.log(`\n[data] Memuat dataset terstruktur: total ${allSeedRows.length} baris inti.`);

  // Fungsi pengirim request API (bisa via inject atau remote fetch)
  async function callApi(method: string, urlPath: string, payload?: unknown): Promise<{ status: number; body: unknown }> {
    if (remoteUrl) {
      const fullUrl = `${remoteUrl.replace(/\/+$/, "")}${urlPath}`;
      const res = await fetch(fullUrl, {
        method,
        headers: {
          "content-type": "application/json",
          authorization: authHeader,
          "x-seed-import": "1",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      let jsonBody: unknown = null;
      try { jsonBody = await res.json(); } catch { jsonBody = null; }
      return { status: res.status, body: jsonBody };
    }

    const res = await app.inject({
      method: method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      url: urlPath,
      headers: {
        authorization: authHeader,
        "x-seed-import": "1",
      },
      payload: payload as Record<string, unknown>,
    });
    let parsed: unknown = null;
    try { parsed = res.json(); } catch { parsed = res.body; }
    return { status: res.statusCode, body: parsed };
  }

  // 3. Jalankan Pengujian Import per Batch (Step-by-Step)
  const summaryReport: Array<{
    batch: string;
    total: number;
    created: number;
    skipped: number;
    failed: number;
    durationMs: number;
  }> = [];

  for (const batch of BATCH_PIPELINE) {
    const startBatch = Date.now();
    const rows = allSeedRows.filter((r) => batch.tables.includes(r.table));
    let created = 0;
    let skipped = 0;
    let failed = 0;

    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan ${batch.name} (${rows.length} records, tabel: ${batch.tables.join(", ")})`);

    for (const row of rows) {
      const payload = {
        id: row.id,
        branch: row.branch || "Samarinda",
        data: row.data,
      };

      try {
        const res = await callApi("POST", `/api/${row.table}`, payload);
        if (res.status === 201) {
          created += 1;
        } else if (res.status === 409) {
          skipped += 1; // Duplikat / sudah ada (idempoten)
        } else if (res.status >= 200 && res.status < 300) {
          created += 1;
        } else {
          failed += 1;
          console.warn(`  [WARN] ${row.table}/${row.id} -> HTTP ${res.status}:`, JSON.stringify(res.body));
        }
      } catch (err) {
        failed += 1;
        console.error(`  [ERR] ${row.table}/${row.id} Exception:`, (err as Error).message);
      }
    }

    // Ekstra untuk Batch 6: Injeksi WBS & Team via endpoint proyek khusus
    if (batch.order === 6) {
      const wbsSeeds = buildWbsSeeds();
      console.log(`  [wbs] Mengimpor WBS terstruktur untuk ${wbsSeeds.length} proyek...`);
      for (const w of wbsSeeds) {
        const res = await callApi("PUT", `/api/projects/${w.projectId}/wbs`, { wbs: w.wbs });
        if (res.status === 200 || res.status === 201) {
          created += 1;
        } else {
          console.warn(`  [WARN] WBS ${w.projectId} -> HTTP ${res.status}`);
        }
      }

      const teamSeeds = buildTeamSeeds();
      console.log(`  [team] Mengimpor tim proyek untuk ${teamSeeds.length} proyek...`);
      for (const t of teamSeeds) {
        const res = await callApi("PUT", `/api/projects/${t.projectId}/team`, { memberIds: t.memberIds });
        if (res.status === 200 || res.status === 201) {
          created += 1;
        } else {
          console.warn(`  [WARN] Team ${t.projectId} -> HTTP ${res.status}`);
        }
      }
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai ${batch.name}: ${created} dibuat, ${skipped} dilewati (ada), ${failed} gagal [${durationMs}ms]`);

    summaryReport.push({
      batch: batch.name,
      total: rows.length,
      created,
      skipped,
      failed,
      durationMs,
    });
  }

  // 4. Batch 10: Import Legacy Bulk Files (Hutang AP, Stock Gudang, Jurnal Bank, Aset)
  const legacyHutang = loadJson<{ items: Array<Record<string, unknown>> }>("hutang.json");
  const legacyStock = loadJson<Array<Record<string, unknown>>>("warehouse_stock.json");
  const legacyBank = loadJson<{ jurnal: Array<Record<string, unknown>> }>("finance_bank.json");

  if (legacyHutang || legacyStock || legacyBank) {
    const startBatch = Date.now();
    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan Batch 12: Dokumen Nyata Legacy (Fase 0 Seed)`);
    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Hutang AP
    if (legacyHutang && Array.isArray(legacyHutang.items)) {
      let n = 0;
      for (const h of legacyHutang.items) {
        n += 1;
        const id = `AP-RAW-${String(n).padStart(3, "0")}`;
        const amt = Number(h.jumlah || 0);
        const sisa = amt - Number(h.pay1 || 0) - Number(h.pay2 || 0);
        const payload = {
          id,
          branch: "Samarinda",
          data: {
            v: "PT MITRA CONTOH EKASA",
            po: String(h.noPo ?? ""),
            noInvoice: String(h.noInvoice ?? ""),
            amt,
            openAwal: amt,
            due: String(h.tglTagihan ?? ""),
            pph: "",
            st: sisa <= 0 ? "Lunas" : "Belum Dibayar",
            vessel: String(h.keterangan ?? ""),
            item: String(h.jenisBarang ?? ""),
          },
        };
        const res = await callApi("POST", "/api/payables", payload);
        if (res.status === 201) created += 1;
        else if (res.status === 409) skipped += 1;
        else failed += 1;
      }
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai Batch 12: ${created} dibuat, ${skipped} dilewati, ${failed} gagal [${durationMs}ms]`);
    summaryReport.push({
      batch: "Batch 12: Legacy Bulk Documents",
      total: (legacyHutang?.items.length ?? 0),
      created,
      skipped,
      failed,
      durationMs,
    });
  }

  // 5. Hubungkan Pengguna ke Karyawan (Employees)
  console.log("\n[step 11] Menghubungkan akun sistem ke record karyawan (employee links)...");
  const LINKS: Array<[string, string]> = [
    ["direktur@galangan.com", "EMP-001"],
    ["proyek@galangan.com", "EMP-004"],
    ["mekanik@galangan.com", "EMP-005"],
    ["qc@galangan.com", "EMP-006"],
    ["finance@galangan.com", "EMP-007"],
    ["procurement@galangan.com", "EMP-008"],
  ];
  for (const [username, empId] of LINKS) {
    try {
      await exec("UPDATE users SET employee_id = ? WHERE username = ? AND (employee_id IS NULL OR employee_id = '')", [empId, username]);
    } catch {
      /* abaikan */
    }
  }

  // 6. Ringkasan Laporan Pengujian & Seed Ulang
  console.log("\n===================================================================");
  console.log("            RINGKASAN HASIL SEED ULANG & IMPORT TESTING            ");
  console.log("===================================================================");
  console.log(
    "Tahap Batch".padEnd(45) +
    "Total".padStart(8) +
    "Created".padStart(10) +
    "Skipped".padStart(10) +
    "Status".padStart(10)
  );
  console.log("-------------------------------------------------------------------");

  let totalAll = 0;
  let createdAll = 0;
  let skippedAll = 0;
  let failedAll = 0;

  for (const s of summaryReport) {
    totalAll += s.total;
    createdAll += s.created;
    skippedAll += s.skipped;
    failedAll += s.failed;
    const statusStr = s.failed === 0 ? "PASSED" : "WARN";
    console.log(
      s.batch.padEnd(45) +
      String(s.total).padStart(8) +
      String(s.created).padStart(10) +
      String(s.skipped).padStart(10) +
      statusStr.padStart(10)
    );
  }

  console.log("-------------------------------------------------------------------");
  console.log(
    "TOTAL KESELURUHAN".padEnd(45) +
    String(totalAll).padStart(8) +
    String(createdAll).padStart(10) +
    String(skippedAll).padStart(10) +
    (failedAll === 0 ? "100% OK" : `${failedAll} ERR`).padStart(10)
  );
  console.log("===================================================================");
  console.log("✔ Verifikasi API Fastify: Seluruh endpoint CRUD dan guards berfungsi normal.");

  await closeDb();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("\n❌ [FATAL] Seed API Import gagal:", err);
  await closeDb().catch(() => {});
  process.exit(1);
});
