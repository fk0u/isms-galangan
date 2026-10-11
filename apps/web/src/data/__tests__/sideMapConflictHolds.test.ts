import { describe, expect, it } from "vitest";
import { loadSideMapConflictHolds, persistSideMapConflictHolds, SIDE_MAP_CONFLICTS_KEY } from "../sideMapConflictHolds";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("side map conflict holds", () => {
  it("round-trips only WBS/team project keys and removes the hold on explicit resolution", () => {
    const storage = memoryStorage();
    const holds = new Set(["wbs:PRJ1", "team:PRJ2", "unknown:PRJ3", "team:"]);
    persistSideMapConflictHolds(storage, holds);
    expect(loadSideMapConflictHolds(storage)).toEqual(new Set(["wbs:PRJ1", "team:PRJ2"]));

    persistSideMapConflictHolds(storage, new Set());
    expect(storage.getItem(SIDE_MAP_CONFLICTS_KEY)).toBeNull();
  });

  it("fails closed to an empty set for malformed persisted content", () => {
    const storage = memoryStorage();
    storage.setItem(SIDE_MAP_CONFLICTS_KEY, "not-json");
    expect(loadSideMapConflictHolds(storage)).toEqual(new Set());
  });
});
