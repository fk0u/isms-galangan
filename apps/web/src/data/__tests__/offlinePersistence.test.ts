import { describe, expect, it, vi } from "vitest";
import { mergeOfflineValues, persistScopedCollections } from "../offlinePersistence";

describe("persistScopedCollections", () => {
  it("does not write if the owner changes while IndexedDB availability is pending", async () => {
    let current = true;
    let release!: (available: boolean) => void;
    const idbAvailable = vi.fn(() => new Promise<boolean>((resolve) => { release = resolve; }));
    const idbPut = vi.fn(async () => true);
    const localPut = vi.fn(() => true);

    const pending = persistScopedCollections(
      { invoices: [{ id: "old-owner" }] },
      ["invoices"],
      () => current,
      { idbAvailable, idbPut, localPut },
    );
    current = false;
    release(true);

    await expect(pending).resolves.toBe(0);
    expect(idbPut).not.toHaveBeenCalled();
    expect(localPut).not.toHaveBeenCalled();
  });

  it("stops later collection writes after an in-flight write observes an owner change", async () => {
    let current = true;
    let release!: (ok: boolean) => void;
    const idbPut = vi.fn((collection: string) => collection === "invoices"
      ? new Promise<boolean>((resolve) => { release = resolve; })
      : Promise.resolve(true));
    const localPut = vi.fn(() => true);
    const pending = persistScopedCollections(
      { invoices: [{ id: "i1" }], projects: [{ id: "p1" }] },
      ["invoices", "projects"],
      () => current,
      { idbAvailable: async () => true, idbPut, localPut },
    );

    await Promise.resolve();
    await Promise.resolve();
    current = false;
    release(true);

    await expect(pending).resolves.toBe(0);
    expect(idbPut.mock.calls.map(([collection]) => collection)).toEqual(["invoices"]);
  });

  it("persists WBS and team maps and restores them after an offline reload", async () => {
    const source = {
      wbsByProject: { PRJ1: [{ task: "Hull", progress: 45 }] },
      teamByProject: { PRJ1: ["EMP1", "EMP2"] },
      wbsBaseByProject: { PRJ1: JSON.stringify([{ task: "Hull", progress: 20 }]) },
      teamBaseByProject: { PRJ1: JSON.stringify(["EMP1"]) },
    };
    const idbPut = vi.fn(async (_collection: string, _value: unknown) => true);
    await expect(persistScopedCollections(source, Object.keys(source), () => true, {
      idbAvailable: async () => true,
      idbPut,
      localPut: vi.fn(() => true),
    })).resolves.toBe(0);
    expect(idbPut).toHaveBeenNthCalledWith(1, "wbsByProject", source.wbsByProject);
    expect(idbPut).toHaveBeenNthCalledWith(2, "teamByProject", source.teamByProject);
    expect(idbPut).toHaveBeenNthCalledWith(3, "wbsBaseByProject", source.wbsBaseByProject);
    expect(idbPut).toHaveBeenNthCalledWith(4, "teamBaseByProject", source.teamBaseByProject);

    const hydrated = mergeOfflineValues(
      { wbsByProject: {}, teamByProject: {} },
      Object.fromEntries(idbPut.mock.calls) as Record<string, unknown>,
    );
    expect(hydrated).toEqual({
      wbsByProject: source.wbsByProject,
      teamByProject: source.teamByProject,
    });
  });

  it("ignores malformed side maps and never hydrates values into unrelated fields", () => {
    const current = { wbsByProject: {}, teamByProject: {}, projects: [] };
    const hydrated = mergeOfflineValues(current, {
      wbsByProject: { PRJ1: "not-an-array" },
      teamByProject: { PRJ1: ["EMP1"] },
      backendError: { message: "not a persisted collection" },
    });
    expect(hydrated.wbsByProject).toEqual({});
    expect(hydrated.teamByProject).toEqual({ PRJ1: ["EMP1"] });
    expect(hydrated.projects).toEqual([]);
  });
});
