/* wo-spk-probe.ts — F3-I-04: field SPK WO hanya bisa diubah procurement;
 * peran lain tetap bisa memperbarui progres. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS WO SPK Lock Probe (F3-I-04) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenOf = async (username: string): Promise<string> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE username = ?", [username]))[0];
    if (!u) throw new Error(`Akun ${username} belum ada — jalankan npm run seed`);
    return signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  };
  const proyek = await tokenOf("proyek@galangan.com");
  const proc = await tokenOf("procurement@galangan.com");
  const project = (await q<{ id: string }>("SELECT id FROM projects LIMIT 1"))[0];
  const sub = (await q<{ data: string }>("SELECT data FROM subcontractors LIMIT 1"))[0];
  const subName = String((JSON.parse(sub?.data ?? "{}") as { name?: string }).name ?? "Probe Sub");
  const woId = `WO-PROBE-${Date.now().toString(36).toUpperCase()}`;
  await exec("INSERT INTO workOrders (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    woId, "Samarinda", JSON.stringify({ sub: subName, project: project.id, scope: "Probe scope", value: 100_000_000, progress: 0, status: "Dalam Proses", targetDate: "2026-12-31" }), new Date().toISOString(),
  ]);
  const patch = (t: string, data: Record<string, unknown>) => app.inject({ method: "PATCH", url: `/api/workOrders/${woId}`, headers: { authorization: `Bearer ${t}` }, payload: { data } });
  try {
    const p1 = await patch(proyek, { value: 1 });
    assert("proyek ubah nilai SPK → 403", p1.statusCode === 403, p1.body);
    const p2 = await patch(proyek, { scope: "Diubah" });
    assert("proyek ubah scope SPK → 403", p2.statusCode === 403, p2.body);
    const p3 = await patch(proyek, { progress: 40, status: "Dalam Proses" });
    assert("proyek update progres → 200", p3.statusCode === 200, p3.body);
    const p4 = await patch(proc, { value: 120_000_000 });
    assert("procurement ubah nilai SPK → 200", p4.statusCode === 200, p4.body);
  } finally {
    await exec("DELETE FROM workOrders WHERE id = ?", [woId]);
    await exec("DELETE FROM audit_log WHERE row_id = ?", [woId]);
  }
  console.log(`\n${passed}/${total} pemeriksaan kunci SPK lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
