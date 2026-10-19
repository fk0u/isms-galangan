import { describe, expect, it } from "vitest";
import { applyKasbonPotongan, KASBON_CICILAN_OPTIONS, type KasbonEntry } from "../kasbon";

const k = (over: Partial<KasbonEntry> = {}): KasbonEntry => ({ id: "KSB-1", tanggal: "2026-08-01", jumlah: 1_200_000, cicilan: 500_000, sisa: 1_200_000, riwayat: [], ...over });
const slip = (id: string, period: string) => ({ id, period, tanggal: `${period}-28` });

describe("kasbon dipotong lewat gaji bulanan (K17-HR-03)", () => {
  it("pilihan cicilan hanya Rp500.000 dan Rp1.000.000", () => expect([...KASBON_CICILAN_OPTIONS]).toEqual([500_000, 1_000_000]));

  it("dipotong tiap bulan sampai lunas, sisa tidak minus, riwayat tercatat", () => {
    let list = [k()];
    const pots: number[] = [];
    for (const [i, p] of ["2026-08", "2026-09", "2026-10", "2026-11"].entries()) {
      const r = applyKasbonPotongan(list, slip(`PAY-${i}`, p));
      list = r.next;
      pots.push(r.pot);
    }
    expect(pots).toEqual([500_000, 500_000, 200_000, 0]);
    expect(list[0]?.sisa).toBe(0);
    expect(list[0]?.riwayat.map((r) => r.period)).toEqual(["2026-08", "2026-09", "2026-10"]);
  });

  it("slip yang sama tidak memotong dua kali", () => {
    const once = applyKasbonPotongan([k()], slip("PAY-1", "2026-08"));
    const twice = applyKasbonPotongan(once.next, slip("PAY-1", "2026-08"));
    expect(twice.pot).toBe(0);
    expect(twice.next[0]?.sisa).toBe(700_000);
  });

});
