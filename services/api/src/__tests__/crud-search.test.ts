import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { exactBranchPredicate, exactJsonNamePredicate, searchContainsPredicate } from "../routes/crudSearch.js";

describe("CRUD row search", () => {
  it("matches ASCII and Unicode text regardless of capitalization in SQLite", () => {
    const db = new Database(":memory:");
    db.function("unicode_lower", (value: unknown) => String(value ?? "").toLowerCase());
    try {
      db.exec("CREATE TABLE inventory (data TEXT NOT NULL)");
      db.prepare("INSERT INTO inventory (data) VALUES (?)").run(JSON.stringify({ name: "Bolt Rope 16mm" }));
      db.prepare("INSERT INTO inventory (data) VALUES (?)").run(JSON.stringify({ name: "Ärztlicher Verbrauch" }));
      const sql = `SELECT data FROM inventory WHERE ${searchContainsPredicate("sqlite")}`;

      expect(db.prepare(sql).all("bolt rope")).toHaveLength(1);
      expect(db.prepare(sql).all("BOLT")).toHaveLength(1);
      expect(db.prepare(sql).all("ärztlich")).toHaveLength(1);
      expect(db.prepare(sql).all("ÄRZT")).toHaveLength(1);
      expect(db.prepare(sql).all("not-present")).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it("uses MySQL case-folding and a binary branch comparison", () => {
    expect(searchContainsPredicate("mysql")).toBe("LOCATE(LOWER(?), LOWER(data)) > 0");
    expect(exactJsonNamePredicate("mysql")).toContain("JSON_EXTRACT(data, '$.name')");
    expect(exactJsonNamePredicate("mysql")).toContain("BINARY LOWER(?)");
    expect(exactBranchPredicate("mysql")).toBe("BINARY branch = BINARY ?");
  });

  it("matches an exact JSON name rather than a substring and ignores malformed JSON", () => {
    const db = new Database(":memory:");
    db.function("unicode_lower", (value: unknown) => String(value ?? "").toLowerCase());
    try {
      db.exec("CREATE TABLE inventory (data TEXT NOT NULL)");
      db.prepare("INSERT INTO inventory (data) VALUES (?)").run(JSON.stringify({ name: "Probe marine pump" }));
      db.prepare("INSERT INTO inventory (data) VALUES (?)").run(JSON.stringify({ name: "Probe marine pump spare" }));
      db.prepare("INSERT INTO inventory (data) VALUES (?)").run("not-json");
      const sql = `SELECT data FROM inventory WHERE ${exactJsonNamePredicate("sqlite")}`;

      const matches = db.prepare(sql).all("PROBE MARINE PUMP") as Array<{ data: string }>;
      expect(matches).toHaveLength(1);
      expect(JSON.parse(matches[0]!.data)).toEqual({ name: "Probe marine pump" });
      expect(db.prepare(sql).all("marine")).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it("uses SQLite's exact binary collation for branch equality", () => {
    expect(exactBranchPredicate("sqlite")).toBe("branch = ?");
  });
});
