import type { StoreItem, StoreShape } from "./store";
import { rowsInBranch } from "./branchScope";
import { SHELL_ALERT_COLLECTIONS } from "./moduleCollections";

/** Batasi input alert lintas-modul ke koleksi dan proyek pada cabang aktif. */
export function scopeAlertStoreData(data: StoreShape, branch: string): StoreShape {
  const scoped = { ...data } as StoreShape;
  const mutable = scoped as unknown as Record<string, unknown>;
  for (const collection of SHELL_ALERT_COLLECTIONS) {
    if (collection === "settings") continue;
    const rows = data[collection] as StoreItem[] | undefined;
    if (Array.isArray(rows)) mutable[collection] = rowsInBranch(rows, branch);
  }
  const projects = rowsInBranch(data.projects ?? [], branch);
  scoped.projects = projects;
  const projectIds = new Set(projects.map((project) => String(project.id)));
  scoped.wbsByProject = Object.fromEntries(
    Object.entries(data.wbsByProject ?? {}).filter(([projectId]) => projectIds.has(projectId)),
  );
  return scoped;
}
