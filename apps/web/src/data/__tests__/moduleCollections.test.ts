import { describe, expect, it } from "vitest";
import { financeCollectionsForTab, PROCUREMENT_COLLECTIONS, SHELL_ALERT_COLLECTIONS } from "../moduleCollections";

describe("modul sync collection sets", () => {
  it("keeps the complete inventory catalogue out of the Procurement module batch", () => {
    expect(PROCUREMENT_COLLECTIONS).not.toContain("inventory");
    expect(PROCUREMENT_COLLECTIONS).toContain("purchaseOrders");
    expect(PROCUREMENT_COLLECTIONS).toContain("requisitions");
    expect(PROCUREMENT_COLLECTIONS).toContain("settings");
  });

  it("loads sources used by the global dashboard, bell, and module alert badges", () => {
    for (const collection of [
      "dockSlots", "documents", "equipment", "incidents", "inventory", "invoices",
      "leaves", "ncr", "payables", "payroll", "projects", "purchaseOrders",
      "requests", "requisitions", "termins", "vessels", "activities",
    ]) {
      expect(SHELL_ALERT_COLLECTIONS).toContain(collection);
    }
  });

  it("keeps the complete Finance settlement and invoice-form dependencies on the active flow", () => {
    const accountCollections = financeCollectionsForTab("Akun");
    expect(accountCollections).toEqual(["settings", "invoices", "payables", "payroll", "projects", "coa"]);
    expect(financeCollectionsForTab("Invoice")).toEqual(expect.arrayContaining([
      "invoices", "projects", "bast", "clientPos", "clients", "contracts", "timesheets", "termins",
    ]));
    expect(financeCollectionsForTab("Piutang (AR)")).toEqual(expect.arrayContaining([
      "invoices", "bast", "clients", "contracts", "clientPos",
    ]));
    expect(financeCollectionsForTab("Jadwal Bayar")).toEqual(expect.arrayContaining([
      "payables", "bast", "clients", "contracts", "clientPos",
    ]));
    expect(financeCollectionsForTab("Project P&L")).toContain("timesheets");
    expect(financeCollectionsForTab("Pajak")).toContain("termins");
    expect(accountCollections).not.toContain("inventory");
    expect(financeCollectionsForTab("Invoice")).not.toContain("inventory");
  });
});
