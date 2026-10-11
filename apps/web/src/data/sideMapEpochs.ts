export type SideMapKind = "wbs" | "team";
export type SideMapEpochSnapshot = Record<string, number>;

export function shouldRetainSideProjectData(
  kind: SideMapKind,
  projectId: string,
  liveProjects: Set<string>,
  dirty: Set<string>,
  conflictHolds: Set<string>,
  activeWriteKeys: ReadonlySet<string> = new Set<string>(),
): boolean {
  const key = `${kind}:${projectId}`;
  const collectionKey = kind === "wbs" ? "wbsByProject" : "teamByProject";
  return liveProjects.has(projectId)
    || dirty.has(collectionKey)
    || dirty.has(key)
    || conflictHolds.has(key)
    || activeWriteKeys.has(key);
}

export class SideMapEpochs {
  private readonly values = new Map<string, number>();
  private readonly activeWrites = new Map<string, Set<number>>();
  private nextWriteToken = 1;

  private key(kind: SideMapKind, projectId: string): string {
    return `${kind}:${projectId}`;
  }

  bump(kind: SideMapKind, projectId: string): number {
    const key = this.key(kind, projectId);
    const next = (this.values.get(key) ?? 0) + 1;
    this.values.set(key, next);
    return next;
  }

  beginWrite(kind: SideMapKind, projectId: string): number {
    const key = this.key(kind, projectId);
    const token = this.nextWriteToken++;
    const active = this.activeWrites.get(key) ?? new Set<number>();
    active.add(token);
    this.activeWrites.set(key, active);
    this.bump(kind, projectId);
    return token;
  }

  finishWrite(kind: SideMapKind, projectId: string, token: number): void {
    const key = this.key(kind, projectId);
    const active = this.activeWrites.get(key);
    // clear() invalidates tokens from the previous owner/reset; late completions
    // must not create new epoch state in the new lifecycle.
    if (!active?.delete(token)) return;
    if (active.size === 0) this.activeWrites.delete(key);
    this.bump(kind, projectId);
  }

  capture(projectIds: string[]): SideMapEpochSnapshot {
    const snapshot: SideMapEpochSnapshot = {};
    for (const projectId of projectIds) {
      for (const kind of ["wbs", "team"] as const) {
        const key = this.key(kind, projectId);
        const value = this.values.get(key) ?? 0;
        this.values.set(key, value);
        snapshot[key] = value;
      }
    }
    return snapshot;
  }

  isCurrent(kind: SideMapKind, projectId: string, snapshot: SideMapEpochSnapshot): boolean {
    const key = this.key(kind, projectId);
    return (this.activeWrites.get(key)?.size ?? 0) === 0
      && (snapshot[key] ?? 0) === (this.values.get(key) ?? 0);
  }

  projectIds(): string[] {
    const ids = new Set<string>();
    for (const key of this.values.keys()) {
      if (key.startsWith("wbs:")) ids.add(key.slice("wbs:".length));
      else if (key.startsWith("team:")) ids.add(key.slice("team:".length));
    }
    return [...ids];
  }

  activeWriteKeys(): Set<string> {
    const keys = new Set<string>();
    for (const [key, tokens] of this.activeWrites) {
      if (tokens.size > 0) keys.add(key);
    }
    return keys;
  }

  clear(): void {
    this.values.clear();
    this.activeWrites.clear();
  }
}
