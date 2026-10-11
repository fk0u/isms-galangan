import { describe, expect, it } from "vitest";
import { rowsInBranch } from "../branchScope";
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

  it("keeps global visibility explicit", () => {
    expect(rowsInBranch(rows, "SEMUA")).toBe(rows);
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
