export interface ProjectExistenceChange<T extends { id: string } = { id: string }> {
  epoch: number;
  exists: boolean;
  row?: T;
}

/**
 * Server project rows define the scope at request time. Only local existence
 * mutations newer than that request may override it; older offline/session
 * cache entries never widen the authorized project set.
 */
export function mergeProjectIdsAfterPull(
  serverProjectIds: Iterable<string>,
  changes: ReadonlyMap<string, ProjectExistenceChange<{ id: string }>>,
  mutationEpochAtStart: number,
): Set<string> {
  const live = new Set(serverProjectIds);
  for (const [projectId, change] of changes) {
    if (change.epoch <= mutationEpochAtStart) continue;
    if (change.exists) live.add(projectId);
    else live.delete(projectId);
  }
  return live;
}

/** Apply newer local create/update/delete operations over a stale project GET. */
export function mergeProjectRowsAfterPull<T extends { id: string }>(
  serverRows: T[],
  localRows: T[] | undefined,
  changes: ReadonlyMap<string, ProjectExistenceChange<T>>,
  mutationEpochAtStart: number,
): T[] {
  const rows = new Map(serverRows.map((row) => [String(row.id), row]));
  const localById = new Map((localRows ?? []).map((row) => [String(row.id), row]));
  for (const [projectId, change] of changes) {
    if (change.epoch <= mutationEpochAtStart) continue;
    if (!change.exists) {
      rows.delete(projectId);
      continue;
    }
    const row = change.row ?? localById.get(projectId);
    if (row) rows.set(projectId, row);
  }
  return [...rows.values()];
}
