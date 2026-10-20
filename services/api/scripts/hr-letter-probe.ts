/* hr-letter-probe.ts — surat HR format template Word klien (catatan CTO 19 Okt):
 * pemetaan jenis surat, SP3 = surat PHK, tanggal terbilang, satu halaman tanpa
 * masalah geometri, dan pratinjau draf (POST /api/pdf/draft/suratHr) hanya untuk
 * peran yang boleh menulis surat. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, q } from "../src/db.js";
import { checkGeometry } from "../src/pdf/document.js";
import { hrLetterDoc, hrLetterKindOf, tanggalTerbilang, type HrLetterKind } from "../src/pdf/documents/hrLetter.js";

async function main(): Promise<void> {
  console.log("=== ISMS HR Letter Probe ===");
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };

  const map: Array<[string, HrLetterKind | null]> = [
    ["SP 1", "sp1"], ["SP 2", "sp2"], ["SP 3", "phk"], ["Pemutusan Hubungan Kerja (PHK)", "phk"],
    ["Surat Pengalaman Kerja", "pengalaman"], ["Surat Keterangan Bekerja", "keterangan"], ["Perpanjang Kontrak", null],
  ];
  for (const [jenis, want] of map) assert(`jenis "${jenis}" → ${want ?? "format umum"}`, hrLetterKindOf(jenis) === want, String(hrLetterKindOf(jenis)));
  assert("tanggal PHK terbilang", tanggalTerbilang("2026-06-26") === "26 (Dua Puluh Enam) bulan Juni tahun 2026", tanggalTerbilang("2026-06-26"));

  const base = { no: "001/TEST", tanggal: "2026-06-24", nama: "Karyawan Contoh", jabatan: "Welder", pelanggaran: ["Keterlambatan"], penandaTangan: "Penanda Tangan Contoh" };
  for (const kind of ["sp1", "sp2", "phk", "pengalaman", "keterangan"] as HrLetterKind[]) {
    const res = hrLetterDoc({ ...base, kind, alamat: "Jl. Contoh No. 1, Samarinda", tanggalMulai: "2022-05-23" }, { trace: true }).render();
    const geo = checkGeometry(res, res.margin, { width: res.pageW, height: res.pageH });
    const text = res.records.filter((r) => r.kind === "text").map((r) => r.text ?? "").join(" ");
    assert(`${kind}: 1 halaman, geometri aman, kop tergambar`, res.pages === 1 && geo.length === 0 && res.records.some((r) => r.kind === "image"), `${res.pages} hal, ${geo.length} masalah`);
    assert(`${kind}: memuat nama karyawan & nomor`, text.includes("Karyawan Contoh") && text.includes("001/TEST"));
  }
  const phk = hrLetterDoc({ ...base, kind: "phk", tanggal: "2026-06-26", tanggalEfektif: "2026-06-26" }, { trace: true }).render();
  assert("PHK di kertas Letter", Math.abs(phk.pageW - 215.9) < 0.5 && Math.abs(phk.pageH - 279.4) < 0.5, `${phk.pageW}x${phk.pageH}`);

  /* Pratinjau draf lewat API. */
  const app = await buildApp();
  const tok = async (role: string): Promise<string | null> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ? LIMIT 1", [role]))[0];
    return u ? `Bearer ${signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 })}` : null;
  };
  const emp = (await q<{ id: string }>("SELECT id FROM employees LIMIT 1"))[0];
  const payload = { data: { employeeId: emp?.id ?? "", jenis: "SP 1", tanggal: "2026-06-24", isi: "Keterlambatan", docNo: "001/HRD-SP/TEST" }, locale: "id" };
  const hr = await tok("hr");
  if (hr) {
    const ok = await app.inject({ method: "POST", url: "/api/pdf/draft/suratHr", headers: { authorization: hr }, payload });
    assert("draf surat oleh HR → 200 PDF", ok.statusCode === 200 && String(ok.headers["content-type"]).includes("application/pdf") && ok.rawPayload.subarray(0, 4).toString() === "%PDF", `${ok.statusCode}`);
  }
  const viewer = await tok("viewer");
  if (viewer) {
    const deny = await app.inject({ method: "POST", url: "/api/pdf/draft/suratHr", headers: { authorization: viewer }, payload });
    assert("draf surat oleh viewer → 403", deny.statusCode === 403, `${deny.statusCode}`);
  }
  const anon = await app.inject({ method: "POST", url: "/api/pdf/draft/suratHr", payload });
  assert("draf surat tanpa login → 401", anon.statusCode === 401, `${anon.statusCode}`);
  if (hr) {
    const bad = await app.inject({ method: "POST", url: "/api/pdf/draft/suratHr", headers: { authorization: hr }, payload: { data: "bukan objek" } });
    assert("draf tanpa objek data → 400", bad.statusCode === 400, `${bad.statusCode}`);
  }

  console.log(`\n${passed}/${total} pemeriksaan surat HR lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => { console.error(err); process.exitCode = 1; await closeDb(); });
