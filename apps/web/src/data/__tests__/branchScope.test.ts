import { describe, expect, it } from "vitest";
import { initialBranchScope, rowsInBranch, verifiedBranchScope } from "../branchScope";
import { scopeAlertStoreData } from "../scopeAlertData";
import type { StoreShape } from "../store";

describe("rowsInBranch", () => {
  const rows = [
    { id: "same", branch: "Samarinda" },
    { id: "other", branch: "Balikpapan" },
    { id: "empty", branch: "" },
    { id: "missing" },
    { id: "case", branch: "samarinda" },
  ];

  it("fails closed for empty, missing, or differently-cased branch rows", () => {
    expect(rowsInBranch(rows, "Samarinda").map((row) => row.id)).toEqual(["same"]);
  });

  it("returns no rows when the active scope is unresolved, even for an empty-branch row", () => {
    expect(rowsInBranch(rows, "")).toEqual([]);
    expect(rowsInBranch(rows, "   ")).toEqual([]);
    expect(rowsInBranch([{ id: "empty", branch: "" }], "")).toEqual([]);
  });

  it("keeps global visibility explicit", () => {
    expect(rowsInBranch(rows, "SEMUA")).toBe(rows);
  });

  it("hides a backend cache until the current server branch is verified", () => {
    const cached = [{ id: "old-branch", branch: "Samarinda" }, { id: "new-branch", branch: "Balikpapan" }];
    const initial = initialBranchScope(true, "SEMUA");
    expect(initial).toBe("");
    expect(rowsInBranch(cached, initial)).toEqual([]);
    expect(rowsInBranch(cached, verifiedBranchScope("Balikpapan")).map((row) => row.id)).toEqual(["new-branch"]);
  });

  it("uses saved scope only in local mode and fails closed for missing server branch", () => {
    expect(initialBranchScope(false, "Samarinda")).toBe("Samarinda");
    expect(initialBranchScope(false, null)).toBe("SEMUA");
    expect(initialBranchScope(true, null)).toBe("");
    expect(verifiedBranchScope(undefined)).toBe("");
    expect(verifiedBranchScope("")).toBe("");
    expect(verifiedBranchScope("  ")).toBe("");
  });

  it("scopes alert collections and WBS to projects visible in the active branch", () => {
    const data = {
      projects: [{ id: "p1", branch: "Samarinda" }, { id: "p2", branch: "Balikpapan" }],
      inventory: [{ id: "i1", branch: "Samarinda" }, { id: "i2", branch: "Balikpapan" }],
      activities: [{ id: "a1", branch: "Samarinda" }, { id: "a2", branch: "Balikpapan" }],
      wbsByProject: { p1: [{ task: "same" }], p2: [{ task: "other" }] },
      settings: [{ id: "global-setting", key: "ALERT_BUDGET_PCT", value: 80 }],
    } as unknown as StoreShape;
    const scoped = scopeAlertStoreData(data, "Samarinda");
    expect(scoped.projects.map((row) => row.id)).toEqual(["p1"]);
    expect(scoped.inventory.map((row) => row.id)).toEqual(["i1"]);
    expect(scoped.activities.map((row) => row.id)).toEqual(["a1"]);
    expect(Object.keys(scoped.wbsByProject ?? {})).toEqual(["p1"]);
    expect(scoped.settings).toBe(data.settings);
  });
});
