import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { closeDb, getDialect, q } from "./db.js";
import { COLLECTIONS } from "./routes/crud.js";
import { uploadsRoot } from "./routes/files.js";

function argValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  const prefixed = process.argv.find((a) => a.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  return undefined;
}

export function resolveSqlitePath(): string {
  const raw = process.env.SQLITE_PATH ?? "./data/isms.db";
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export function sanitizeTimestamp(iso: string): string {
  return iso.replace(/[:.]/g, "-");
}

export function defaultBackupRootDir(): string {
  const raw = process.env.BACKUP_DIR ?? "./backups";
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export async function tablesCount(): Promise<{ count: number; tables: string[] }> {
  try {
    if (getDialect() === "mysql") {
      const rows = await q<{ cnt: number | string }>(
        "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE()",
      );
      const count = Number(rows[0]?.cnt ?? COLLECTIONS.length);
      return { count, tables: [...COLLECTIONS, "users", "audit_log", "schema_migrations"] };
    }
    const rows = await q<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    const tables = rows.map((r) => String(r.name));
    return { count: tables.length, tables };
  } catch {
    return { count: COLLECTIONS.length, tables: [...COLLECTIONS] };
  }
}

function runMysqldump(mysqlUrl: string, outFile: string): Promise<void> {
  const url = new URL(mysqlUrl);
  const host = url.hostname || "localhost";
  const port = url.port || "3306";
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error("MYSQL_URL must include a database name (…/dbname)");
  if (!user) throw new Error("MYSQL_URL must include a user (mysql://user:pass@host/db)");
  return new Promise((resolve, reject) => {
    const args = [
      `--host=${host}`,
      `--port=${port}`,
      `--user=${user}`,
      "--single-transaction",
      "--quick",
      "--lock-tables=false",
      database,
    ];
    const child = spawn("mysqldump", args, {
      env: { ...process.env, MYSQL_PWD: password },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const out = fs.createWriteStream(outFile);
    let stderr = "";
    child.stdout.pipe(out);
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      out.close();
      reject(new Error(`mysqldump failed to start (is it installed on PATH?): ${String(err)}`));
    });
    child.on("close", (code) => {
      out.close();
      if (code === 0) resolve();
      else reject(new Error(`mysqldump exited with code ${code}: ${stderr.slice(0, 2000)}`));
    });
  });
}

function parseTimestampSafe(str: string, fallbackMs: number): number {
  if (!str) return fallbackMs;
  let t = new Date(str).getTime();
  if (!Number.isNaN(t)) return t;
  // Format tersanitasi: 2026-11-01T00-00-00-000Z -> 2026-11-01T00:00:00.000Z
  const normalized = str.replace(/T(\d{2})-(\d{2})-(\d{2})(?:-(\d{3}))?Z?$/, (_, h, m, s, ms) => {
    return `T${h}:${m}:${s}${ms ? `.${ms}` : ""}Z`;
  });
  t = new Date(normalized).getTime();
  return Number.isNaN(t) ? fallbackMs : t;
}

/**
 * Memangkas cadangan lama di root folder cadangan agar HANYA menyimpan `keepCount`
 * cadangan terbaru (aturan bisnis: latest 2 db, hapus yang lebih lama).
 */
export function pruneOldBackups(rootDir: string, keepCount = 2): string[] {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const backupDirs: Array<{ name: string; fullPath: string; time: number }> = [];

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const fullPath = path.join(rootDir, ent.name);
    const manifestPath = path.join(fullPath, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { timestamp?: string };
      const mtime = fs.statSync(fullPath).mtimeMs;
      const time = parseTimestampSafe(manifest.timestamp ?? ent.name, mtime);
      backupDirs.push({ name: ent.name, fullPath, time });
    } catch {
      backupDirs.push({ name: ent.name, fullPath, time: fs.statSync(fullPath).mtimeMs });
    }
  }

  // Urutkan descending: terbaru pertama
  backupDirs.sort((a, b) => b.time - a.time);

  const deleted: string[] = [];
  if (backupDirs.length > keepCount) {
    const toRemove = backupDirs.slice(keepCount);
    for (const b of toRemove) {
      try {
        fs.rmSync(b.fullPath, { recursive: true, force: true });
        deleted.push(b.name);
      } catch (err) {
        console.warn(`[backup] gagal menghapus backup lama ${b.name}:`, err);
      }
    }
  }
  return deleted;
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  dialect: string;
  tablesCount: number;
  dbFile: string;
  sizeBytes: number;
  uploadsBackedUp: boolean;
  createdAt: string;
}

export function listBackups(rootDir: string = defaultBackupRootDir()): BackupInfo[] {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const list: BackupInfo[] = [];

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const fullPath = path.join(rootDir, ent.name);
    const manifestPath = path.join(fullPath, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        timestamp?: string;
        dialect?: string;
        tablesCount?: number;
        dbFile?: string;
        uploadsBackedUp?: boolean;
      };
      const dbFile = manifest.dbFile ?? (manifest.dialect === "mysql" ? "dump.sql" : "isms.db");
      const dbPath = path.join(fullPath, dbFile);
      let sizeBytes = 0;
      if (fs.existsSync(dbPath)) {
        sizeBytes = fs.statSync(dbPath).size;
      }
      list.push({
        id: ent.name,
        timestamp: manifest.timestamp ?? ent.name,
        dialect: manifest.dialect ?? "sqlite",
        tablesCount: manifest.tablesCount ?? 0,
        dbFile,
        sizeBytes,
        uploadsBackedUp: Boolean(manifest.uploadsBackedUp),
        createdAt: manifest.timestamp ?? new Date().toISOString(),
      });
    } catch {
      // Abaikan entri yang rusak
    }
  }

  // Urutkan terbaru pertama
  list.sort((a, b) => parseTimestampSafe(b.timestamp, 0) - parseTimestampSafe(a.timestamp, 0));
  return list;
}

