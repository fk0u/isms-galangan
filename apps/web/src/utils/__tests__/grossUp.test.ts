import { describe, expect, it } from "vitest";
import { grossUp } from "../grossUp";

describe("grossUp (#278)", () => {
  it("tunjangan PPh sama dengan PPh atas penghasilan + tunjangan", () => {
    const pph = (gross: number) => Math.round(Math.max(0, gross - 4_500_000) * 0.05);
    const t = grossUp((x) => pph(10_000_000 + x));
    expect(Math.abs(t - pph(10_000_000 + t))).toBeLessThanOrEqual(1);
    expect(t).toBeGreaterThan(pph(10_000_000));
  });
  it("nol bila tidak kena pajak", () => {
    expect(grossUp(() => 0)).toBe(0);
  });
});
