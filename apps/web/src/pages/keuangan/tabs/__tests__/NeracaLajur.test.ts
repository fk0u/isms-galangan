import { describe, expect, it } from "vitest";
import { buildLajur } from "../NeracaLajurCard";

describe("neraca lajur (#284)", () => {
  const coa = [{ id: "a", kode: "1-111", nama: "Kas" }, { id: "b", kode: "4-100", nama: "Pendapatan" }, { id: "c", kode: "1-161", nama: "Persediaan" }, { id: "d", kode: "5-101", nama: "Beban material" }];
  const j = (date: string, db: string, kr: string, amount: number, sumber = "") => ({ id: date + db, date, db, kr, amount, sumber });
  const rows = buildLajur([
    j("2026-09-10", "1-111", "4-100", 100),
    j("2026-10-05", "1-111", "4-100", 50),
    j("2026-10-31", "1-161", "5-101", 30, "Penyesuaian"),
    j("2026-11-01", "1-111", "4-100", 999),
  ], coa, (d) => d.startsWith("2026-10"), "2026-10-31");
  const by = (k: string) => rows.find((r) => r.kode === k)!;
  it("memisah saldo awal, mutasi, penyesuaian; abaikan jurnal setelah as-of", () => {
    expect(by("1-111").awal).toEqual([100, 0]);
    expect(by("1-111").mutasi).toEqual([50, 0]);
    expect(by("1-111").nr).toEqual([150, 0]);
    expect(by("1-161").adj).toEqual([30, 0]);
  });
  it("akun 4-9 ke laba rugi, akun 1-3 ke neraca", () => {
    expect(by("4-100").lr).toEqual([0, 150]);
    expect(by("4-100").nr).toEqual([0, 0]);
    expect(by("5-101").lr).toEqual([0, 30]);
  });
});
