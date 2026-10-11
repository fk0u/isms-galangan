/** Return a cached item only when its name has exactly one case-insensitive exact match. */
export function findUniqueInventoryByName<T>(
  rows: readonly T[],
  rawName: string,
  getName: (row: T) => unknown,
): T | undefined {
  const name = rawName.trim().toLocaleLowerCase();
  if (name === "") return undefined;

  let match: T | undefined;
  for (const row of rows) {
    if (String(getName(row) ?? "").toLocaleLowerCase() !== name) continue;
    if (match !== undefined) return undefined;
    match = row;
  }
  return match;
}
