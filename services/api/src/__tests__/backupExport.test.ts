import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pruneOldBackups, listBackups } from "../backup.js";
import { getMsUntilNextMidnight } from "../backupScheduler.js";
import { generateSqlDump, generateAllCollectionsCsvZip } from "../exportSql.js";

describe("Backup Retention and Export System", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "isms-test-backups-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("calculates delay to next midnight correctly", () => {
    const ms = getMsUntilNextMidnight();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 3600 * 1000);
  });

  it("prunes backups to strictly keep only the latest 2 databases", () => {
    // Buat 4 direktori dummy backup dengan manifest
    const dates = [
      "2026-11-01T00-00-00-000Z",
      "2026-11-02T00-00-00-000Z",
      "2026-11-03T00-00-00-000Z",
      "2026-11-04T00-00-00-000Z",
    ];

    for (const d of dates) {
      const bDir = path.join(tmpDir, d);
      fs.mkdirSync(bDir, { recursive: true });
      fs.writeFileSync(
        path.join(bDir, "manifest.json"),
        JSON.stringify({ timestamp: d, dialect: "sqlite", dbFile: "isms.db", tablesCount: 71 }),
      );
      fs.writeFileSync(path.join(bDir, "isms.db"), "dummy db content");
    }

    const beforePrune = listBackups(tmpDir);
    expect(beforePrune.length).toBe(4);

    // Prune dengan retensi 2
    const deleted = pruneOldBackups(tmpDir, 2);
    expect(deleted.length).toBe(2);
    expect(deleted).toContain("2026-11-01T00-00-00-000Z");
    expect(deleted).toContain("2026-11-02T00-00-00-000Z");

    const afterPrune = listBackups(tmpDir);
    expect(afterPrune.length).toBe(2);
    expect(afterPrune[0].id).toBe("2026-11-04T00-00-00-000Z");
    expect(afterPrune[1].id).toBe("2026-11-03T00-00-00-000Z");
  });

  it("generates valid SQL dump string", async () => {
    const sql = await generateSqlDump();
    expect(sql).toContain("ISMS Shipyard Management System - Full Database Dump");
    expect(sql).toContain("PRAGMA foreign_keys = OFF;");
    expect(sql).toContain("COMMIT;");
  });

  it("generates valid CSV ZIP archive", async () => {
    const zipBuf = await generateAllCollectionsCsvZip();
    expect(Buffer.isBuffer(zipBuf)).toBe(true);
    expect(zipBuf.length).toBeGreaterThan(100);
    // Verifikasi magic bytes ZIP (PK\x03\x04)
    expect(zipBuf.subarray(0, 4).toString("hex")).toBe("504b0304");
  });
});
