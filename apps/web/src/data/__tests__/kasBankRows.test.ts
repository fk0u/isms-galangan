import { describe, expect, it } from "vitest";
import { buildKasBankRows, saldoPihakRows, tglSingkat } from "../financialWorkbookBuilder";

const j = (date: string, db: string, kr: string, amount: number, extra: Record<string, unknown> = {}) =>
  ({ date, db, kr, amount, sumber: "Bank", status: "Posted", uraian: "x", ...extra });

describe("buildKasBankRows (#319)", () => {
  const nameOf = (k: string) => (k === "1-121" ? "Bank Mandiri" : k === "1-111" ? "Kas Kantor" : k);
  const journals = [
    j("2026-07-10", "1-121", "4-100", 1000),
    j("2026-08-05", "5-600", "1-121", 300, { voucherNo: "BKK-001", kodePembantu: "PT A" }),
    j("2026-08-06", "1-111", "1-121", 200),
    j("2026-12-31", "1-161", "5-101", 999, { sumber: "Penyesuaian" }),
  ];
  it("saldo awal & saldo berjalan per rekening", () => {
    const rows = buildKasBankRows(journals, nameOf, "2026-08-31", "2026-08-01");
    const text = rows.map((r) => r.join("|"));
    expect(text.some((t) => t.startsWith("Saldo Awal Bank Mandiri - 1-121") && t.endsWith("|1000"))).toBe(true);
    const last = rows.filter((r) => String(r[3]).startsWith("Jumlah Bank Mandiri"))[0];
    expect(last[6]).toBe(0);
    expect(last[7]).toBe(500);
    expect(last[8]).toBe(500);
    expect(text.some((t) => t.includes("5-Agu-26|PT A|BKK-001"))).toBe(true);
  });
  it("jurnal penyesuaian tidak ikut; tanpa periodStart saldo awal 0", () => {
    const rows = buildKasBankRows(journals, nameOf, "2026-12-31", "");
    expect(rows.some((r) => r.includes("1-161"))).toBe(false);
    expect(String(rows[1][0])).toMatch(/^Saldo Awal Bank Kas Kantor|^Saldo Awal Kas Kantor/);
    expect(rows[1][8]).toBe(0);
  });
  it("format tanggal singkat", () => expect(tglSingkat("2026-08-05")).toBe("5-Agu-26"));
});

describe("jurnal impor bersumber JU tetap masuk buku kas (#319)", () => {
  it("dipilih menurut akun kas/bank, bukan sumber", () => {
    const rows = buildKasBankRows([{ date: "2026-08-01", db: "5-600", kr: "1-111", amount: 70, sumber: "JU", status: "Posted" }], (k) => k, "2026-08-31", "2026-08-01");
    expect(rows.some((r) => r[5] === "1-111" && r[7] === 70)).toBe(true);
  });
});

describe("saldo awal bulan Hutang/Piutang", () => {
  it("awal & akhir berbeda, pihak lunas tetap tampil, ada jumlah", () => {
    const rows = saldoPihakRows([{ nama: "A", total: 100 }, { nama: "B", total: 50 }], [{ nama: "A", total: 60 }, { nama: "C", total: 10 }]);
    expect(rows.slice(0, 3)).toEqual([[1, "A", 100, 60], [2, "C", 0, 10], [3, "B", 50, 0]]);
    expect(rows[3].slice(1)).toEqual(["JUMLAH", 150, 70]);
  });
});
