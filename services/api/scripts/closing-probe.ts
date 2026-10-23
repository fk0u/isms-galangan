/* closing-probe.ts — #283: tutup buku bulanan/tahunan mengunci jurnal,
 * tutup tahun mencatat stok ke Persediaan, buka kembali hanya pimpinan. */
import { randomUUID } from "node:crypto";
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, exec, q } from "../src/db.js";

let passed = 0, total = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  total++;
  if (cond) { passed++; console.log(`[PASS] ${name}`); } else { process.exitCode = 1; console.error(`[FAIL] ${name} ${detail}`); }
};
const app = await buildApp();
const made: string[] = [];
const tok = async (role: string): Promise<Record<string, string>> => {
  let u = (await q<{ id: string; username: string; token_version: number }>("SELECT id, username, token_version FROM users WHERE role = ? AND is_active = 1 LIMIT 1", [role]))[0];
  if (!u) {
    const id = `probe-close-${role}-${randomUUID().slice(0, 6)}`;
    await exec("INSERT INTO users (id, username, pass_hash, name, role, email, is_active, token_version) VALUES (?, ?, 'x', ?, ?, ?, 1, 0)", [id, `${id}@probe.local`, `Probe ${role}`, role, `${id}@probe.local`]);
    made.push(id);
    u = { id, username: `${id}@probe.local`, token_version: 0 };
  }
  return { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role, branch: "SEMUA", v: u.token_version ?? 0 })}` };
};
const journal = (date: string) => ({ data: { date, dokumen: `PROBE-${randomUUID().slice(0, 6)}`, uraian: "probe", db: "1-111", kr: "4-100", amount: 1000, status: "Posted" } });
const before = await q<{ data: string }>("SELECT data FROM settings WHERE id = 'SET-TUTUP-BUKU'");
try {
  await exec("DELETE FROM settings WHERE id = 'SET-TUTUP-BUKU'");
  const fin = await tok("finance");
  ok("HR tidak bisa tutup buku → 403", (await app.inject({ method: "POST", url: "/api/closing", headers: await tok("hr"), payload: { period: "2031-01" } })).statusCode === 403);
  ok("finance tutup bulan 2031-01 → 200", (await app.inject({ method: "POST", url: "/api/closing", headers: fin, payload: { period: "2031-01" } })).statusCode === 200);
  const blocked = await app.inject({ method: "POST", url: "/api/journals", headers: fin, payload: journal("2031-01-15") });
  ok("jurnal di bulan tertutup → 409", blocked.statusCode === 409, blocked.body);
  const open = await app.inject({ method: "POST", url: "/api/journals", headers: fin, payload: journal("2031-02-01") });
  ok("jurnal di bulan terbuka → 2xx", open.statusCode < 300, open.body);
  const openId = open.json().data?.id as string;
  const yr = await app.inject({ method: "POST", url: "/api/closing", headers: fin, payload: { period: "2031" } });
  ok("tutup tahun 2031 → 200 + jurnal persediaan", yr.statusCode === 200 && yr.json().data.journal?.db === "1-161", yr.body);
  ok("jurnal lama di tahun tertutup tidak bisa diubah → 409", (await app.inject({ method: "PATCH", url: `/api/journals/${openId}`, headers: fin, payload: { data: { uraian: "x" } } })).statusCode === 409);
  ok("tutup tahun dua kali → 409", (await app.inject({ method: "POST", url: "/api/closing", headers: fin, payload: { period: "2031" } })).statusCode === 409);
  ok("finance tidak bisa membuka kembali → 403", (await app.inject({ method: "DELETE", url: "/api/closing/2031", headers: fin })).statusCode === 403);
  ok("direktur membuka kembali → 200", (await app.inject({ method: "DELETE", url: "/api/closing/2031", headers: await tok("direktur") })).statusCode === 200);
  ok("setelah dibuka jurnal bisa diubah", (await app.inject({ method: "PATCH", url: `/api/journals/${openId}`, headers: fin, payload: { data: { uraian: "x" } } })).statusCode === 200);
} finally {
  await exec("DELETE FROM journals WHERE data LIKE '%2031-%'");
  await exec("DELETE FROM settings WHERE id = 'SET-TUTUP-BUKU'");
  if (before.length) await exec("INSERT INTO settings (id, branch, data, updated_at) VALUES ('SET-TUTUP-BUKU', 'Samarinda', ?, ?)", [before[0].data, new Date().toISOString()]);
  for (const id of made) await exec("DELETE FROM users WHERE id = ?", [id]);
  await app.close();
  await closeDb();
}
console.log(`\n${passed}/${total} pemeriksaan tutup buku lolos.`);
