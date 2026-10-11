import { afterEach, describe, expect, it } from "vitest";
import { dbEvents } from "../db.js";
import { cacheClear, cacheGeneration, cacheGet, cachePut, cacheStats } from "../listCache.js";

const key = "projects|/api/projects?limit=50|branch:Samarinda|*";

afterEach(() => cacheClear());

describe("list response cache generation fence", () => {
  it("does not store a GET response started before a table invalidation", () => {
    const generationAtStart = cacheGeneration("projects");
    dbEvents.emit("write", "projects");

    const response = cachePut(key, "projects", { rows: [{ id: "stale" }] }, generationAtStart);

    expect(response.json).toContain("stale");
    expect(cacheStats().entries).toBe(0);
    expect(cacheGet(key)).toBeNull();
  });

  it("invalidates a result cached during a transaction when commit completes", () => {
    const generationAfterWrite = cacheGeneration("projects");
    cachePut(key, "projects", { rows: [{ id: "pre-commit" }] }, generationAfterWrite);
    expect(cacheGet(key)).not.toBeNull();

    dbEvents.emit("write-commit", "projects");

    expect(cacheGet(key)).toBeNull();
  });

  it("keeps generations table-scoped and invalidates old tokens on cache clear", () => {
    const oldProjects = cacheGeneration("projects");
    const currentInventory = cacheGeneration("inventory");
    dbEvents.emit("write", "projects");

    cachePut(key, "projects", { rows: [] }, oldProjects);
    cachePut("inventory|/api/inventory", "inventory", { rows: [] }, currentInventory);
    expect(cacheGet("inventory|/api/inventory")).not.toBeNull();

    const beforeClear = cacheGeneration("inventory");
    cacheClear();
    cachePut("inventory|/api/inventory", "inventory", { rows: [{ id: "old" }] }, beforeClear);
    expect(cacheGet("inventory|/api/inventory")).toBeNull();
  });
});
