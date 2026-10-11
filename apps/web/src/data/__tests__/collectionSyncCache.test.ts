import { describe, expect, it, vi } from "vitest";
import { CollectionSyncCache } from "../collectionSyncCache";

describe("CollectionSyncCache", () => {
  it("uses valid collection data again until the TTL expires", async () => {
    let now = 1_000;
    const cache = new CollectionSyncCache(500, () => now);
    const load = vi.fn(async (_collections: string[]) => [] as string[]);

    await cache.sync("session-a", ["invoices"], load);
    await cache.sync("session-a", ["invoices"], load);
    expect(load).toHaveBeenCalledTimes(1);

    now += 501;
    await cache.sync("session-a", ["invoices"], load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("coalesces overlapping requests and fetches only the missing collections", async () => {
    const cache = new CollectionSyncCache();
    const releases: Array<(failed: readonly string[]) => void> = [];
    const load = vi.fn((_collections: string[]) => new Promise<readonly string[]>((resolve) => { releases.push(resolve); }));

    const first = cache.sync("session-a", ["invoices", "projects"], load);
    const second = cache.sync("session-a", ["invoices", "payables"], load);
    await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.calls.map(([cols]) => cols)).toEqual([["invoices", "projects"], ["payables"]]);

    releases.forEach((release) => release([]));
    await Promise.all([first, second]);
    expect(await cache.sync("session-a", ["invoices", "projects", "payables"], load)).toEqual([]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("invalidates only the named collection and respects the active session", async () => {
    const cache = new CollectionSyncCache();
    const load = vi.fn(async (_collections: string[]) => [] as string[]);

    await cache.sync("session-a", ["invoices", "payables"], load);
    cache.invalidate(["invoices"]);
    await cache.sync("session-a", ["invoices", "payables"], load);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.calls[1]?.[0]).toEqual(["invoices"]);

    await cache.sync("session-b", ["invoices", "payables"], load);
    expect(load).toHaveBeenCalledTimes(3);
    expect(load.mock.calls[2]?.[0]).toEqual(["invoices", "payables"]);
  });

  it("does not mark a request fresh when an SSE/write invalidates it in flight", async () => {
    const cache = new CollectionSyncCache();
    const releases: Array<(failed: readonly string[]) => void> = [];
    const load = vi.fn((_collections: string[]) => new Promise<readonly string[]>((resolve) => { releases.push(resolve); }));

    const pending = cache.sync("session-a", ["inventory"], load);
    await Promise.resolve();
    cache.invalidate(["inventory"]);
    releases[0]?.([]);
    await pending;

    const refreshed = cache.sync("session-a", ["inventory"], load);
    await Promise.resolve();
    releases[1]?.([]);
    await refreshed;
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("does not let an older invalidated flight clear a newer fresh result", async () => {
    const cache = new CollectionSyncCache();
    const releases: Array<(failed: readonly string[]) => void> = [];
    const load = vi.fn((_collections: string[]) => new Promise<readonly string[]>((resolve) => { releases.push(resolve); }));

    const oldFlight = cache.sync("session-a", ["projects"], load);
    await Promise.resolve();
    cache.invalidate(["projects"]);
    const currentFlight = cache.sync("session-a", ["projects"], load);
    await Promise.resolve();

    releases[1]?.([]);
    await currentFlight;
    releases[0]?.([]);
    await oldFlight;

    await cache.sync("session-a", ["projects"], load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("exposes a newer generation after selective invalidation", () => {
    const cache = new CollectionSyncCache();
    const startedAt = cache.generation("inventory");

    cache.invalidate(["inventory"]);

    expect(cache.generation("inventory")).toBe(startedAt + 1);
    expect(cache.generation("invoices")).toBe(0);
  });
});
