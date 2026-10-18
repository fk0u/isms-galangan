import { describe, expect, it } from "vitest";
import writeXlsxFile from "write-excel-file/node";
import { readCsvRows, readXlsxRows, sheetNumber } from "../readSheet";

type Cell = { value: string | number; type?: NumberConstructor } | null;
async function xlsxOf(data: Cell[][]): Promise<ArrayBuffer> {
  const buf = await writeXlsxFile(data as never).toBuffer();
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

describe("readXlsxRows - .xlsx tanpa dependensi", () => {
  it("membaca teks, angka, sel kosong, dan karakter khusus dari sheet pertama", async () => {
    const buf = await xlsxOf([
      [{ value: "Jenis pekerjaan" }, { value: "Lokasi" }, { value: "Deskripsi" }],
      [{ value: "Sandblasting & painting" }, { value: "Lambung" }, { value: "Area < 100 m²" }],
      [{ value: "Ganti plat" }, null, { value: 12.5, type: Number }],
    ]);
    const rows = await readXlsxRows(buf);
    expect(rows[0]).toEqual(["Jenis pekerjaan", "Lokasi", "Deskripsi"]);
    expect(rows[1]).toEqual(["Sandblasting & painting", "Lambung", "Area < 100 m²"]);
    expect(rows[2]?.[0]).toBe("Ganti plat");
    expect(rows[2]?.[1] ?? "").toBe("");
    expect(rows[2]?.[2]).toBe("12.5");
  });

  it("berkas bukan .xlsx ditolak dengan pesan jelas", async () => {
    await expect(readXlsxRows(new TextEncoder().encode("bukan zip").buffer as ArrayBuffer)).rejects.toThrow(".xlsx");
  });
});

describe("readCsvRows & sheetNumber", () => {
  it("CSV koma dan titik koma (Excel Indonesia), dengan kutip", () => {
    expect(readCsvRows('a,b\n"x, y",2')).toEqual([["a", "b"], ["x, y", "2"]]);
    expect(readCsvRows("a;b\nx;2")).toEqual([["a", "b"], ["x", "2"]]);
  });
  it("angka format Indonesia dan biasa", () => {
    expect(sheetNumber("1.250.000")).toBe(1250000);
    expect(sheetNumber("Rp 1.250.000,50")).toBe(1250000.5);
    expect(sheetNumber("12.5")).toBe(12.5);
    expect(sheetNumber("12,5")).toBe(12.5);
    expect(Number.isNaN(sheetNumber("abc"))).toBe(true);
  });
});
