/* payroll-pay-probe.ts — notulen 23 Okt (#278-#281): HR menghitung &
 * menyetujui, pembayaran gaji hanya oleh Keuangan; Keuangan hanya boleh
 * mencatat pembayaran + memotong kasbon; slip tanpa PPh gross-up. */
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
    const id = `probe-pay-${role}-${randomUUID().slice(0, 6)}`;
    await exec("INSERT INTO users (id, username, pass_hash, name, role, email, is_active, token_version) VALUES (?, ?, 'x', ?, ?, ?, 1, 0)", [id, `${id}@probe.local`, `Probe ${role}`, role, `${id}@probe.local`]);
    made.push(id);
    u = { id, username: `${id}@probe.local`, token_version: 0 };
  }
  return { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role, branch: "SEMUA", v: u.token_version ?? 0 })}` };
};
const patch = async (role: string, table: string, id: string, data: Record<string, unknown>) =>
  app.inject({ method: "PATCH", url: `/api/${table}/${id}`, headers: await tok(role), payload: { data } });

const emp = (await q<{ id: string }>("SELECT id FROM employees LIMIT 1"))[0];
const payId = `PAY-PROBE-${randomUUID().slice(0, 6)}`;
const now = new Date().toISOString();
try {
  await exec("INSERT INTO payroll (id, branch, data, updated_at) VALUES (?, 'Samarinda', ?, ?)", [payId, JSON.stringify({
    employeeId: emp.id, period: "2026-10", type: "Gaji", basic: 5_000_000, allowances: [], overtimePay: 0, deductions: 0,
    kasbonPot: 0, pph21: 120_000, pphGrossUp: true, bpjsKesKar: 50_000, bpjsTkKar: 150_000, net: 4_800_000, status: "Disetujui",
  }), now]);

  ok("HR tidak bisa menandai Dibayar → 403", (await patch("hr", "payroll", payId, { status: "Dibayar" })).statusCode === 403);
  ok("HR tetap bisa mengembalikan ke Draft", (await patch("hr", "payroll", payId, { status: "Draft" })).statusCode === 200);
  ok("Finance tidak bisa membayar slip Draft → 403", (await patch("finance", "payroll", payId, { status: "Dibayar" })).statusCode === 403);
  await patch("hr", "payroll", payId, { status: "Disetujui" });
  ok("Finance tidak bisa mengubah komponen gaji → 403", (await patch("finance", "payroll", payId, { basic: 9_000_000 })).statusCode === 403);
  const empRow = (await q<{ data: string }>("SELECT data FROM employees WHERE id = ?", [emp.id]))[0];
  const kasbon = JSON.parse(empRow.data).kasbon ?? [];
  ok("Finance boleh memotong kasbon karyawan", (await patch("finance", "employees", emp.id, { kasbon })).statusCode === 200);
  ok("Finance tidak boleh mengubah gaji pokok karyawan → 403", (await patch("finance", "employees", emp.id, { basic: 1 })).statusCode === 403);
  const paid = await patch("finance", "payroll", payId, { status: "Dibayar", paidAt: "2026-10-25", paidMethod: "Transfer", paidRef: "TRX-1", net: 4_800_000 });
  ok("Finance membayar slip Disetujui → 200", paid.statusCode === 200, paid.body);
  ok("Pajak boleh membaca payroll", (await app.inject({ method: "GET", url: `/api/payroll/${payId}`, headers: await tok("pajak") })).statusCode === 200);

  const pdf = await app.inject({ method: "POST", url: "/api/pdf/render", headers: await tok("hr"), payload: { kind: "slipGaji", id: payId, locale: "id", model: true } });
  ok("slip gaji terbit untuk HR", pdf.statusCode === 200, String(pdf.statusCode));
} finally {
  await exec("DELETE FROM payroll WHERE id = ?", [payId]);
  for (const id of made) await exec("DELETE FROM users WHERE id = ?", [id]);
  await app.close();
  await closeDb();
}
console.log(`\n${passed}/${total} pemeriksaan pembayaran payroll lolos.`);
