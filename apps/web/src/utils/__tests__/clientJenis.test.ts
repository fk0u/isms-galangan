import { describe, expect, it } from "vitest";
import { clientJenis } from "../clientJenis";

describe("clientJenis", () => {
  const aktif = new Set(["BUDI SANTOSO"]);
  it("field manual menang", () => expect(clientJenis({ name: "PT Satu", jenis: "Karyawan" }, aktif)).toBe("Karyawan"));
  it("badan usaha → Klien", () => {
    expect(clientJenis({ name: "PT. Bahari" }, aktif)).toBe("Klien");
    expect(clientJenis({ name: "Bahari Jaya, CV" }, aktif)).toBe("Klien");
  });
  it("nama orang dengan proyek → Klien", () => expect(clientJenis({ name: "Budi  Santoso" }, aktif)).toBe("Klien"));
  it("nama orang tanpa transaksi → Karyawan", () => expect(clientJenis({ name: "Andi" }, aktif)).toBe("Karyawan"));
});
