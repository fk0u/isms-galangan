/* cache-probe.ts — cache daftar + ETag + endpoint gabungan WBS/tim:
 * hemat beban TANPA pernah menyajikan data basi setelah tulis. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";
import { cacheClear, cacheStats } from "../src/listCache.js";

async function main(): Promise<void> {
  console.log("=== ISMS Cache Probe ===");
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
  const dir = await headersFor("direktur");
  const id = `VND-CACHE-${Date.now().toString(36).toUpperCase()}`;
  const pid = `PRJ-CACHE-${Date.now().toString(36).toUpperCase()}`;
  try {
    cacheClear();
    const a = await app.inject({ method: "GET", url: "/api/vendors?limit=5000", headers: dir });
    const b = await app.inject({ method: "GET", url: "/api/vendors?limit=5000", headers: dir });
    const etag = String(a.headers.etag ?? "");
    assert("GET kedua dilayani dari cache dengan isi identik", a.statusCode === 200 && b.body === a.body && cacheStats().hits >= 1, JSON.stringify(cacheStats()));
    assert("respons membawa ETag", etag.length > 5, etag);
    const c = await app.inject({ method: "GET", url: "/api/vendors?limit=5000", headers: { ...dir, "if-none-match": etag } });
    assert("If-None-Match cocok → 304 tanpa badan", c.statusCode === 304 && c.body === "", `${c.statusCode} ${c.body.length}`);

    const post = await app.inject({ method: "POST", url: "/api/vendors", headers: dir, payload: { id, data: { name: "PT Probe Cache", category: "Umum" } } });
    const d = await app.inject({ method: "GET", url: "/api/vendors?limit=5000", headers: { ...dir, "if-none-match": etag } });
    assert("setelah tulis: cache gugur, GET langsung memuat baris baru (bukan 304)", post.statusCode === 201 && d.statusCode === 200 && d.body.includes(id), `${post.statusCode}/${d.statusCode}`);
    await app.inject({ method: "PATCH", url: `/api/vendors/${id}`, headers: dir, payload: { data: { note: "diubah" } } });
    const e = await app.inject({ method: "GET", url: "/api/vendors?limit=5000", headers: dir });
    assert("setelah PATCH: isi terbaru langsung terbaca", e.body.includes("diubah"));
    assert("tanpa login tetap 401 (cache tidak melewati auth)", (await app.inject({ method: "GET", url: "/api/vendors?limit=5000" })).statusCode === 401);

    // Lingkup tim: cache direktur tidak boleh bocor ke mekanik.
    await exec("INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [pid, "Samarinda", JSON.stringify({ vessel: "TB Probe", client: "PT Probe", manager: "Orang Lain", status: "Dalam Proses" }), new Date().toISOString()]);
    const dp = await app.inject({ method: "GET", url: "/api/projects?limit=5000", headers: dir });
    const mp = await app.inject({ method: "GET", url: "/api/projects?limit=5000", headers: await headersFor("mekanik") });
    assert("cache daftar proyek terpisah per lingkup tim", dp.body.includes(pid) && !mp.body.includes(pid));

    await app.inject({ method: "PUT", url: `/api/projects/${pid}/wbs`, headers: dir, payload: { wbs: [{ task: "Hull Assembly", start: "2026-10", end: "2026-11", progress: 10, weight: 5 }] } });
    await app.inject({ method: "PUT", url: `/api/projects/${pid}/team`, headers: dir, payload: { memberIds: ["EMP-001"] } });
    const sides = await app.inject({ method: "GET", url: "/api/project-sides", headers: dir });
    const sd = (sides.json() as { data: { wbs: Record<string, unknown[]>; team: Record<string, string[]> } }).data;
    assert("GET /api/project-sides memuat WBS + tim proyek dalam satu respons", sides.statusCode === 200 && Array.isArray(sd.wbs[pid]) && sd.wbs[pid].length === 1 && sd.team[pid]?.[0] === "EMP-001", sides.body.slice(0, 120));
    const ms = await app.inject({ method: "GET", url: "/api/project-sides", headers: await headersFor("mekanik") });
    assert("project-sides mengikuti lingkup tim", !Object.keys((ms.json() as { data: { wbs: Record<string, unknown> } }).data.wbs).includes(pid));
  } finally {
    await exec("DELETE FROM vendors WHERE id = ?", [id]);
    await exec("DELETE FROM wbs_by_project WHERE project_id = ?", [pid]);
    await exec("DELETE FROM team_by_project WHERE project_id = ?", [pid]);
    await exec("DELETE FROM projects WHERE id = ?", [pid]);
  }
  console.log(`\n${passed}/${total} pemeriksaan cache lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