export interface BackupResult {
  outDir: string;
  timestamp: string;
  dialect: "sqlite" | "mysql";
  tablesCount: number;
  tables: string[];
  dbFile: string;
  sizeBytes: number;
  uploadsBackedUp: boolean;
  deletedBackups: string[];
}

export async function createBackup(opts: {
  outDir?: string;
  rootDir?: string;
  prune?: boolean;
  keepCount?: number;
} = {}): Promise<BackupResult> {
  const timestamp = new Date().toISOString();
  const dialect = getDialect();
  const rootDir = opts.rootDir ?? defaultBackupRootDir();
  const outDir = opts.outDir ? path.resolve(opts.outDir) : path.join(rootDir, sanitizeTimestamp(timestamp));

  fs.mkdirSync(outDir, { recursive: true });

  let dbFile = "";
  if (dialect === "sqlite") {
    const src = resolveSqlitePath();
    if (!fs.existsSync(src)) {
      throw new Error(`SQLite file not found at ${src} (run npm run migrate first)`);
    }
    dbFile = "isms.db";
    const dest = path.join(outDir, dbFile);
    // VACUUM INTO writes a consistent snapshot without blocking longer than needed.
    const db = new Database(src, { readonly: true });
    try {
      const escaped = dest.replace(/'/g, "''");
      db.exec(`VACUUM INTO '${escaped}'`);
    } finally {
      db.close();
    }
  } else {
    const mysqlUrl = process.env.MYSQL_URL;
    if (!mysqlUrl) throw new Error("MYSQL_URL is required when DB_DIALECT=mysql");
    dbFile = "dump.sql";
    await runMysqldump(mysqlUrl, path.join(outDir, dbFile));
  }

  // Copy uploads dir (best-effort: empty/missing uploads still produce a valid backup).
  let uploadsBackedUp = false;
  const uploads = uploadsRoot();
  if (fs.existsSync(uploads)) {
    fs.cpSync(uploads, path.join(outDir, "uploads"), { recursive: true });
    uploadsBackedUp = true;
  }

  const { count, tables } = await tablesCount();
  const manifest = {
    timestamp,
    dialect,
    tablesCount: count,
    tables,
    dbFile,
    uploadsBackedUp,
    note: dialect === "mysql" ? "Requires mysqldump on PATH to create this backup." : undefined,
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const dbPath = path.join(outDir, dbFile);
  const sizeBytes = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

  // Pruning: simpan latest 2 db bila diminta atau bila backup default rootDir
  let deletedBackups: string[] = [];
  if (opts.prune || (!opts.outDir && opts.prune !== false)) {
    deletedBackups = pruneOldBackups(rootDir, opts.keepCount ?? 2);
  }

  console.log(
    `[backup] ${dialect} → ${outDir} (tables: ${count}, size: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB, uploads: ${uploadsBackedUp ? "yes" : "empty"}${deletedBackups.length > 0 ? `, pruned ${deletedBackups.length} old backups` : ""})`,
  );

  return {
    outDir,
    timestamp,
    dialect,
    tablesCount: count,
    tables,
    dbFile,
    sizeBytes,
    uploadsBackedUp,
    deletedBackups,
  };
}

async function main(): Promise<void> {
  // Accept both `--out <dir>` and a bare positional `<dir>` (npm may strip
  // unknown `--out` flags when invoked as `npm run backup -- --out <dir>`).
  const positional = process.argv.slice(2).find((a) => !a.startsWith("-") && !a.endsWith(".ts") && !a.endsWith(".js"));
  const explicitOut = argValue("--out") ?? positional;
  const pruneRequested = process.argv.includes("--prune") || !explicitOut;

  await createBackup({
    outDir: explicitOut,
    prune: pruneRequested,
    keepCount: 2,
  });
}

const entry = process.argv[1] ?? "";
if (entry.endsWith("backup.ts") || entry.endsWith("backup.js")) {
  main()
    .then(() => closeDb().then(() => process.exit(0)))
    .catch((err) => {
      console.error("[backup] failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
