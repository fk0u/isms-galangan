import { describe, expect, it } from "vitest";
import { mergeProjectIdsAfterPull, mergeProjectRowsAfterPull } from "../projectPullScope";

describe("mergeProjectIdsAfterPull", () => {
  it("retains a project created after the pull started without widening to old cache IDs", () => {
    const live = mergeProjectIdsAfterPull(
      [],
      new Map([
        ["new-project", { epoch: 3, exists: true }],
        ["stale-off-scope", { epoch: 1, exists: true }],
      ]),
      2,
    );

    expect([...live]).toEqual(["new-project"]);
  });

  it("applies a project removal made during the pull over a stale server result", () => {
    const live = mergeProjectIdsAfterPull(
      ["removed-project", "still-live"],
      new Map([["removed-project", { epoch: 4, exists: false }]]),
      3,
    );

    expect([...live]).toEqual(["still-live"]);
  });

  it("treats the server snapshot as authoritative for mutations older than the pull", () => {
    const live = mergeProjectIdsAfterPull(
      [],
      new Map([["old-project", { epoch: 2, exists: true }]]),
      2,
    );

    expect(live.size).toBe(0);
  });

  it("keeps an existence marker available for an older concurrent resync that finishes later", () => {
    const changes = new Map([["new-project", { epoch: 3, exists: true }]]);
    const newerPull = mergeProjectIdsAfterPull([], changes, 3);
    const olderPullFinishingLater = mergeProjectIdsAfterPull([], changes, 2);

    expect(newerPull.size).toBe(0);
    expect([...olderPullFinishingLater]).toEqual(["new-project"]);
  });

  it("applies newer creates and deletes to the project rows committed from a stale response", () => {
    const changes = new Map([
      ["new-project", { epoch: 3, exists: true, row: { id: "new-project", title: "New" } }],
      ["deleted-project", { epoch: 4, exists: false }],
    ]);
    const merged = mergeProjectRowsAfterPull(
      [{ id: "deleted-project", title: "Stale" }, { id: "server-project", title: "Server" }],
      [],
      changes,
      2,
    );

    expect(merged).toEqual([
      { id: "server-project", title: "Server" },
      { id: "new-project", title: "New" },
    ]);
  });
});
