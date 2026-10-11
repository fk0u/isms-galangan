export type CollectionBatchLoader = (collections: string[]) => Promise<readonly string[]>;

/** Metadata kesegaran saja; baris tetap berada di store yang sudah dibatasi izinnya. */
export class CollectionSyncCache {
  private scope: string | null = null;
  private readonly freshAt = new Map<string, number>();
  private readonly generations = new Map<string, number>();
  private readonly inFlight = new Map<string, { generation: number; promise: Promise<boolean> }>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(ttlMs = 30_000, now: () => number = Date.now) {
    this.ttlMs = ttlMs;
    this.now = now;
  }

  async sync(
    scope: string,
    collections: readonly string[],
    load: CollectionBatchLoader,
    force = false,
  ): Promise<string[]> {
    this.useScope(scope);
    const unique = [...new Set(collections)];
    const waiting = new Map<string, Promise<boolean>>();
    const toLoad: string[] = [];
    const now = this.now();

    for (const collection of unique) {
      const active = this.inFlight.get(collection);
      const generation = this.generations.get(collection) ?? 0;
      if (active && active.generation === generation) {
        waiting.set(collection, active.promise);
        continue;
      }
      const lastSuccess = this.freshAt.get(collection);
      if (!force && lastSuccess !== undefined && now - lastSuccess < this.ttlMs) continue;
      toLoad.push(collection);
    }

    if (toLoad.length > 0) {
      const requestScope = this.scope;
      const versions = new Map(toLoad.map((collection) => [
        collection,
        this.generations.get(collection) ?? 0,
      ]));
      const batch = Promise.resolve().then(() => load(toLoad));
      for (const collection of toLoad) {
        const generation = versions.get(collection) ?? 0;
        const flight = batch
          .then((failed) => {
            const didFail = failed.includes(collection);
            const sameScope = this.scope === requestScope;
            const sameGeneration = (this.generations.get(collection) ?? 0) === versions.get(collection);
            if (sameScope && sameGeneration) {
              if (!didFail) this.freshAt.set(collection, this.now());
              else this.freshAt.delete(collection);
            }
            return didFail;
          })
          .catch(() => {
            const sameScope = this.scope === requestScope;
            const sameGeneration = (this.generations.get(collection) ?? 0) === versions.get(collection);
            if (sameScope && sameGeneration) this.freshAt.delete(collection);
            return true;
          })
          .finally(() => {
            if (this.inFlight.get(collection)?.promise === flight) this.inFlight.delete(collection);
          });
        this.inFlight.set(collection, { generation, promise: flight });
        waiting.set(collection, flight);
      }
    }

    const outcomes = await Promise.all(
      [...waiting.entries()].map(async ([collection, flight]) => [collection, await flight] as const),
    );
    return outcomes.filter(([, failed]) => failed).map(([collection]) => collection);
  }

  invalidate(collections: readonly string[]): void {
    for (const collection of new Set(collections)) {
      this.freshAt.delete(collection);
      this.generations.set(collection, (this.generations.get(collection) ?? 0) + 1);
    }
  }

  generation(collection: string): number {
    return this.generations.get(collection) ?? 0;
  }

  invalidateAll(): void {
    const collections = new Set([...this.freshAt.keys(), ...this.inFlight.keys()]);
    this.invalidate([...collections]);
    this.freshAt.clear();
  }

  private useScope(scope: string): void {
    if (this.scope === scope) return;
    this.scope = scope;
    this.freshAt.clear();
    this.generations.clear();
    /* Request dari JWT sebelumnya dapat selesai untuk pemanggil awal, tetapi
       tidak boleh digabungkan dengan sesi pengguna lain. */
    this.inFlight.clear();
  }
}

export const collectionSyncCache = new CollectionSyncCache();
