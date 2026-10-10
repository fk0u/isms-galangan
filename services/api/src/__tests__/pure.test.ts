// F1-03: test unit logika murni backend (Vitest). Probe alur tetap di scripts/.
import { describe, expect, it } from "vitest";
import { cursorOf, parseCursor } from "../routes/crudCursor.js";
import { dockFitIssue } from "../dockFit.js";

describe("cursor pagination", () => {
  it("bolak-balik cursorOf → parseCursor", () => {
    expect(parseCursor(cursorOf({ updated_at: "2026-10-10T01:02:03.000Z", id: "PRJ-1" }))).toEqual({ updatedAt: "2026-10-10T01:02:03.000Z", id: "PRJ-1" });
  });
  it("cursor setengah jadi ditolak", () => {
    expect(parseCursor("2026-10-10|")).toBeNull();
    expect(parseCursor("tanpa-pemisah")).toBeNull();
    expect(parseCursor(42)).toBeNull();
  });
});

describe("dockFitIssue", () => {
  it("kapal muat → null", () => expect(dockFitIssue({ maxLoa: 60 }, { loa: 55 })).toBeNull());
  it("LOA berlebih → pesan", () => expect(dockFitIssue({ maxLoa: 60 }, { loa: 72 })).toMatch(/LOA/));
});
