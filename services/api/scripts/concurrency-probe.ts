/* concurrency-probe.ts — F4-01 (audit S-01): dua PATCH paralel pada baris
 * yang sama → tepat satu 200 dan satu 409 STALE; tidak ada tulis yang hilang diam-diam. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Concurrency Probe (F4-01) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'direktur' AND is_active = 1 LIMIT 1"))[0];
  const tok = signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  const id = `VND-CONC-${Date.now().toString(36).toUpperCase()}`;
  await exec("INSERT INTO vendors (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, "Samarinda", JSON.stringify({ name: "Probe Vendor", note: "awal" }), new Date().toISOString()]);
  const patch = (note: string, baseUpdatedAt?: string) => app.inject({ method: "PATCH", url: `/api/vendors/${id}`, headers: { authorization: `Bearer ${tok}` }, payload: { data: { note }, ...(baseUpdatedAt ? { baseUpdatedAt } : {}) } });
  try {
    let exact = 0;
    const ROUNDS = 8;
    for (let i = 0; i < ROUNDS; i += 1) {
      // Dua perangkat membuka versi yang sama (baseUpdatedAt identik), lalu menyimpan bersamaan.
      const base = (await q<{ updated_at: string }>("SELECT updated_at FROM vendors WHERE id = ?", [id]))[0].updated_at;
      const [a, b] = await Promise.all([patch(`A${i}`, base), patch(`B${i}`, base)]);
      const codes = [a.statusCode, b.statusCode].sort();
      const row = JSON.parse((await q<{ data: string }>("SELECT data FROM vendors WHERE id = ?", [id]))[0].data) as { note: string };
      const winner = a.statusCode === 200 ? `A${i}` : `B${i}`;
      if (codes[0] === 200 && codes[1] === 409 && row.note === winner) exact += 1;
      else console.error(`  ronde ${i}: ${codes.join("/")} note=${row.note}`);
    }
    assert(`2 PATCH paralel × ${ROUNDS}: selalu tepat satu 200 + satu 409, isi = pemenang`, exact === ROUNDS, `${exact}/${ROUNDS}`);
    const stale = await patch("basi", "2000-01-01T00:00:00.000Z");
    assert("baseUpdatedAt basi → 409 STALE dengan data terbaru", stale.statusCode === 409 && (stale.json() as { error: { code: string }; data?: unknown }).error.code === "STALE" && !!(stale.json() as { data?: unknown }).data, stale.body);
    const fresh = await patch("berurutan");
    assert("PATCH berurutan tetap 200", fresh.statusCode === 200, fresh.body);
  } finally {
    await exec("DELETE FROM vendors WHERE id = ?", [id]);
    await exec("DELETE FROM audit_log WHERE row_id = ?", [id]);
  }
  console.log(`\n${passed}/${total} pemeriksaan concurrency lolos.`);
  await app.close();
  await closeDb();
}
main().catch(async (err) => { console.error(err); process.exitCode = 1; await closeDb(); });
