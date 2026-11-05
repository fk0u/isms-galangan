import { describe, expect, it } from "vitest";
import { akhirBulanSebelum, emptyHist, histFromParam, histToParam, liveAsOf, withModeDefault } from "../../Finance";
import { todayISO } from "../../../../utils/format";

/* #313: as-of tiap mode filter; "Semua" = hari ini, bukan tanggal jurnal/jatuh tempo terbesar. */
describe("liveAsOf", () => {
  it("Semua = hari ini", () => expect(liveAsOf(emptyHist())).toBe(todayISO()));
  it("Bulan = akhir bulan", () => expect(liveAsOf({ ...emptyHist(), mode: "Bulan", bulan: "2026-02" })).toBe("2026-02-28"));
  it("Tahun = 31 Des", () => expect(liveAsOf({ ...emptyHist(), mode: "Tahun", tahun: "2025" })).toBe("2025-12-31"));
  it("Rentang = tanggal akhir", () => expect(liveAsOf({ ...emptyHist(), mode: "Rentang", dari: "2026-01-01", sampai: "2026-03-15" })).toBe("2026-03-15"));
});

/* #313: tombol mode harus menghasilkan filter yang bisa dikodekan ke URL, kalau tidak
   ia kembali ke "Semua" dan terlihat tidak bisa ditekan. */
describe("withModeDefault", () => {
  for (const mode of ["Bulan", "Hari", "Tahun", "Rentang"] as const) {
    it(`${mode} dari kosong tetap ${mode} setelah lewat URL`, () => {
      expect(histFromParam(histToParam(withModeDefault(emptyHist(), mode))).mode).toBe(mode);
    });
  }
  it("nilai yang sudah ada tidak ditimpa", () => {
    expect(withModeDefault({ ...emptyHist(), bulan: "2026-03" }, "Bulan").bulan).toBe("2026-03");
  });
});

describe("akhirBulanSebelum", () => {
  it("batas saldo awal bulan", () => {
    expect(akhirBulanSebelum("2026-11-05")).toBe("2026-10-31");
    expect(akhirBulanSebelum("2026-03-31")).toBe("2026-02-28");
    expect(akhirBulanSebelum("2026-01-15")).toBe("2025-12-31");
  });
});
