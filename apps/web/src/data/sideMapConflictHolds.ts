export const SIDE_MAP_CONFLICTS_KEY = "isms.sideMapConflicts";

export interface ConflictHoldStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function isSideMapConflictKey(value: unknown): value is string {
  return typeof value === "string"
    && /^(wbs|team):[^:]+$/.test(value);
}

export function loadSideMapConflictHolds(storage: ConflictHoldStorage): Set<string> {
  try {
    const parsed = JSON.parse(storage.getItem(SIDE_MAP_CONFLICTS_KEY) ?? "null") as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter(isSideMapConflictKey)) : new Set();
  } catch {
    return new Set();
  }
}

export function persistSideMapConflictHolds(storage: ConflictHoldStorage, holds: ReadonlySet<string>): void {
  try {
    const valid = [...holds].filter(isSideMapConflictKey).sort();
    if (valid.length === 0) storage.removeItem(SIDE_MAP_CONFLICTS_KEY);
    else storage.setItem(SIDE_MAP_CONFLICTS_KEY, JSON.stringify(valid));
  } catch {
    /* Data edits remain intact; only explicit conflict holds could be lost. */
  }
}
