import fs from "node:fs";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";

export type Dialect = "sqlite" | "mysql";

export interface ExecResult {
  changes: number;
}

export interface TxContext {
  q<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string, params?: unknown[]): Promise<ExecResult>;
}

export type TxFn<R> = (tx: TxContext) => Promise<R> | R;

const txStorage = new AsyncLocalStorage<TxContext>();

export function getDialect(): Dialect {
  const raw = (process.env.DB_DIALECT ?? "sqlite").toLowerCase();
  return raw === "mysql" ? "mysql" : "sqlite";
}

function resolveSqlitePath(): string {
  const raw = process.env.SQLITE_PATH ?? "./data/isms.db";
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

let sqliteDb: Database.Database | null = null;

function ensureSqlite(): Database.Database {
  if (sqliteDb) return sqliteDb;
  const file = resolveSqlitePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  sqliteDb = new Database(file);
  return sqliteDb;
}

let mysqlPool: mysql.Pool | null = null;

function ensureMysql(): mysql.Pool {
  if (mysqlPool) return mysqlPool;
  const url = process.env.MYSQL_URL;
  if (!url) throw new Error("MYSQL_URL is required when DB_DIALECT=mysql");
  mysqlPool = mysql.createPool(url);
  return mysqlPool;
}

export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const currentTx = txStorage.getStore();
  if (currentTx) {
    return currentTx.q<T>(sql, params);
  }
  if (getDialect() === "mysql") {
    const pool = ensureMysql();
    const [rows] = await pool.query(sql, params as never[]);
    return rows as T[];
  }
  const db = ensureSqlite();
  const stmt = db.prepare(sql);
  return stmt.all(...(params as unknown[])) as T[];
}

export async function exec(sql: string, params: unknown[] = []): Promise<ExecResult> {
  const currentTx = txStorage.getStore();
  if (currentTx) {
    return currentTx.exec(sql, params);
  }
  if (getDialect() === "mysql") {
    const pool = ensureMysql();
    // Use query (not execute): prepared-statement protocol rejects
    // START TRANSACTION / COMMIT / ROLLBACK with ER_UNSUPPORTED_PS 1295.
    const [res] = await pool.query(sql, params as never[]);
    const changes = (res && typeof res === "object" && "affectedRows" in res) ? Number((res as any).affectedRows) : 0;
    return { changes };
  }
  const db = ensureSqlite();
  const res = db.prepare(sql).run(...(params as unknown[]));
  return { changes: res.changes };
}

let savepointCounter = 0;
let sqliteLock: Promise<void> = Promise.resolve();

async function acquireSqliteLock(): Promise<() => void> {
  let release!: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = sqliteLock;
  sqliteLock = sqliteLock.then(() => nextLock);
  await currentLock;
  return release;
}

/**
 * Menjalankan operasi multi-langkah di dalam transaksi database atomik (F4-02).
 *
 * - SQLite: BEGIN IMMEDIATE di-serialize via mutex antrean async; mendukung SAVEPOINT bertingkat (nested tx).
 * - MySQL: Meminjam koneksi tunggal dari connection pool + START TRANSACTION / COMMIT / ROLLBACK; mendukung SAVEPOINT bertingkat.
 * - Otomatis mengikat konteks transaksi ke AsyncLocalStorage, sehingga panggilan q() dan exec()
 *   di dalam callback fn otomatis memakai transaksi aktif tanpa kebocoran koneksi.
 */
export async function withTx<R>(fn: TxFn<R>): Promise<R> {
  const parentTx = txStorage.getStore();

  // Nested transaction: gunakan SAVEPOINT
  if (parentTx) {
    const spName = `isms_sp_${++savepointCounter}`;
    await parentTx.exec(`SAVEPOINT ${spName}`);
    try {
      const result = await fn(parentTx);
      await parentTx.exec(`RELEASE SAVEPOINT ${spName}`);
      return result;
    } catch (err) {
      try {
        await parentTx.exec(`ROLLBACK TO SAVEPOINT ${spName}`);
      } catch {
        // Abaikan kegagalan rollback savepoint
      }
      throw err;
    }
  }

  // Top-level MySQL transaction
  if (getDialect() === "mysql") {
    const pool = ensureMysql();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const tx: TxContext = {
        async q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
          const [rows] = await conn.query(sql, params as never[]);
          return rows as T[];
        },
        async exec(sql: string, params: unknown[] = []): Promise<ExecResult> {
          const [res] = await conn.query(sql, params as never[]);
          const changes = (res && typeof res === "object" && "affectedRows" in res) ? Number((res as any).affectedRows) : 0;
          return { changes };
        },
      };
      let committed = false;
      try {
        const result = await txStorage.run(tx, () => fn(tx));
        await conn.commit();
        committed = true;
        return result;
      } finally {
        if (!committed) {
          try {
            await conn.rollback();
          } catch {
            // Abaikan kegagalan rollback
          }
        }
      }
    } finally {
      conn.release();
    }
  }

  // Top-level SQLite transaction
  const release = await acquireSqliteLock();
  const db = ensureSqlite();
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    const tx: TxContext = {
      async q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
        const stmt = db.prepare(sql);
        return stmt.all(...(params as unknown[])) as T[];
      },
      async exec(sql: string, params: unknown[] = []): Promise<ExecResult> {
        const res = db.prepare(sql).run(...(params as unknown[]));
        return { changes: res.changes };
      },
    };
    let committed = false;
    try {
      const result = await txStorage.run(tx, () => fn(tx));
      db.prepare("COMMIT").run();
      committed = true;
      return result;
    } finally {
      if (!committed) {
        try {
          db.prepare("ROLLBACK").run();
        } catch {
          // Abaikan kegagalan rollback
        }
      }
    }
  } finally {
    release();
  }
}

export async function closeDb(): Promise<void> {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
}
