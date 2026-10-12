import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));
vi.mock("../db.js", () => ({ q: queryMock, exec: vi.fn(), withTx: vi.fn() }));

import { hasMagic, isPrivateFile, scanContent } from "../routes/files.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hasMagic and scanContent (#98 regression)", () => {
  const pdf = (body: string): Buffer => Buffer.from(`%PDF-1.7\n${body}\n%%EOF`, "latin1");

  it("menerima PDF valid dan menolak file palsu", () => {
    const validPdf = pdf("1 0 obj << /Type /Catalog >> endobj");
    expect(hasMagic(validPdf, ".pdf")).toBe(true);

    const fakePdf = Buffer.from("MZ executables disguised as pdf", "latin1");
    expect(hasMagic(fakePdf, ".pdf")).toBe(false);
  });

  it("mengizinkan PDF pindai/Word biasa dengan /OpenAction zoom dan /AA", () => {
    const scannedDoc = pdf("1 0 obj << /Type /Catalog /OpenAction [1 0 R /Fit] /AA << >> >> endobj");
    expect(scanContent(scannedDoc, ".pdf")).toBeNull();
  });

  it("menolak PDF yang menyematkan skrip, peluncur, atau lampiran biner", () => {
    expect(scanContent(pdf("<< /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >>"), ".pdf")).toMatch(/skrip/);
    expect(scanContent(pdf("<< /S /Launch /F (calc.exe) >>"), ".pdf")).toMatch(/skrip/);
    expect(scanContent(pdf("<< /Names << /EmbeddedFiles 2 0 R >> >>"), ".pdf")).toMatch(/skrip/);
  });

  it("menolak injeksi formula pada file CSV/TXT namun membiarkan angka negatif akuntansi", () => {
    const maliciousCsv = Buffer.from("Nama,Nominal\nBudi,=cmd|'/C calc'!A0\n", "utf-8");
    expect(scanContent(maliciousCsv, ".csv")).toMatch(/injeksi formula/);

    const validLedger = Buffer.from("Akun,Saldo\nKas,1000\nBeban Selisih,-500.50\n", "utf-8");
    expect(scanContent(validLedger, ".csv")).toBeNull();
  });
});

describe("isPrivateFile RBAC (#98)", () => {
  it("mengenali sertifikat karyawan sebagai berkas pribadi HR", async () => {
    const certUrl = "/files/2026-10/cert-las-98.pdf";
    queryMock.mockResolvedValueOnce([
      {
        data: JSON.stringify({
          name: "Budi Santoso",
          certs: [{ name: "Sertifikat Las 6G", fileUrl: certUrl }],
        }),
      },
    ]);

    const result = await isPrivateFile(certUrl);
    expect(result).toBe(true);
  });

  it("mengenali URL absolut atau berakhiran certUrl sebagai berkas pribadi HR", async () => {
    const certUrl = "/files/2026-10/cert-marine-98.pdf";
    queryMock.mockResolvedValueOnce([
      {
        data: JSON.stringify({
          name: "Siti Rahma",
          certs: [{ name: "Sertifikat BST", fileUrl: `http://localhost:3001${certUrl}` }],
        }),
      },
    ]);

    const result = await isPrivateFile(certUrl);
    expect(result).toBe(true);
  });

  it("mengenali KTP dan ijazah sebagai berkas pribadi HR", async () => {
    const ktpUrl = "/files/2026-10/ktp-98.png";
    queryMock.mockResolvedValueOnce([
      {
        data: JSON.stringify({
          name: "Ahmad",
          ktpUrl,
        }),
      },
    ]);

    expect(await isPrivateFile(ktpUrl)).toBe(true);
  });

  it("tidak menandai foto profil umum sebagai berkas pribadi HR", async () => {
    const photoUrl = "/files/2026-10/foto-profil-98.png";
    queryMock.mockResolvedValueOnce([
      {
        data: JSON.stringify({
          name: "Ahmad",
          photoUrl,
        }),
      },
    ]);

    expect(await isPrivateFile(photoUrl)).toBe(false);
  });
});
