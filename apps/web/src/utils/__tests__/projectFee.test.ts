import { describe, expect, it } from "vitest";
import { feeAmount, normFees } from "../projectFee";

describe("fee proyek pihak ketiga (K17-PM-15)", () => {
  it("persen dari nilai proyek", () => expect(feeAmount({ basis: "persen", nilai: 2.5 }, 48_000_000_000)).toBe(1_200_000_000));
  it("nominal apa adanya", () => expect(feeAmount({ basis: "nominal", nilai: 25_000_000 }, 48_000_000_000)).toBe(25_000_000));
  it("normFees: data rusak dilewati, status default Belum", () => {
    expect(normFees([null, { id: "F1", penerima: "CV A", basis: "persen", nilai: "3" }])).toEqual([{ id: "F1", penerima: "CV A", basis: "persen", nilai: 3, status: "Belum" }]);
  });
});
