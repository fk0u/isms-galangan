import { getDialect, q } from "./db.js";
import { COLLECTIONS } from "./routes/crud.js";
import { createZipArchive, type ZipFileEntry } from "./zip.js";

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  let s = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function generateSqlDump(): Promise<string> {
  const dialect = getDialect();
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  lines.push(`-- ==========================================================`);
  lines.push(`-- ISMS Shipyard Management System - Full Database Dump`);
  lines.push(`-- Generated At: ${timestamp}`);
  lines.push(`-- Dialect: ${dialect}`);
  lines.push(`-- Total Collections: ${COLLECTIONS.length}`);
  lines.push(`-- ==========================================================`);
  lines.push(``);

  if (dialect === "sqlite") {
    lines.push(`PRAGMA foreign_keys = OFF;`);
    lines.push(`BEGIN TRANSACTION;`);
    lines.push(``);
  } else {
    lines.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    lines.push(`SET NAMES utf8mb4;`);
    lines.push(`START TRANSACTION;`);
    lines.push(``);
  }

  // 1. Envelope Collections
  for (const col of COLLECTIONS) {
    try {
      const rows = await q<{ id: string; branch: string; data: string | object; updated_at: string }>(
        `SELECT id, branch, data, updated_at FROM ${col}`
      );
      if (rows.length === 0) continue;

      lines.push(`-- Table: ${col} (${rows.length} rows)`);
      if (dialect === "sqlite") {
        lines.push(`CREATE TABLE IF NOT EXISTS "${col}" (id TEXT PRIMARY KEY, branch TEXT, data TEXT, updated_at TEXT);`);
      } else {
        lines.push(`CREATE TABLE IF NOT EXISTS \`${col}\` (id VARCHAR(64) PRIMARY KEY, branch VARCHAR(64), data JSON, updated_at DATETIME(3));`);
      }

      for (const row of rows) {
        const idEsc = escapeSqlString(String(row.id));
        const branchEsc = escapeSqlString(String(row.branch ?? "Samarinda"));
        const dataStr = typeof row.data === "object" ? JSON.stringify(row.data) : String(row.data);
        const dataEsc = escapeSqlString(dataStr);
        const updatedEsc = escapeSqlString(String(row.updated_at ?? timestamp));

        if (dialect === "sqlite") {
          lines.push(`INSERT OR REPLACE INTO "${col}" (id, branch, data, updated_at) VALUES ('${idEsc}', '${branchEsc}', '${dataEsc}', '${updatedEsc}');`);
        } else {
          lines.push(`INSERT INTO \`${col}\` (id, branch, data, updated_at) VALUES ('${idEsc}', '${branchEsc}', '${dataEsc}', '${updatedEsc}') ON DUPLICATE KEY UPDATE branch = VALUES(branch), data = VALUES(data), updated_at = VALUES(updated_at);`);
        }
      }
      lines.push(``);
    } catch {
      // Table might not exist; continue
    }
  }

  // 2. Users Table
  try {
    const userRows = await q<{
      id: string; username: string; pass_hash: string; name: string;
      role: string; email: string; is_active: number; employee_id: string | null;
      token_version: number; updated_at: string;
    }>("SELECT id, username, pass_hash, name, role, email, is_active, employee_id, token_version, updated_at FROM users");
    if (userRows.length > 0) {
      lines.push(`-- Table: users (${userRows.length} rows)`);
      for (const u of userRows) {
        const idEsc = escapeSqlString(String(u.id));
        const uNameEsc = escapeSqlString(String(u.username));
        const passEsc = escapeSqlString(String(u.pass_hash));
        const nameEsc = escapeSqlString(String(u.name || ""));
        const roleEsc = escapeSqlString(String(u.role || ""));
        const emailEsc = escapeSqlString(String(u.email || ""));
        const empEsc = u.employee_id ? `'${escapeSqlString(String(u.employee_id))}'` : "NULL";
        const act = u.is_active ? 1 : 0;
        const ver = Number(u.token_version ?? 0);
        const updEsc = escapeSqlString(String(u.updated_at || timestamp));

        if (dialect === "sqlite") {
          lines.push(`INSERT OR REPLACE INTO users (id, username, pass_hash, name, role, email, is_active, employee_id, token_version, updated_at) VALUES ('${idEsc}', '${uNameEsc}', '${passEsc}', '${nameEsc}', '${roleEsc}', '${emailEsc}', ${act}, ${empEsc}, ${ver}, '${updEsc}');`);
        } else {
          lines.push(`INSERT INTO users (id, username, pass_hash, name, role, email, is_active, employee_id, token_version, updated_at) VALUES ('${idEsc}', '${uNameEsc}', '${passEsc}', '${nameEsc}', '${roleEsc}', '${emailEsc}', ${act}, ${empEsc}, ${ver}, '${updEsc}') ON DUPLICATE KEY UPDATE pass_hash=VALUES(pass_hash), name=VALUES(name), role=VALUES(role);`);
        }
      }
      lines.push(``);
    }
  } catch {}

  // 3. Side Tables: wbs_by_project & team_by_project
  for (const side of ["wbs_by_project", "team_by_project"]) {
    try {
      const rows = await q<{ project_id: string; data: string | object }>(`SELECT project_id, data FROM ${side}`);
      if (rows.length > 0) {
        lines.push(`-- Table: ${side} (${rows.length} rows)`);
        for (const r of rows) {
          const pId = escapeSqlString(String(r.project_id));
          const dStr = typeof r.data === "object" ? JSON.stringify(r.data) : String(r.data);
          const dEsc = escapeSqlString(dStr);
          if (dialect === "sqlite") {
            lines.push(`INSERT OR REPLACE INTO "${side}" (project_id, data) VALUES ('${pId}', '${dEsc}');`);
          } else {
            lines.push(`INSERT INTO \`${side}\` (project_id, data) VALUES ('${pId}', '${dEsc}') ON DUPLICATE KEY UPDATE data = VALUES(data);`);
          }
        }
        lines.push(``);
      }
    } catch {}
  }

  if (dialect === "sqlite") {
    lines.push(`COMMIT;`);
  } else {
    lines.push(`COMMIT;`);
    lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
  }
  lines.push(``);

  return lines.join("\n");
}

