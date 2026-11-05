// F1-03: test unit logika murni backend (Vitest). Probe alur tetap di scripts/.
import { describe, expect, it } from "vitest";
import { cursorOf, parseCursor } from "../routes/crudCursor.js";
import { dockFitIssue } from "../dockFit.js";
import { negativeStockError } from "../domainGuards.js";
import { buildRemap } from "../reseedMaterials.js";
import { buildSnapshot, periodRange } from "../closingArchive.js";
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

describe("negativeStockError (#321)", () => {
  it("menolak stok turun ke minus", () => expect(negativeStockError("inventory", { stock: 2 }, { stock: -1 })).toMatch(/minus/));
  it("baris lama minus boleh tidak turun lagi", () => expect(negativeStockError("inventory", { stock: -3 }, { stock: -3 })).toBeNull());
  it("tabel lain & stok normal lolos", () => {
    expect(negativeStockError("inventory", { stock: 5 }, { stock: 0 })).toBeNull();
    expect(negativeStockError("movements", null, { stock: -1 })).toBeNull();
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

describe("buildRemap (#320)", () => {
  it("memetakan id lama ke id baru lewat nama & melaporkan yatim", () => {
    const { remap, orphans } = buildRemap(
      [{ id: "WH-1", name: " remes  paking 3/4 " }, { id: "WH-2", name: "TIDAK ADA" }, { id: "STK-1", name: "A" }],
      [{ id: "STK-1", name: "A" }, { id: "STK-9", name: "REMES PAKING 3/4" }, { id: "STK-10", name: "REMES PAKING 3/4" }],
    );
    expect(remap.get("WH-1")).toBe("STK-9");
    expect(orphans).toEqual(["WH-2"]);
  });
});

describe("buildSnapshot arsip tutup buku (#314)", () => {
  const coa = [{ kode: "1-111", nama: "Kas" }, { kode: "4-100", nama: "Pendapatan" }, { kode: "5-101", nama: "Beban" }, { kode: "3-100", nama: "Modal" }];
  const j = (date: string, db: string, kr: string, amount: number, sumber = "") => ({ date, db, kr, amount, sumber });
  const base = [j("2026-09-10", "1-111", "3-100", 500), j("2026-10-05", "1-111", "4-100", 100), j("2026-10-20", "5-101", "1-111", 30)];
  it("saldo awal, mutasi, neraca seimbang", () => {
    const s = buildSnapshot(base, coa, "2026-10-01", "2026-10-31");
    const kas = s.lajur.find((r) => r.kode === "1-111")!;
    expect(kas.awal).toEqual([500, 0]);
    expect(kas.mutasi).toEqual([100, 30]);
    expect(s.neraca.totalAktiva).toBe(570);
    expect(s.neraca.selisih).toBe(0);
    expect(s.labaRugi.labaPeriode).toBe(70);
    expect(s.totalDebit).toBe(s.totalKredit);
  });
  it("snapshot tidak berubah oleh jurnal bulan berikutnya", () => {
    const a = buildSnapshot(base, coa, "2026-10-01", "2026-10-31");
    const b = buildSnapshot([...base, j("2026-11-03", "1-111", "4-100", 9999)], coa, "2026-10-01", "2026-10-31");
    expect(b).toEqual(a);
  });
  it("rentang periode bulan & tahun", () => {
    expect(periodRange("2026-02")).toEqual({ kind: "month", start: "2026-02-01", end: "2026-02-28" });
    expect(periodRange("2026")).toEqual({ kind: "year", start: "2026-01-01", end: "2026-12-31" });
  });
});
