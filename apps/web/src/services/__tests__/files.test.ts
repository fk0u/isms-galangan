import { describe, expect, it } from "vitest";
import { isBackendUrl, toAbsoluteUrl } from "../files";

describe("toAbsoluteUrl - berkas lintas alamat", () => {
  const base = "https://baru.example";
  it("berkas yang diunggah lewat alamat lain diarahkan ke backend sekarang", () => {
    expect(toAbsoluteUrl("https://lama.example/files/2026-10/0123456789abcdef0123456789abcdef.jpg", base)).toBe("https://baru.example/files/2026-10/0123456789abcdef0123456789abcdef.jpg");
  });
  it("URL relatif dan URL backend sendiri tetap benar", () => {
    expect(toAbsoluteUrl("/files/2026-10/0123456789abcdef0123456789abcdef.jpg", base)).toBe("https://baru.example/files/2026-10/0123456789abcdef0123456789abcdef.jpg");
    expect(toAbsoluteUrl("https://baru.example/files/x.pdf", base)).toBe("https://baru.example/files/x.pdf");
  });
  it("URL pihak lain, blob, dan data tidak disentuh", () => {
    expect(toAbsoluteUrl("https://cdn.example/img/a.png", base)).toBe("https://cdn.example/img/a.png");
    expect(toAbsoluteUrl("blob:abc", base)).toBe("blob:abc");
    expect(toAbsoluteUrl("data:image/png;base64,AA", base)).toBe("data:image/png;base64,AA");
  });
  it("lampiran luar ber-path /files/ tidak diarahkan ulang", () => {
    expect(toAbsoluteUrl("https://cdn.example/files/a.png", base)).toBe("https://cdn.example/files/a.png");
  });
  it("pengecekan backend memakai batas host, bukan awalan teks", () => {
    expect(isBackendUrl("https://baru.example/files/x", base)).toBe(true);
    expect(isBackendUrl("https://baru.example.evil/files/x", base)).toBe(false);
    expect(isBackendUrl("https://baru.example/files/x", "")).toBe(false);
  });
  it("mode lokal tanpa backend tidak mengubah URL", () => {
    expect(toAbsoluteUrl("https://lama.example/files/2026-10/0123456789abcdef0123456789abcdef.jpg", "")).toBe("https://lama.example/files/2026-10/0123456789abcdef0123456789abcdef.jpg");
  });
});
