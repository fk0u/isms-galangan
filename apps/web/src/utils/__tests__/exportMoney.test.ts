import { describe, expect, it } from "vitest";
import { asMoney, moneyColumns } from "../export";

describe("format Rupiah ekspor (#276)", () => {
  it("kolom nominal diformat Rp, kolom qty/kode tidak", () => {
    const cols = moneyColumns(["Kode", "Qty", "Harga Satuan", "Total", "Keterangan"]);
    expect(cols).toEqual([false, false, true, true, null]);
    expect(asMoney(1500, cols[2])).toEqual({ value: 1500, format: '"Rp" #,##0' });
    expect(asMoney(1500, cols[1])).toBe(1500);
  });
  it("tanpa judul jelas: angka besar dianggap uang, angka kecil tidak", () => {
    expect(asMoney(2_500_000, null)).toEqual({ value: 2_500_000, format: '"Rp" #,##0' });
    expect(asMoney(12, null)).toBe(12);
    expect(asMoney("teks", true)).toBe("teks");
  });
});
