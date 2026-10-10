/* files-privacy-probe.ts — F4-05: berkas KTP/ijazah hanya untuk HR/direktur. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Files Privacy Probe (F4-05) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const headersFor = async (role: string): Promise<{ authorization: string }> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ? AND is_active = 1 LIMIT 1", [role]))[0];
    return { authorization: `Bearer ${signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 })}` };
  };
  const stamp = Date.now().toString(36);
  const empId = `EMP-PRV-${stamp.toUpperCase()}`;
  const ktp = `/files/2026-10/ktp${stamp}.png`;
  const photo = `/files/2026-10/foto${stamp}.png`;
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empId, "Samarinda", JSON.stringify({ name: "Probe Privasi", ktpUrl: ktp, photoUrl: photo }), new Date().toISOString()]);
  try {
    const get = async (role: string | null, url: string) => (await app.inject({ method: "GET", url, headers: role ? await headersFor(role) : {} })).statusCode;
    assert("tanpa login → 401", (await get(null, ktp)) === 401);
    assert("mekanik membuka KTP → 403", (await get("mekanik", ktp)) === 403);
    // Berkasnya memang tidak ada di disk: lolos pemeriksaan izin = 404, bukan 403.
    assert("direktur membuka KTP → lolos izin (404 berkas uji)", (await get("direktur", ktp)) === 404);
    assert("mekanik membuka foto profil (bukan berkas pribadi) → lolos izin", (await get("mekanik", photo)) === 404);
  } finally {
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
  }
  console.log(`\n${passed}/${total} pemeriksaan privasi berkas lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
