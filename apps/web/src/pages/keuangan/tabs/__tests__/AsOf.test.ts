import { describe, expect, it } from "vitest";
import { emptyHist, liveAsOf } from "../../Finance";
import { todayISO } from "../../../../utils/format";

/* #313: as-of tiap mode filter; "Semua" = hari ini, bukan tanggal jurnal/jatuh tempo terbesar. */
describe("liveAsOf", () => {
  it("Semua = hari ini", () => expect(liveAsOf(emptyHist())).toBe(todayISO()));
  it("Bulan = akhir bulan", () => expect(liveAsOf({ ...emptyHist(), mode: "Bulan", bulan: "2026-02" })).toBe("2026-02-28"));
  it("Tahun = 31 Des", () => expect(liveAsOf({ ...emptyHist(), mode: "Tahun", tahun: "2025" })).toBe("2025-12-31"));
  it("Rentang = tanggal akhir", () => expect(liveAsOf({ ...emptyHist(), mode: "Rentang", dari: "2026-01-01", sampai: "2026-03-15" })).toBe("2026-03-15"));
});
