import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { searchContainsPredicate } from "../routes/crudSearch.js";

describe("CRUD row search", () => {
  it("matches inventory text regardless of capitalization in SQLite", () => {
    const db = new Database(":memory:");
    try {
      db.exec("CREATE TABLE inventory (data TEXT NOT NULL)");
      db.prepare("INSERT INTO inventory (data) VALUES (?)").run(JSON.stringify({ name: "Bolt Rope 16mm" }));
      const sql = `SELECT data FROM inventory WHERE ${searchContainsPredicate("sqlite")}`;

      expect(db.prepare(sql).all("bolt rope")).toHaveLength(1);
      expect(db.prepare(sql).all("BOLT")).toHaveLength(1);
      expect(db.prepare(sql).all("not-present")).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it("uses a MySQL-compatible case-insensitive substring predicate", () => {
    expect(searchContainsPredicate("mysql")).toBe("LOCATE(LOWER(?), LOWER(data)) > 0");
  });
});
