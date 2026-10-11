export interface OfflinePersistenceIO {
  idbAvailable: () => Promise<boolean>;
  idbPut: (collection: string, value: unknown) => Promise<boolean>;
  localPut: (collection: string, value: unknown) => boolean;
}

const MAP_COLLECTIONS = new Set(["wbsByProject", "teamByProject"]);
const BASE_MAP_COLLECTIONS = new Set(["wbsBaseByProject", "teamBaseByProject"]);

function isProjectArrayMap(value: unknown): value is Record<string, unknown[]> {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.values(value).every(Array.isArray);
}

function isStringMap(value: unknown): value is Record<string, string> {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.values(value).every((item) => typeof item === "string");
}

/** Gabungkan nilai offline yang valid; peta WBS/Team dipertahankan sebagai object-map. */
export function mergeOfflineValues<T extends Record<string, unknown>>(
  current: T,
  cached: Record<string, unknown>,
): T {
  let changed = false;
  const next = { ...current } as T;
  for (const [collection, value] of Object.entries(cached)) {
    if (Array.isArray(value) && value.length > 0) {
      next[collection as keyof T] = value as T[keyof T];
      changed = true;
      continue;
    }
    if (MAP_COLLECTIONS.has(collection) && isProjectArrayMap(value) && Object.keys(value).length > 0) {
      next[collection as keyof T] = value as T[keyof T];
      changed = true;
    }
  }
  return changed ? next : current;
}

/** Persist hanya selama scope pemilik yang memulai pekerjaan masih aktif. */
export async function persistScopedCollections(
  source: Record<string, unknown>,
  collections: readonly string[],
  isCurrentScope: () => boolean,
  io: OfflinePersistenceIO,
): Promise<number> {
  if (!isCurrentScope()) return 0;
  const useIdb = await io.idbAvailable();
  if (!isCurrentScope()) return 0;

  let failed = 0;
  for (const collection of collections) {
    if (!isCurrentScope()) break;
    const value = source[collection];
    const eligible = Array.isArray(value)
      || (MAP_COLLECTIONS.has(collection) && isProjectArrayMap(value))
      || (BASE_MAP_COLLECTIONS.has(collection) && isStringMap(value));
    if (!eligible) continue;
    const ok = useIdb
      ? await io.idbPut(collection, value)
      : io.localPut(collection, value);
    if (!isCurrentScope()) break;
    if (!ok) failed += 1;
  }
  return failed;
}
