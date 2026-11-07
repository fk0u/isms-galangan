import { describe, expect, it } from "vitest";
import { buildSCurve, scheduleDeviation } from "../sCurve";
import type { WbsItem } from "../../data/store";

const w = (o: Partial<WbsItem>): WbsItem => ({ task: "A", start: "2026-01-01", end: "2026-01-11", progress: 0, weight: 1, ...o });

describe("buildSCurve", () => {
  it("rencana linear berbobot dan realisasi dari riwayat", () => {
    const pts = buildSCurve([
      w({ history: [{ date: "2026-01-06", actor: "x", from: 0, to: 20 }] }),
      w({ task: "B", weight: 3, start: "2026-01-11", end: "2026-01-21" }),
    ], "2026-01-06");
    expect(pts[0]).toEqual({ date: "2026-01-01", plan: 0, actual: 0 });
    const now = pts.find((p) => p.date === "2026-01-06")!;
    expect(now.plan).toBe(12.5); // A 50% × 1/4
    expect(now.actual).toBe(5); // A 20% × 1/4
    expect(pts.at(-1)!.plan).toBe(100);
    expect(pts.at(-1)!.actual).toBeNull();
    expect(scheduleDeviation(pts, "2026-01-06")).toBe(-7.5);
  });
  it("tanpa riwayat: naik linear dari start ke progres sekarang", () => {
    const pts = buildSCurve([w({ progress: 40, end: "2026-01-30" })], "2026-01-15");
    expect(pts.find((p) => p.date === "2026-01-08")!.actual).toBe(20);
    expect(pts.find((p) => p.date === "2026-01-15")!.actual).toBe(40);
  });
  it("kosong bila WBS tanpa tanggal", () => {
    expect(buildSCurve([w({ start: "", end: "" })], "2026-01-01")).toEqual([]);
  });
});
