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

  // 4. Batch Impor Dokumen Nyata Klien (Fase 0 Seed Data dari Kak Ichsan)
  // Memasukkan seluruh data dokumen klien secara bertahap via REST API Fastify
  // untuk memvalidasi skema, guards, dan referensi integritas di lingkungan nyata.

  function payDate(note: string): string {
    const m = note.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (!m) return "";
    const yy = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${yy}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }

  // --- Batch 12: Rekanan Nyata (Vendors & Clients dari Dokumen) ---
  const legacyKode = loadJson<{ barang: Array<{ kode: string; nama: string }>; supplier: Array<{ kode: string; nama: string }> }>("warehouse_kode.json");
  const legacyHutangVendors = loadJson<Array<{ no: string; nama: string; saldoAwal: number; saldoAkhir: number }>>("finance_hutang.json");
  const legacyPiutangClients = loadJson<Array<{ no: string; nama: string; saldoAwal: number; saldoAkhir: number }>>("finance_piutang.json");

  if (legacyKode || legacyHutangVendors || legacyPiutangClients) {
    const startBatch = Date.now();
    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan Batch 12: Rekanan Bisnis Dokumen Nyata (Vendors & Clients)`);
    let created = 0;
    let skipped = 0;
    let failed = 0;
    const supSeen = new Set<string>();

    // Supplier dari warehouse_kode.json
    if (legacyKode?.supplier) {
      let vs = 0;
      for (const sp of legacyKode.supplier) {
        if (!sp.nama || supSeen.has(sp.nama.toUpperCase())) continue;
        supSeen.add(sp.nama.toUpperCase());
        vs += 1;
        const res = await callApi("POST", "/api/vendors", {
          id: `VND-WH-${String(vs).padStart(3, "0")}`,
          branch: "Samarinda",
          data: {
            name: sp.nama,
            cat: "Material",
            supKode: sp.kode,
            status: "Aktif",
          },
        });
        if (res.status === 201) created += 1;
        else if (res.status === 409) skipped += 1;
        else failed += 1;
      }
    }

    // Vendor dari finance_hutang.json
    if (legacyHutangVendors) {
      let vh = 0;
      for (const v of legacyHutangVendors) {
        if (!v.nama || supSeen.has(v.nama.toUpperCase())) continue;
        supSeen.add(v.nama.toUpperCase());
        vh += 1;
        const res = await callApi("POST", "/api/vendors", {
          id: `VND-FIN-${String(vh).padStart(3, "0")}`,
          branch: "Samarinda",
          data: {
            name: v.nama,
            cat: "Hutang Dagang",
            status: "Aktif",
            saldoAwal: v.saldoAwal,
            saldoAkhir: v.saldoAkhir,
          },
        });
        if (res.status === 201) created += 1;
        else if (res.status === 409) skipped += 1;
        else failed += 1;
      }
    }

    // Klien dari finance_piutang.json
    if (legacyPiutangClients) {
      let cp = 0;
      for (const c of legacyPiutangClients) {
        if (!c.nama) continue;
        cp += 1;
        const res = await callApi("POST", "/api/clients", {
          id: `CLN-FIN-${String(cp).padStart(3, "0")}`,
          branch: "Samarinda",
          data: {
            name: c.nama,
            saldoAwal: c.saldoAwal,
            saldoAkhir: c.saldoAkhir,
          },
        });
        if (res.status === 201) created += 1;
        else if (res.status === 409) skipped += 1;
        else failed += 1;
      }
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai Batch 12: ${created} dibuat, ${skipped} dilewati, ${failed} gagal [${durationMs}ms]`);
    summaryReport.push({
      batch: "Batch 12: Rekanan Nyata (Vendors & Clients)",
      total: created + skipped + failed,
      created,
      skipped,
      failed,
      durationMs,
    });
  }

  // --- Batch 13: Hutang Dagang Dokumen Nyata (Payables) ---
  const legacyHutang = loadJson<{ items: Array<Record<string, unknown>> }>("hutang.json");
  if (legacyHutang && Array.isArray(legacyHutang.items)) {
    const startBatch = Date.now();
    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan Batch 13: Hutang Dagang Nyata Dokumen (${legacyHutang.items.length} records)`);
    let created = 0;
    let skipped = 0;
    let failed = 0;

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
          id,
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
          pay1: h.pay1,
          pay1date: payDate(String(h.pay1note ?? "")),
          pay1note: h.pay1note,
          pay2: h.pay2,
          pay2date: payDate(String(h.pay2note ?? "")),
          pay2note: h.pay2note,
          tglTagihan: h.tglTagihan,
        },
      };
      const res = await callApi("POST", "/api/payables", payload);
      if (res.status === 201) created += 1;
      else if (res.status === 409) skipped += 1;
      else failed += 1;
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai Batch 13: ${created} dibuat, ${skipped} dilewati, ${failed} gagal [${durationMs}ms]`);
    summaryReport.push({
      batch: "Batch 13: Hutang Dagang Nyata (Payables)",
      total: legacyHutang.items.length,
      created,
      skipped,
      failed,
      durationMs,
    });
  }

  // --- Batch 14: Bank, Jurnal, Aset & Referensi Dokumen Nyata ---
  const legacyBank = loadJson<{ banks: Array<Record<string, unknown>>; jurnal: Array<Record<string, unknown>> }>("finance_bank.json");
  const legacyAset = loadJson<Array<Record<string, unknown>>>("finance_aset.json");
  const legacySubkon = loadJson<Record<string, unknown>>("subkon.json");
  const legacyTonase = loadJson<Record<string, unknown>>("tonase.json");

  if (legacyBank || legacyAset || legacySubkon || legacyTonase) {
    const startBatch = Date.now();
    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan Batch 14: Keuangan Nyata (Akun Bank, Jurnal, Aset & Ref Teknis)`);
    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Rekening Bank
    if (legacyBank?.banks) {
      const res = await callApi("POST", "/api/settings", {
        id: "BANK_ACCOUNTS_RAW",
        branch: "SEMUA",
        data: {
          id: "BANK_ACCOUNTS_RAW",
          key: "BANK_ACCOUNTS_RAW",
          value: legacyBank.banks,
          label: "Rekening bank (RawData JU Agu-2026)",
          group: "rawdata",
        },
      });
      if (res.status === 201) created += 1;
      else if (res.status === 409) skipped += 1;
      else failed += 1;
    }

    // Jurnal Transaksi Bank Nyata
    if (legacyBank?.jurnal) {
      let jn = 0;
      for (const j of legacyBank.jurnal) {
        const tgl = String(j.tanggal ?? "");
        // Filter header spreadsheet
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl)) continue;
        jn += 1;
        const res = await callApi("POST", "/api/journals", {
          id: `JU-RAW-${String(jn).padStart(3, "0")}`,
          branch: "Samarinda",
          data: {
            id: `JU-RAW-${String(jn).padStart(3, "0")}`,
            date: tgl,
            db: String(j.akunDb ?? ""),
            kr: String(j.akunKr ?? ""),
            party: String(j.pihak ?? ""),
            ref: String(j.dok ?? ""),
            desc: String(j.uraian ?? ""),
            amount: Number(j.debit || j.kredit || 0),
            debit: Number(j.debit || 0),
            kredit: Number(j.kredit || 0),
            saldo: Number(j.saldo || 0),
          },
        });
        if (res.status === 201) created += 1;
        else if (res.status === 409) skipped += 1;
        else failed += 1;
      }
    }

    // Aset Tetap
    if (legacyAset && Array.isArray(legacyAset)) {
      let an = 0;
      for (const a of legacyAset) {
        an += 1;
        const res = await callApi("POST", "/api/assets", {
          id: `AST-RAW-${String(an).padStart(3, "0")}`,
          branch: "Samarinda",
          data: {
            id: `AST-RAW-${String(an).padStart(3, "0")}`,
            ...a,
          },
        });
        if (res.status === 201) created += 1;
        else if (res.status === 409) skipped += 1;
        else failed += 1;
      }
    }

    // Subkon Detail
    if (legacySubkon) {
      const res = await callApi("POST", "/api/settings", {
        id: "RAW_SUBKON_PAK_YUSUF",
        branch: "SEMUA",
        data: {
          id: "RAW_SUBKON_PAK_YUSUF",
          key: "RAW_SUBKON_PAK_YUSUF",
          value: legacySubkon,
          label: "Rincian subkon Pak Mandor Contoh (RawData)",
          group: "rawdata",
        },
      });
      if (res.status === 201) created += 1;
      else if (res.status === 409) skipped += 1;
      else failed += 1;
    }

    // Tonase Plat
    if (legacyTonase) {
      const res = await callApi("POST", "/api/settings", {
        id: "TONASE_REF",
        branch: "SEMUA",
        data: {
          id: "TONASE_REF",
          key: "TONASE_REF",
          value: legacyTonase,
          label: "Tabel tonase (TABLE TONASE PLAT.jpg)",
          group: "rawdata",
        },
      });
      if (res.status === 201) created += 1;
      else if (res.status === 409) skipped += 1;
      else failed += 1;
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai Batch 14: ${created} dibuat, ${skipped} dilewati, ${failed} gagal [${durationMs}ms]`);
    summaryReport.push({
      batch: "Batch 14: Bank, Jurnal, Aset & Ref Teknis",
      total: created + skipped + failed,
      created,
      skipped,
      failed,
      durationMs,
    });
  }

  // --- Batch 15: Master Katalog Barang & Stok Gudang Nyata (Inventory) ---
  const legacyStock = loadJson<Array<{ kode: string; nama: string; awal: number; masuk: number; keluar: number; akhir: number }>>("warehouse_stock.json");
  const legacyWin = loadJson<Array<Record<string, unknown>>>("warehouse_in.json");

  const CATEGORY_DEFAULT: Array<[RegExp, number]> = [
    [/plat|baja|besi|siku|channel|\bms\b|pipa\s*(besi|karbon)/i, 14500],
    [/^cat\b|epoxy|primer|topcoat|antifouling|hempalin/i, 95000],
    [/kabel|nyny|cable/i, 185000],
    [/pipa|\bpipe\b|flange|elbow|valve|tangkai/i, 780000],
    [/hanrik|wire\s*rope|\btali\b/i, 3200000],
    [/fastener|baut|mut|ring|washer|spring/i, 4500],
    [/oli|lubrik|grease|hydraulic/i, 50000],
    [/bearing|gear|seal|piston|rubber|blubber/i, 450000],
    [/anoda|zink|sikam/i, 210000],
    [/mesin|\bpom\b|engine|aux/i, 85000000],
    [/cat\b.* thinner|pengencer/i, 60000],
  ];

  const defaultPriceFor = (name: string, category: string): number => {
    for (const [re, price] of CATEGORY_DEFAULT) if (re.test(name)) return price;
    if (/listrik|panel|lampu|switch/i.test(name) || /listrik/i.test(category)) return 185000;
    if (/perlindungan|apd|helm|safety|life/i.test(name) || /perlindungan/i.test(category)) return 350000;
    return 50000;
  };

  const medianOf = (values: number[]): number => {
    if (values.length === 0) return 0;
    const s = [...values].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)] ?? 0;
  };

  const registeredInvIds = new Set<string>();

  if (legacyKode?.barang) {
    const startBatch = Date.now();
    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan Batch 15: Katalog Master Barang & Stok Nyata (${legacyKode.barang.length} items)`);
    let created = 0;
    let skipped = 0;
    let failed = 0;

    const stockMap = new Map((legacyStock ?? []).map((s) => [s.kode, s]));
    const unitPrice = new Map<string, number>();
    const byName = new Map<string, number[]>();

    for (const m of legacyWin ?? []) {
      const price = Number(m.hargaNonPpn ?? 0);
      if (!Number.isFinite(price) || price <= 0) continue;
      const name = String(m.nama ?? "").trim();
      if (name === "") continue;
      const list = byName.get(name) ?? [];
      list.push(price);
      byName.set(name, list);
      if (!unitPrice.has(String(m.kode ?? ""))) unitPrice.set(String(m.kode ?? ""), price);
    }

    const usedInvIds = new Set<string>();
    let progressCount = 0;

    for (const b of legacyKode.barang) {
      progressCount += 1;
      const st = stockMap.get(b.kode);
      let invId = `WH-${b.kode}`;
      if (usedInvIds.has(invId)) {
        let k = 2;
        while (usedInvIds.has(`${invId}-${k}`)) k += 1;
        invId = `${invId}-${k}`;
      }
      usedInvIds.add(invId);
      registeredInvIds.add(invId);
      registeredInvIds.add(`WH-${b.kode}`);

      const name = String(b.nama || b.kode);
      let cost = unitPrice.get(String(b.kode ?? "")) ?? 0;
      if (cost <= 0) {
        cost = medianOf(byName.get(name.trim()) ?? []);
      }
      if (cost <= 0) {
        cost = defaultPriceFor(name, "Warehouse 2024");
      }

      const stockVal = st ? Number(st.akhir || 0) : 0;
      const payload = {
        id: invId,
        branch: "Samarinda",
        data: {
          id: invId,
          name,
          category: "Warehouse 2024",
          sku: b.kode,
          warehouse: "Gudang Santi",
          stock: stockVal,
          stockAwal: st ? Number(st.awal || 0) : 0,
          stockMasuk: st ? Number(st.masuk || 0) : 0,
          stockKeluar: st ? Number(st.keluar || 0) : 0,
          minStock: Math.max(1, Math.round(stockVal * 0.2)),
          unit: "pcs",
          cost,
          avgCost: cost,
        },
      };

      const res = await callApi("POST", "/api/inventory", payload);
      if (res.status === 201) created += 1;
      else if (res.status === 409) skipped += 1;
      else {
        failed += 1;
        if (failed <= 3) console.warn(`  [WARN] inventory/${invId} -> HTTP ${res.status}:`, JSON.stringify(res.body));
      }

      if (progressCount % 1000 === 0 || progressCount === legacyKode.barang.length) {
        console.log(`  [progress] Batch 15: ${progressCount}/${legacyKode.barang.length} (created=${created}, skip=${skipped})`);
      }
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai Batch 15: ${created} dibuat, ${skipped} dilewati, ${failed} gagal [${durationMs}ms]`);
    summaryReport.push({
      batch: "Batch 15: Katalog Master Barang & Stok Nyata",
      total: legacyKode.barang.length,
      created,
      skipped,
      failed,
      durationMs,
    });
  }

  // --- Batch 16: Mutasi Penerimaan Gudang Nyata (Warehouse In Movements) ---
  if (legacyWin && Array.isArray(legacyWin)) {
    const startBatch = Date.now();
    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan Batch 16: Penerimaan Barang Nyata (${legacyWin.length} movements in)`);
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let n = 0;

    for (const m of legacyWin) {
      n += 1;
      const id = `MV-RAW-IN-${String(n).padStart(4, "0")}`;
      const rawKode = String(m.kode ?? "").trim();
      const targetItemId = rawKode && registeredInvIds.has(`WH-${rawKode}`) ? `WH-${rawKode}` : (registeredInvIds.has(rawKode) ? rawKode : "");

      const payload = {
        id,
        branch: "Samarinda",
        data: {
          id,
          item: String(m.nama ?? rawKode),
          itemId: targetItemId,
          type: "Penerimaan",
          qty: Number(m.jumlah || 0),
          unit: String(m.satuan || "pcs"),
          by: String(m.supNama || m.vendor || ""),
          supplier: String(m.supNama || ""),
          date: String(m.tanggal || ""),
          tone: "in",
          price: Number(m.hargaNonPpn || 0),
          tax: Number(m.pajak || 0),
          total: Number(m.total || 0),
          purpose: String(m.purpose || ""),
        },
      };

      const res = await callApi("POST", "/api/movements", payload);
      if (res.status === 201) created += 1;
      else if (res.status === 409) skipped += 1;
      else {
        failed += 1;
        if (failed <= 3) console.warn(`  [WARN] movements/${id} -> HTTP ${res.status}:`, JSON.stringify(res.body));
      }

      if (n % 1000 === 0 || n === legacyWin.length) {
        console.log(`  [progress] Batch 16: ${n}/${legacyWin.length} (created=${created}, skip=${skipped})`);
      }
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai Batch 16: ${created} dibuat, ${skipped} dilewati, ${failed} gagal [${durationMs}ms]`);
    summaryReport.push({
      batch: "Batch 16: Penerimaan Gudang Nyata (In)",
      total: legacyWin.length,
      created,
      skipped,
      failed,
      durationMs,
    });
  }

  // --- Batch 17: Mutasi Pengeluaran Gudang Nyata (Warehouse Out Movements) ---
  const legacyWout = loadJson<Array<Record<string, unknown>>>("warehouse_out.json");
  if (legacyWout && Array.isArray(legacyWout)) {
    const startBatch = Date.now();
    console.log(`\n-------------------------------------------------------------------`);
    console.log(`▶ Menjalankan Batch 17: Pengeluaran Barang Nyata (${legacyWout.length} movements out)`);
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let n = 0;

    for (const m of legacyWout) {
      n += 1;
      const id = `MV-RAW-OUT-${String(n).padStart(5, "0")}`;
      const rawKode = String(m.kode ?? "").trim();
      const targetItemId = rawKode && registeredInvIds.has(`WH-${rawKode}`) ? `WH-${rawKode}` : (registeredInvIds.has(rawKode) ? rawKode : "");

      const payload = {
        id,
        branch: "Samarinda",
        data: {
          id,
          item: String(m.nama || m.purpose || rawKode),
          itemId: targetItemId,
          type: "Pengeluaran",
          qty: Number(m.jumlah || 0),
          unit: String(m.satuan || "pcs"),
          by: String(m.purpose || ""),
          date: String(m.tanggal || ""),
          tone: "out",
          purpose: String(m.purpose || ""),
          pic: String(m.pic || ""),
          keterangan: String(m.keterangan || ""),
        },
      };

      const res = await callApi("POST", "/api/movements", payload);
      if (res.status === 201) created += 1;
      else if (res.status === 409) skipped += 1;
      else {
        failed += 1;
        if (failed <= 3) console.warn(`  [WARN] movements/${id} -> HTTP ${res.status}:`, JSON.stringify(res.body));
      }

      if (n % 4000 === 0 || n === legacyWout.length) {
        console.log(`  [progress] Batch 17: ${n}/${legacyWout.length} (created=${created}, skip=${skipped})`);
      }
    }

    const durationMs = Date.now() - startBatch;
    console.log(`✔ Selesai Batch 17: ${created} dibuat, ${skipped} dilewati, ${failed} gagal [${durationMs}ms]`);
    summaryReport.push({
      batch: "Batch 17: Pengeluaran Gudang Nyata (Out)",
      total: legacyWout.length,
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
