/* backup-restore-probe.ts — F5-02: backup → restore ke database kosong →
 * jumlah baris setiap tabel harus sama persis. (Pilot memakai SQLite; untuk
 * MySQL jalankan langkah yang sama dengan DB_DIALECT=mysql, lihat runbook.) */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

function counts(file: string): Record<string, number> {
  const db = new Database(file, { readonly: true });
  try {
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map((t) => t.name);
    return Object.fromEntries(tables.map((t) => [t, (db.prepare(`SELECT COUNT(*) AS c FROM "${t}"`).get() as { c: number }).c]));
  } finally { db.close(); }
}

function run(script: string, args: string[], env: Record<string, string>): void {
  const res = spawnSync(process.execPath, ["--import", "tsx", script, ...args], { env: { ...process.env, ...env }, encoding: "utf8" });
  if (res.status !== 0) throw new Error(`${script} gagal: ${res.stderr || res.stdout}`);
}

const src = path.resolve(process.env.SQLITE_PATH ?? "./data/isms.db");
if ((process.env.DB_DIALECT ?? "sqlite") !== "sqlite") {
  console.log("backup-restore-probe: dilewati (hanya SQLite; MySQL diuji manual sesuai runbook).");
  process.exit(0);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "isms-bkp-"));
let failed = false;
try {
  const outDir = path.join(tmp, "backup");
  const uploads = path.join(tmp, "uploads-src");
  fs.mkdirSync(uploads, { recursive: true });
  run("src/backup.ts", [outDir], { SQLITE_PATH: src, UPLOADS_DIR: process.env.UPLOADS_DIR ?? uploads });
  const restored = path.join(tmp, "restored", "isms.db");
  fs.mkdirSync(path.dirname(restored), { recursive: true });
  run("src/restore.ts", ["--from", outDir, "--yes"], { SQLITE_PATH: restored, UPLOADS_DIR: path.join(tmp, "uploads-restored") });
  const a = counts(src);
  const b = counts(restored);
  const diff = Object.keys(a).filter((t) => a[t] !== b[t]);
  const totalRows = Object.values(a).reduce((s, n) => s + n, 0);
  if (diff.length > 0 || Object.keys(a).length !== Object.keys(b).length) {
    failed = true;
    console.error(`[FAIL] jumlah baris berbeda: ${diff.map((t) => `${t} ${a[t]}→${b[t]}`).join(", ")}`);
  } else {
    console.log(`[PASS] backup → restore ke DB kosong: ${Object.keys(a).length} tabel, ${totalRows} baris identik`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8")) as { dialect: string; dbFile: string };
  if (manifest.dialect === "sqlite" && manifest.dbFile === "isms.db") console.log("[PASS] manifest.json valid");
  else { failed = true; console.error("[FAIL] manifest tidak valid"); }
} catch (err) {
  failed = true;
  console.error(`[FAIL] ${err instanceof Error ? err.message : String(err)}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
if (failed) process.exit(1);
console.log("Semua pemeriksaan backup & restore (F5-02) lolos.");
