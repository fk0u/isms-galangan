// F1-03: test unit logika murni backend (Vitest). Probe alur tetap di scripts/.
import { describe, expect, it } from "vitest";
import { cursorOf, parseCursor } from "../routes/crudCursor.js";
import { dockFitIssue } from "../dockFit.js";
import { hasMagic, scanContent } from "../routes/files.js";

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

describe("unggah PDF sertifikat (#98)", () => {
  const pdf = (body: string): Buffer => Buffer.from(`%PDF-1.7\n${body}\n%%EOF`, "latin1");
  it("PDF biasa dengan /OpenAction zoom → diterima", () => {
    const buf = pdf("1 0 obj << /Type /Catalog /OpenAction [3 0 R /FitH null] /AA << >> >> endobj");
    expect(hasMagic(buf, ".pdf")).toBe(true);
    expect(scanContent(buf, ".pdf")).toBeNull();
  });
  it("PDF berisi skrip → ditolak", () => {
    expect(scanContent(pdf("<< /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >>"), ".pdf")).toMatch(/skrip/);
    expect(scanContent(pdf("<< /S /Launch /F (cmd.exe) >>"), ".pdf")).toMatch(/skrip/);
    expect(scanContent(pdf("<< /Names << /EmbeddedFiles 5 0 R >> >>"), ".pdf")).toMatch(/skrip/);
    // Skrip di luar 256 KiB pertama tetap terdeteksi.
    expect(scanContent(pdf(`<< /OpenAction 9 0 R >>${" ".repeat(300 * 1024)}9 0 obj << /S /JavaScript >>`), ".pdf")).toMatch(/skrip/);
  });
  it("berkas bukan PDF berekstensi .pdf → ditolak", () => {
    expect(hasMagic(Buffer.from("MZ bukan pdf"), ".pdf")).toBe(false);
  });
});
