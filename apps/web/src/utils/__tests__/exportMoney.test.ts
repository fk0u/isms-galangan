import { describe, expect, it } from "vitest";
import { asMoney, moneyColumns, sanitizeCell } from "../export";

describe("format Rupiah ekspor (#276)", () => {
  it("kolom nominal diformat Rp, kolom qty/kode tidak", () => {
    const cols = moneyColumns(["Kode", "Qty", "Harga Satuan", "Total", "Keterangan"]);
    expect(cols).toEqual([false, false, true, true, null]);
    expect(asMoney(1500, cols[2])).toEqual({ value: 1500, format: '"Rp" #,##0;[Red]-"Rp" #,##0' });
    expect(asMoney(1500, cols[1])).toBe(1500);
  });
  it("kolom saldo tetap uang walau header memuat kata bulan (#317)", () => {
    expect(moneyColumns(["NO", "KODE PEMBANTU", "SALDO AWAL BULAN", "AKHIR SALDO"])).toEqual([false, false, true, true]);
    expect(moneyColumns(["NO", "KODE PEMBANTU", "SALDO AWAL BULAN", "AKHIR BULAN"])[3]).toBe(true);
  });
  it("tanpa judul jelas: angka besar dianggap uang, angka kecil tidak", () => {
    expect(asMoney(2_500_000, null)).toEqual({ value: 2_500_000, format: '"Rp" #,##0;[Red]-"Rp" #,##0' });
    expect(asMoney(12, null)).toBe(12);
    expect(asMoney("teks", true)).toBe("teks");
  });
});

describe("sanitizeCell", () => {
  it("tanda kosong '-' tidak diberi apostrof, formula tetap dinetralkan", () => {
    expect(sanitizeCell("-")).toBe("-");
    expect(sanitizeCell("-1+1")).toBe("'-1+1");
    expect(sanitizeCell("=SUM(A1)")).toBe("'=SUM(A1)");
  });
});
