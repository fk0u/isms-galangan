import { describe, expect, it } from "vitest";
import { SideMapEpochs, shouldRetainSideProjectData } from "../sideMapEpochs";

describe("SideMapEpochs", () => {
  it("rejects pull snapshots older than an online or offline mutation per side/project", () => {
    const epochs = new SideMapEpochs();
    const snapshot = epochs.capture(["PRJ1", "PRJ2"]);

    epochs.bump("wbs", "PRJ1");

    expect(epochs.isCurrent("wbs", "PRJ1", snapshot)).toBe(false);
    expect(epochs.isCurrent("team", "PRJ1", snapshot)).toBe(true);
    expect(epochs.isCurrent("wbs", "PRJ2", snapshot)).toBe(true);
  });

  it("rejects pulls that begin while a write is in flight and remain stale after it settles", () => {
    const epochs = new SideMapEpochs();
    const token = epochs.beginWrite("wbs", "PRJ1");
    const duringWrite = epochs.capture(["PRJ1"]);

    expect(epochs.isCurrent("wbs", "PRJ1", duringWrite)).toBe(false);
    epochs.finishWrite("wbs", "PRJ1", token);
    expect(epochs.isCurrent("wbs", "PRJ1", duringWrite)).toBe(false);
  });

  it("clears epochs with the owner-scoped store lifecycle", () => {
    const epochs = new SideMapEpochs();
    const token = epochs.beginWrite("team", "PRJ1");
    const old = epochs.capture(["PRJ1"]);
    epochs.clear();
    epochs.finishWrite("team", "PRJ1", token);
    expect(epochs.isCurrent("team", "PRJ1", old)).toBe(false);
    expect(epochs.capture(["PRJ1"])["team:PRJ1"]).toBe(0);
  });

  it("prunes clean side data when the live project set is empty but keeps dirty/held drafts", () => {
    const live = new Set<string>();
    const dirty = new Set(["wbs:PRJ2"]);
    const holds = new Set(["team:PRJ3"]);
    const epochs = new SideMapEpochs();
    const token = epochs.beginWrite("team", "PRJ5");

    expect(shouldRetainSideProjectData("wbs", "PRJ1", live, dirty, holds)).toBe(false);
    expect(shouldRetainSideProjectData("wbs", "PRJ2", live, dirty, holds)).toBe(true);
    expect(shouldRetainSideProjectData("team", "PRJ3", live, dirty, holds)).toBe(true);
    expect(shouldRetainSideProjectData("team", "PRJ4", live, new Set(["teamByProject"]), holds)).toBe(true);
    expect(shouldRetainSideProjectData("team", "PRJ5", live, dirty, holds, epochs.activeWriteKeys())).toBe(true);
    epochs.finishWrite("team", "PRJ5", token);
  });
});
