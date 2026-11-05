import { describe, expect, it } from "vitest";
import { scopeFromHist, scopeToHist } from "../ExportScopeModal";
import { liveAsOf } from "../../Finance";
import { todayISO } from "../../../../utils/format";

describe("cakupan ekspor (#315)", () => {
  it("Seluruh = hari ini, Tahunan = 31 Des, Bulanan = akhir bulan", () => {
    expect(liveAsOf(scopeToHist({ kind: "all" }))).toBe(todayISO());
    expect(liveAsOf(scopeToHist({ kind: "year", year: "2026" }))).toBe("2026-12-31");
    expect(liveAsOf(scopeToHist({ kind: "month", month: "2026-10" }))).toBe("2026-10-31");
    expect(liveAsOf(scopeToHist({ kind: "range", from: "2026-01-01", to: "2026-10-15" }))).toBe("2026-10-15");
  });
  it("cakupan awal mengikuti filter aktif", () => {
    expect(scopeFromHist(scopeToHist({ kind: "month", month: "2026-02" }))).toEqual({ kind: "month", month: "2026-02" });
    expect(scopeFromHist(scopeToHist({ kind: "all" }))).toEqual({ kind: "all" });
  });
});
