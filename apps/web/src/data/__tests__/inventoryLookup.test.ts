import { describe, expect, it } from "vitest";
import { findUniqueInventoryByName } from "../inventoryLookup";

describe("findUniqueInventoryByName", () => {
  it("returns the sole case-insensitive exact match, not a substring", () => {
    const exact = { id: "exact", name: "Marine Pump" };
    const rows = [
      { id: "substring", name: "Marine Pump Seal" },
      exact,
    ];
    expect(findUniqueInventoryByName(rows, "marine pump", (row) => row.name)).toBe(exact);
  });

  it("fails closed when cached exact-name matches are ambiguous", () => {
    const rows = [
      { id: "first", name: "Marine Pump" },
      { id: "second", name: "marine pump" },
    ];
    expect(findUniqueInventoryByName(rows, "Marine Pump", (row) => row.name)).toBeUndefined();
  });

  it("returns undefined when there is no exact match", () => {
    expect(findUniqueInventoryByName([{ id: "one", name: "Marine Pump Seal" }], "Marine Pump", (row) => row.name)).toBeUndefined();
  });
});
