/* voucher-probe.ts — voucher jurnal (K17-FIN-08 / Q24): setiap jurnal baru
 * dinomori server VJ/YYYY/MM/NNNN, satu transaksi (dokumen sama) satu nomor,
 * nomor urut per bulan, dan PDF voucher bisa dirender. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, exec, q } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Voucher Jurnal Probe (K17-FIN-08) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const dir = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1"))[0];
  if (!dir) throw new Error("Butuh akun direktur hasil seed (npm run seed)");
  const headers = { authorization: `Bearer ${signToken({ id: dir.id, username: dir.username, role: dir.role, branch: "SEMUA", v: dir.token_version ?? 0 })}` };
  const tag = Date.now().toString(36).toUpperCase();
  const made: string[] = [];
  const post = async (data: Record<string, unknown>) => {
    const res = await app.inject({ method: "POST", url: "/api/journals", headers, payload: { data } });
    const row = res.json() as { data: { id: string; data: { voucherNo?: string } } };
    if (res.statusCode === 201) made.push(row.data.id);
    return { status: res.statusCode, id: row.data?.id, no: row.data?.data?.voucherNo ?? "" };
  };
  try {
    const base = { kodePembantu: "", uraian: "Probe voucher", sumber: "JU", status: "Posted" };
    const a1 = await post({ ...base, date: "2031-03-05", dokumen: `PRB-A-${tag}`, db: "1-111", kr: "4-100", amount: 1000 });
    const a2 = await post({ ...base, date: "2031-03-05", dokumen: `PRB-A-${tag}`, db: "6-010", kr: "1-111", amount: 200 });
    const b = await post({ ...base, date: "2031-03-20", dokumen: `PRB-B-${tag}`, db: "1-111", kr: "4-100", amount: 500 });
    const c = await post({ ...base, date: "2031-04-01", dokumen: `PRB-C-${tag}`, db: "1-111", kr: "4-100", amount: 700 });
    assert("jurnal baru diberi nomor VJ/2031/03/0001", a1.status === 201 && a1.no === "VJ/2031/03/0001", JSON.stringify(a1));
    assert("baris kedua transaksi sama berbagi nomor", a2.no === a1.no, a2.no);
    assert("transaksi berikutnya di bulan sama → 0002", b.no === "VJ/2031/03/0002", b.no);
    assert("bulan baru mulai dari 0001", c.no === "VJ/2031/04/0001", c.no);
    const pdf = await app.inject({ method: "POST", url: "/api/pdf/render", headers, payload: { kind: "voucher", id: a1.id, locale: "id" } });
    assert("PDF voucher dirender → 200", pdf.statusCode === 200, pdf.body.slice(0, 200));
  } finally {
    for (const id of made) await exec("DELETE FROM journals WHERE id = ?", [id]);
  }
  console.log(`\n${passed}/${total} pemeriksaan voucher jurnal lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => { console.error(err); process.exitCode = 1; await closeDb(); });
