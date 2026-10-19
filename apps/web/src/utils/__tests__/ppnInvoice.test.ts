import { describe, expect, it } from "vitest";
import { sbInvoiceMath, DPP_FACTOR, PPN_INVOICE_DEFAULT } from "../sb";

/* Q19 (jawaban klien 19 Okt): tarif yang tampil 12%, hitungan efektif 11%. */
describe("PPN invoice: tampil 12%, efektif 11% dari total", () => {
  it("tarif bawaan yang ditampilkan 12%", () => expect(PPN_INVOICE_DEFAULT).toBe(12));
  it("PPN = 12% × DPP (11/12 total) = 11% dari total", () => {
    const m = sbInvoiceMath({ jasa: 100_000_000, material: 20_000_000 });
    expect(m.dpp).toBe(Math.round(120_000_000 * DPP_FACTOR));
    expect(m.ppn).toBe(13_200_000);
  });
});
