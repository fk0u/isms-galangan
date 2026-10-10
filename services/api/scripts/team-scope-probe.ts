/* team-scope-probe.ts — F3-E-02: peran lapangan hanya menerima proyek timnya dari API. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Team Scope Probe (F3-E-02) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const userOf = async (role: string) => (await q<{ id: string; username: string; role: string; token_version: number; employee_id: string | null }>("SELECT id, username, role, token_version, employee_id FROM users WHERE role = ? AND is_active = 1 LIMIT 1", [role]))[0];
  const auth = (u: { id: string; username: string; role: string; token_version: number }) => ({ authorization: `Bearer ${signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 })}` });
  const mech = await userOf("mekanik");
  const dir = await userOf("direktur");
  const empId = String(mech.employee_id ?? "");
  assert("akun mekanik tertaut ke karyawan (prasyarat seed)", empId !== "", "employee_id kosong");
  const pid = `PRJ-SCOPE-${Date.now().toString(36).toUpperCase()}`;
  await exec("INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [pid, "Samarinda", JSON.stringify({ vessel: "TB Probe", client: "PT Probe", manager: "Orang Lain", status: "Dalam Proses" }), new Date().toISOString()]);
  const ids = async (h: { authorization: string }): Promise<string[]> =>
    ((await app.inject({ method: "GET", url: "/api/projects?limit=500", headers: h })).json() as { data: { rows: { id: string }[] } }).data.rows.map((r) => r.id);
  try {
    const all = await ids(auth(dir));
    const before = await ids(auth(mech));
    assert("direktur melihat proyek baru", all.includes(pid));
    assert("mekanik TIDAK melihat proyek di luar timnya (list)", !before.includes(pid) && before.length < all.length, `${before.length}/${all.length}`);
    assert("mekanik GET proyek di luar tim → 404", (await app.inject({ method: "GET", url: `/api/projects/${pid}`, headers: auth(mech) })).statusCode === 404);
    await exec("INSERT INTO team_by_project (project_id, data) VALUES (?, ?)", [pid, JSON.stringify([empId])]);
    assert("setelah masuk tim → tampil di list dan GET 200", (await ids(auth(mech))).includes(pid) && (await app.inject({ method: "GET", url: `/api/projects/${pid}`, headers: auth(mech) })).statusCode === 200);
  } finally {
    await exec("DELETE FROM team_by_project WHERE project_id = ?", [pid]);
    await exec("DELETE FROM projects WHERE id = ?", [pid]);
  }
  console.log(`\n${passed}/${total} pemeriksaan lingkup tim lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
