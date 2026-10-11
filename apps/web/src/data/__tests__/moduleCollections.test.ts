import { describe, expect, it } from "vitest";
import { financeCollectionsForTab, PROCUREMENT_COLLECTIONS } from "../moduleCollections";

describe("modul sync collection sets", () => {
  it("keeps the complete inventory catalogue out of the Procurement module batch", () => {
    expect(PROCUREMENT_COLLECTIONS).not.toContain("inventory");
    expect(PROCUREMENT_COLLECTIONS).toContain("purchaseOrders");
    expect(PROCUREMENT_COLLECTIONS).toContain("requisitions");
    expect(PROCUREMENT_COLLECTIONS).toContain("settings");
  });

  it("loads only the active Finance flow plus the data for always-visible KPIs", () => {
    const accountCollections = financeCollectionsForTab("Akun");
    expect(accountCollections).toEqual(["settings", "invoices", "payables", "payroll", "projects", "coa"]);
    expect(accountCollections).toContain("invoices");
    expect(accountCollections).toContain("payables");
    expect(accountCollections).toContain("payroll");
    expect(accountCollections).toContain("projects");
    expect(financeCollectionsForTab("Invoice")).toContain("invoices");
    expect(financeCollectionsForTab("Invoice")).toContain("projects");
    expect(financeCollectionsForTab("Project P&L")).toContain("timesheets");
    expect(accountCollections).not.toContain("inventory");
    expect(financeCollectionsForTab("Invoice")).not.toContain("inventory");
  });
});
