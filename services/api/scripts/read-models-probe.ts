/* read-models-probe.ts — setiap data yang ditulis lewat API bisa dibaca kembali:
 * foto WBS, permintaan barang proyek, alat absensi, status PIN cuti, daftar unggahan. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";
import { collectWbsPhotos } from "../src/routes/readModels.js";

async function main(): Promise<void> {
  console.log("=== ISMS Read Models Probe ===");
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
  const pure = collectWbsPhotos([
    { task: "A", photos: [{ url: "/files/a1.png", note: "awal", date: "2026-10-01" }, "/files/a2.png"], history: [{ date: "2026-10-02", actor: "Rudi", note: "update", photos: ["/files/a3.png", "/files/a1.png"] }] },
    { task: "B", photoUrl: "/files/b1.png", photoNote: "lama" },
    { task: "C" },
  ]);
  assert("collectWbsPhotos: galeri + riwayat + field lama, tanpa duplikat per pekerjaan", pure.length === 4 && pure.filter((p) => p.task === "A").length === 3 && pure[3].task === "B", JSON.stringify(pure));

  const dir = await headersFor("direktur");
  const stamp = Date.now().toString(36).toUpperCase();
  const pid = `PRJ-RM-${stamp}`;
  const empId = `EMP-RM-${stamp}`;
  const deviceId = `rm-${stamp}`;
  const now = new Date().toISOString();
  await exec("INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [pid, "Samarinda", JSON.stringify({ vessel: "TB Probe", client: "PT Probe", status: "Dalam Proses" }), now]);
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [empId, "Samarinda", JSON.stringify({ name: "Probe RM", status: "Aktif" }), now]);
  try {
    const put = await app.inject({ method: "PUT", url: `/api/projects/${pid}/wbs`, headers: dir, payload: { wbs: [{ task: "Hull Assembly", start: "2026-10", end: "2026-11", progress: 40, weight: 10, photos: [{ url: "/files/2026-10/x1.png", note: "blok 1", date: "2026-10-05" }], history: [{ date: "2026-10-06", from: 30, to: 40, actor: "Rudi", note: "las blok 2", photos: ["/files/2026-10/x2.png"] }] }] } });
    assert("PUT WBS berfoto diterima", put.statusCode === 200, put.body);
    const get = await app.inject({ method: "GET", url: `/api/projects/${pid}/wbs/photos`, headers: dir });
    const gp = (get.json() as { data: { total: number; photos: { url: string; task: string; source: string }[] } }).data;
    assert("GET foto WBS mengembalikan yang baru ditulis", get.statusCode === 200 && gp.total === 2 && gp.photos.some((p) => p.url.endsWith("x1.png") && p.source === "foto") && gp.photos.some((p) => p.url.endsWith("x2.png") && p.source === "riwayat"), get.body);
    assert("GET foto WBS tanpa login → 401", (await app.inject({ method: "GET", url: `/api/projects/${pid}/wbs/photos` })).statusCode === 401);
    assert("mekanik di luar tim → 404", (await app.inject({ method: "GET", url: `/api/projects/${pid}/wbs/photos`, headers: await headersFor("mekanik") })).statusCode === 404);

    const mr = await app.inject({ method: "GET", url: `/api/projects/${pid}/material-requests`, headers: dir });
    assert("GET permintaan barang proyek → 200 (kosong untuk proyek baru)", mr.statusCode === 200 && (mr.json() as { data: { total: number } }).data.total === 0, mr.body);

    await app.inject({ method: "POST", url: "/api/attendance/devices", headers: dir, payload: { deviceId } });
    const dev = await app.inject({ method: "GET", url: "/api/attendance/devices", headers: dir });
    assert("GET alat absensi memuat alat yang didaftarkan, tanpa key", dev.statusCode === 200 && dev.body.includes(deviceId) && !/[0-9a-f]{64}/.test(dev.body), dev.body);

    const before = await app.inject({ method: "GET", url: `/api/employees/${empId}/leave-pin`, headers: dir });
    await app.inject({ method: "POST", url: `/api/employees/${empId}/leave-pin`, headers: dir, payload: { pin: "112233" } });
    const after = await app.inject({ method: "GET", url: `/api/employees/${empId}/leave-pin`, headers: dir });
    assert("GET status PIN cuti: false → true, tanpa nilai PIN/hash", (before.json() as { data: { pinSet: boolean } }).data.pinSet === false && (after.json() as { data: { pinSet: boolean } }).data.pinSet === true && !after.body.includes("112233") && !/\$2[aby]\$/.test(after.body), after.body);

    const files = await app.inject({ method: "GET", url: "/api/files", headers: dir });
    assert("GET daftar unggahan → 200", files.statusCode === 200 && Array.isArray((files.json() as { data: { files: unknown[] } }).data.files), files.body.slice(0, 120));
    assert("GET daftar unggahan tanpa login → 401", (await app.inject({ method: "GET", url: "/api/files" })).statusCode === 401);
  } finally {
    await exec("DELETE FROM wbs_by_project WHERE project_id = ?", [pid]);
    await exec("DELETE FROM projects WHERE id = ?", [pid]);
    await exec("DELETE FROM employees WHERE id = ?", [empId]);
    await exec("DELETE FROM access_secrets WHERE access_key IN (?, ?)", [`device:${deviceId}`, `pin:${empId}`]);
  }
  console.log(`\n${passed}/${total} pemeriksaan read model lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
