import { describe, expect, it } from "vitest";
import { buildBukuBesarRows, buildKasBankRows, saldoPihakRows, tglSingkat } from "../financialWorkbookBuilder";

const j = (date: string, db: string, kr: string, amount: number, extra: Record<string, unknown> = {}) =>
  ({ date, db, kr, amount, sumber: "JU", status: "Posted", uraian: "x", ...extra });
const nameOf = (k: string) => ({ "1-121": "Bank Mandiri", "1-111": "Kas Kantor" } as Record<string, string>)[k] ?? k;
const journals = [
  j("2026-07-10", "1-121", "4-100", 1000),
  j("2026-08-05", "5-600", "1-121", 300, { voucherNo: "BKK-001", kodePembantu: "PT A" }),
  j("2026-08-06", "1-111", "1-121", 200),
  j("2026-08-31", "6-021", "1-270", 50, { sumber: "Penyesuaian", uraian: "Penyusutan" }),
];
const left = (r: unknown[]) => r.slice(0, 9);
const right = (r: unknown[]) => r.slice(10, 18);

describe("JU, Kas, Bank format klien (#329)", () => {
  const rows = buildKasBankRows(journals, nameOf, "2026-08-31", "2026-08-01");
  it("tiga bagian: BANK, JURNAL UMUM berdampingan, KAS KANTOR di bawah", () => {
    expect(rows[0][0]).toBe("BANK");
    expect(rows[0][10]).toBe("JURNAL UMUM");
    const kas = rows.findIndex((r) => r[0] === "KAS KANTOR");
    const bank = rows.findIndex((r) => String(r[3]).startsWith("Saldo Awal Bank Mandiri"));
    expect(kas).toBeGreaterThan(bank);
  });
  it("bank: saldo awal sebelum periode, saldo berjalan, jumlah", () => {
    const awal = rows.find((r) => String(r[3]).startsWith("Saldo Awal Bank Mandiri"))!;
    expect(left(awal)[8]).toBe(1000);
    const jml = rows.find((r) => r[3] === "Jumlah Bank Mandiri")!;
    expect([jml[6], jml[7], jml[8]]).toEqual([0, 500, 500]);
    expect(rows.some((r) => r[0] === tglSingkat("2026-08-05") && r[1] === "PT A" && r[2] === "BKK-001")).toBe(true);
  });
  it("kas kantor terpisah dari bank", () => {
    const awal = rows.find((r) => String(r[3]).startsWith("Saldo Awal Kas Kantor"))!;
    expect(awal[8]).toBe(0);
    expect(rows.find((r) => r[3] === "Jumlah Kas Kantor")![6]).toBe(200);
  });
  it("jurnal umum: penyesuaian masuk, debit = kredit", () => {
    const ju = rows.map(right).filter((r) => r.some((c) => c !== ""));
    expect(ju.some((r) => r[4] === "6-021" && r[5] === 50)).toBe(true);
    expect(ju.some((r) => r[6] === "1-270" && r[7] === 50)).toBe(true);
    const tot = ju.find((r) => r[3] === "Jumlah Jurnal Umum")!;
    expect(tot[5]).toBe(tot[7]);
  });
  it("jurnal impor bersumber JU yang menyentuh kas tetap masuk buku kas", () => {
    expect(rows.some((r) => r[5] === "1-121" && r[7] === 300)).toBe(true);
  });
  it("format tanggal singkat", () => expect(tglSingkat("2026-08-05")).toBe("5-Agu-26"));
});

describe("Buku Besar saldo awal (#328)", () => {
  const coa = [{ kode: "1-121", nama: "Bank Mandiri", dk: "D" }, { kode: "4-100", nama: "Pendapatan", dk: "K" }, { kode: "1-000", nama: "AKTIVA", dk: "-" }];
  const rows = buildBukuBesarRows(journals, coa, "2026-08-31", "2026-08-01");
  it("kolom saldo awal, debit, kredit, saldo akhir", () => {
    expect(rows[0]).toEqual(["KODE AKUN", "NAMA AKUN", "D/K", "SALDO AWAL", "DEBIT", "KREDIT", "SALDO AKHIR"]);
    expect(rows.find((r) => r[0] === "1-121")!.slice(3)).toEqual([1000, 0, 500, 500]);
  });
  it("akun kredit bertanda positif", () => expect(rows.find((r) => r[0] === "4-100")!.slice(3)).toEqual([1000, 0, 0, 1000]));
  it("tanpa periodStart saldo awal 0", () => {
    expect(buildBukuBesarRows(journals, coa, "2026-08-31", "").find((r) => r[0] === "1-121")!.slice(3)).toEqual([0, 1000, 500, 500]);
  });
});

describe("saldo awal bulan Hutang/Piutang", () => {
  it("awal & akhir berbeda, pihak lunas tetap tampil, ada jumlah", () => {
    const rows = saldoPihakRows([{ nama: "A", total: 100 }, { nama: "B", total: 50 }], [{ nama: "A", total: 60 }, { nama: "C", total: 10 }]);
    expect(rows.slice(0, 3)).toEqual([[1, "A", 100, 60], [2, "C", 0, 10], [3, "B", 50, 0]]);
    expect(rows[3].slice(1)).toEqual(["JUMLAH", 150, 70]);
  });
});