export async function generateAllCollectionsCsvZip(): Promise<Buffer> {
  const files: ZipFileEntry[] = [];
  const timestamp = new Date().toISOString();

  // Summary CSV
  const summaryRows: string[] = ["collection,row_count,type"];

  for (const col of COLLECTIONS) {
    try {
      const rows = await q<{ id: string; branch: string; data: string | object; updated_at: string }>(
        `SELECT id, branch, data, updated_at FROM ${col}`
      );
      summaryRows.push(`${col},${rows.length},envelope`);

      if (rows.length === 0) {
        files.push({ name: `${col}.csv`, data: "id,branch,updated_at,data\n" });
        continue;
      }

      // Collect distinct data keys across rows to build proper tabular CSV headers
      const sampleKeys = new Set<string>();
      const parsedRows = rows.map((r) => {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = typeof r.data === "string" ? JSON.parse(r.data) : (r.data as Record<string, unknown>);
        } catch {
          parsed = {};
        }
        for (const k of Object.keys(parsed)) {
          sampleKeys.add(k);
        }
        return { id: r.id, branch: r.branch, updated_at: r.updated_at, parsed };
      });

      const dataHeaders = Array.from(sampleKeys);
      const headers = ["id", "branch", "updated_at", ...dataHeaders];
      const csvLines: string[] = [headers.map(escapeCsvCell).join(",")];

      for (const pr of parsedRows) {
        const rowVals: unknown[] = [pr.id, pr.branch, pr.updated_at];
        for (const dh of dataHeaders) {
          rowVals.push(pr.parsed[dh]);
        }
        csvLines.push(rowVals.map(escapeCsvCell).join(","));
      }

      files.push({ name: `${col}.csv`, data: csvLines.join("\n") });
    } catch {
      // Skip failed table
    }
  }

  // Users Table
  try {
    const userRows = await q<{
      id: string; username: string; name: string;
      role: string; email: string; is_active: number; employee_id: string | null;
      updated_at: string;
    }>("SELECT id, username, name, role, email, is_active, employee_id, updated_at FROM users");
    summaryRows.push(`users,${userRows.length},users`);
    const userHeaders = ["id", "username", "name", "role", "email", "is_active", "employee_id", "updated_at"];
    const userCsvLines: string[] = [userHeaders.map(escapeCsvCell).join(",")];
    for (const u of userRows) {
      userCsvLines.push([u.id, u.username, u.name, u.role, u.email, u.is_active ? 1 : 0, u.employee_id ?? "", u.updated_at ?? ""].map(escapeCsvCell).join(","));
    }
    files.push({ name: "users.csv", data: userCsvLines.join("\n") });
  } catch {}

  // Add README & Summary
  files.unshift({ name: "_summary.csv", data: summaryRows.join("\n") });
  files.unshift({
    name: "README.txt",
    data: `ISMS Shipyard Management System - Data Export (CSV Archive)\nExport Timestamp: ${timestamp}\nDialect: ${getDialect()}\nTotal Collections: ${COLLECTIONS.length}\n`,
  });

  return createZipArchive(files);
}

