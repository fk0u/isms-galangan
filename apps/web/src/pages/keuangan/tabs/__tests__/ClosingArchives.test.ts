import { describe, expect, it } from "vitest";
import { compareMetrics } from "../ClosingArchives";

const arc = (aktiva: number, laba: number) => ({
  stockValue: 10,
  snapshot: {
    neraca: { totalAktiva: aktiva, totalPasiva: aktiva, laba },
    labaRugi: { pendapatan: 100, bebanPokok: 40, biayaUsaha: 10, labaPeriode: laba },
    kasBank: [{ akhir: 5 }, { akhir: 7 }],
  },
}) as unknown as Parameters<typeof compareMetrics>[0];

describe("perbandingan arsip tutup buku (#314)", () => {
  it("selisih = B - A per metrik", () => {
    const m = Object.fromEntries(compareMetrics(arc(1000, 50), arc(1300, 80)).map((x) => [x.key, x]));
    expect(m.totalAktiva.delta).toBe(300);
    expect(m.labaPeriode.delta).toBe(30);
    expect(m.kasBank.a).toBe(12);
  });
});
