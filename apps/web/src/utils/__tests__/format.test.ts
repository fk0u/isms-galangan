// F1-03: test unit logika murni (Vitest). Probe render/PDF tetap di scripts/.
import { describe, expect, it } from "vitest";
import { fmtRupiah, fmtRupiahShort, parseRupiah } from "../format";
import { ptkpCode } from "../ptkp";
import { parsePunchCsv } from "../../pages/absensi/DeviceImport";

describe("parseRupiah", () => {
  it("membalik format bertitik", () => expect(parseRupiah("1.000.000")).toBe(1_000_000));
  it("mengabaikan awalan Rp dan spasi", () => expect(parseRupiah("Rp 2.500")).toBe(2500));
  it("kosong → 0", () => expect(parseRupiah("")).toBe(0));
  it("bolak-balik dengan fmtRupiah", () => expect(parseRupiah(fmtRupiah(480_000_000))).toBe(480_000_000));
});

describe("ptkpCode", () => {
  it("TK tanpa tanggungan", () => expect(ptkpCode("TK", 0)).toBe("TK/0"));
  it("K dengan tanggungan dibatasi 3", () => expect(ptkpCode("K", 7)).toBe("K/3"));
});

describe("parsePunchCsv", () => {
  it("membaca baris valid dan melewati header", () => {
    const rows = parsePunchCsv("employeeNo,timestamp,type\n123,2026-11-02 07:58,in\n123,2026-11-02T17:10:00+08:00,keluar\nrusak");
    expect(rows).toEqual([
      { employeeNo: "123", timestamp: "2026-11-02T07:58:00+08:00", type: "in" },
      { employeeNo: "123", timestamp: "2026-11-02T17:10:00+08:00", type: "out" },
    ]);
  });
});

describe("fmtRupiahShort", () => {
  const sp = (x: string) => x.replace(/\u00a0/g, " ");
  it("miliar", () => expect(sp(fmtRupiahShort(4_814_200_000))).toBe("Rp 4,81 M"));
  it("juta", () => expect(sp(fmtRupiahShort(162_700_000))).toBe("Rp 163 Jt"));
  it("triliun", () => expect(sp(fmtRupiahShort(1_250_000_000_000))).toBe("Rp 1,25 T"));
  it("di bawah ribuan tetap utuh", () => expect(sp(fmtRupiahShort(950))).toBe("Rp 950"));
  it("Rp dan angka tidak bisa terpisah baris", () => expect(fmtRupiah(1000)).toBe("Rp\u00a01.000"));
});
