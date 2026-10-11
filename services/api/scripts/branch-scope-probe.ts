// Security Probe: Scope Cabang di Server (F2-06 / ADR-0003 Jalur A)
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";
import { COLLECTIONS } from "../src/routes/crud.js";

async function main() {
  console.log("=== ISMS Branch Scope Server Probe (F2-06 Jalur A) ===");
  const app = await buildApp();
  const fixtureSuffix = Date.now();
  const globalUserId = `probe-global-${fixtureSuffix}`;
  const scopedUserId = `probe-proyek-${fixtureSuffix}`;
  const scopedEmployeeId = `probe-employee-${fixtureSuffix}`;
  const emptyBranchRowId = `probe-empty-branch-${fixtureSuffix}`;
  const outOfScopeProjectId = `PRJ-PROBE-${fixtureSuffix}`;
  const surveyId1 = `S-PROBE-${fixtureSuffix}-1`;
  const surveyId2 = `S-PROBE-${fixtureSuffix}-2`;
  const otherSurveyId = `S-PROBE-${fixtureSuffix}-3`;
  const exactInventoryName = `Probe exact inventory ${fixtureSuffix}`;
  const inventoryNoiseIds = Array.from({ length: 105 }, (_, index) => `INV-PROBE-${fixtureSuffix}-noise-${String(index).padStart(3, "0")}`);
  const inventoryExactId = `INV-PROBE-${fixtureSuffix}-exact`;
  const inventoryForeignExactId = `INV-PROBE-${fixtureSuffix}-foreign`;
  const inventoryFixtureIds = [...inventoryNoiseIds, inventoryExactId, inventoryForeignExactId];
  const scopedWbsFixture = [{ id: "probe-wbs-node" }];

  try {
  let passed = 0;
  let total = 0;

  function assert(name: string, ok: boolean, details?: string) {
    total++;
    if (ok) {
      passed++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name}${details ? ` -> ${details}` : ""}`);
      process.exitCode = 1;
    }
  }

  // 1. Verifikasi Database: Tidak ada baris dengan branch kosong di 57 tabel
  let totalEmptyAcrossAll = 0;
  for (const table of COLLECTIONS) {
    try {
      const rows = await q<{ c: number }>(
        `SELECT count(*) as c FROM ${table} WHERE branch IS NULL OR branch = '' OR trim(branch) = ''`,
      );
      const count = Number(rows[0]?.c ?? 0);
      if (count > 0) {
        totalEmptyAcrossAll += count;
        console.error(`Tabel ${table} memiliki ${count} baris tanpa cabang!`);
      }
    } catch {
      // Abaikan jika tabel belum ada di lingkungan uji
    }
  }
  assert("Semua tabel envelope bebas dari kolom branch kosong/NULL", totalEmptyAcrossAll === 0, `ditemukan ${totalEmptyAcrossAll} baris kosong`);

  // Cari user direktur dan non-direktur (mis. demo / user tester)
  const dirUsers = await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1",
  );
  if (dirUsers.length === 0) throw new Error("Direktur user not found in DB");
  const dir = dirUsers[0];
  const dirToken = signToken({ id: dir.id, username: dir.username, role: dir.role, branch: "SEMUA", v: dir.token_version ?? 0 });

  // requireAuth derives branch from the user's employee record, not from a client-supplied JWT claim.
  const globalUsername = `${globalUserId}@galangan.com`;
  await exec(
    "INSERT INTO users (id, username, pass_hash, name, role, email, is_active, token_version, employee_id) VALUES (?, ?, ?, ?, ?, ?, 1, 0, NULL)",
    [globalUserId, globalUsername, "hash", "Probe Global", "direktur", globalUsername],
  );
  const globalToken = signToken({ id: globalUserId, username: globalUsername, role: "direktur", branch: "SEMUA", v: 0 });

  // Selalu buat aktor uji dengan employee cabang Samarinda; requireAuth mengambil scope dari DB.
  const scopedUsername = `${scopedUserId}@galangan.com`;
  await exec(
    "INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)",
    [scopedEmployeeId, "Samarinda", JSON.stringify({ nama: "Probe Proyek" }), new Date().toISOString()],
  );
  await exec(
    "INSERT INTO users (id, username, pass_hash, name, role, email, is_active, token_version, employee_id) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)",
    [scopedUserId, scopedUsername, "hash", "Probe Proyek", "proyek", scopedUsername, scopedEmployeeId],
  );
  const projToken = signToken({ id: scopedUserId, username: scopedUsername, role: "proyek", branch: "Samarinda", v: 0 });

  const inventoryFixtureRows = [
    ...inventoryNoiseIds.map((id) => ({
      id, branch: "Samarinda", data: JSON.stringify({ name: `${exactInventoryName} variant` }), updated_at: "2026-10-01T00:00:00.000Z",
    })),
    { id: inventoryExactId, branch: "Samarinda", data: JSON.stringify({ name: exactInventoryName }), updated_at: "2099-12-31T23:59:59.999Z" },
    { id: inventoryForeignExactId, branch: "Banjarmasin", data: JSON.stringify({ name: exactInventoryName }), updated_at: "2099-12-31T23:59:59.999Z" },
  ];
  await exec(
    `INSERT INTO inventory (id, branch, data, updated_at) VALUES ${inventoryFixtureRows.map(() => "(?, ?, ?, ?)").join(",")}`,
    inventoryFixtureRows.flatMap((row) => [row.id, row.branch, row.data, row.updated_at]),
  );

  const exactInventoryQuery = new URLSearchParams({ exactName: exactInventoryName, branch: "Samarinda", limit: "2", offset: "0" });
  const exactInventoryRes = await app.inject({
    method: "GET", url: `/api/inventory?${exactInventoryQuery}`, headers: { authorization: `Bearer ${projToken}` },
  });
  const exactInventoryBody = JSON.parse(exactInventoryRes.body)?.data as { rows?: Array<{ id: string }>; total?: number } | undefined;
  assert(
    "Lookup exact inventory melewati substring matches tetapi hanya mengembalikan item Samarinda",
    exactInventoryRes.statusCode === 200 && exactInventoryBody?.total === 1
      && exactInventoryBody.rows?.length === 1 && exactInventoryBody.rows[0]?.id === inventoryExactId,
    `HTTP ${exactInventoryRes.statusCode}; total=${exactInventoryBody?.total}; rows=${exactInventoryBody?.rows?.length}`,
  );
  const forgedInventoryQuery = new URLSearchParams({ exactName: exactInventoryName, branch: "Banjarmasin", limit: "2", offset: "0" });
  const forgedInventoryRes = await app.inject({
    method: "GET", url: `/api/inventory?${forgedInventoryQuery}`, headers: { authorization: `Bearer ${projToken}` },
  });
  const forgedInventoryBody = JSON.parse(forgedInventoryRes.body)?.data as { rows?: Array<{ id: string }>; total?: number } | undefined;
  assert(
    "Lookup exact inventory tidak dapat memperluas branch lewat query palsu",
    forgedInventoryRes.statusCode === 200 && forgedInventoryBody?.total === 0 && forgedInventoryBody.rows?.length === 0,
    `HTTP ${forgedInventoryRes.statusCode}; total=${forgedInventoryBody?.total}; rows=${forgedInventoryBody?.rows?.length}`,
  );

  // 2. POST oleh peran operasional (proyek) tanpa branch -> dipaksa default Samarinda
  const createRes1 = await app.inject({
    method: "POST",
    url: "/api/surveys",
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: {
      id: surveyId1,
      data: { judul: "Survey Probe 1", surveyor: "Tester" },
    },
  });
  assert("Peran proyek membuat entitas berhasil", createRes1.statusCode === 201, `HTTP ${createRes1.statusCode}`);
  const created1 = JSON.parse(createRes1.body)?.data;
  assert("Entitas baru otomatis ber-cabang 'Samarinda'", created1?.branch === "Samarinda", `branch=${created1?.branch}`);

  // 3. POST oleh peran operasional dengan branch luar (mis. Balikpapan) -> dipaksa default Samarinda
  const createRes2 = await app.inject({
    method: "POST",
    url: "/api/surveys",
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: {
      id: surveyId2,
      branch: "Balikpapan",
      data: { judul: "Survey Probe 2", surveyor: "Tester" },
    },
  });
  assert("Peran proyek create dengan branch luar tetap berhasil 201", createRes2.statusCode === 201, `HTTP ${createRes2.statusCode}`);
  const created2 = JSON.parse(createRes2.body)?.data;
  assert("Server memaksa branch = 'Samarinda' untuk peran non-direktur", created2?.branch === "Samarinda", `branch=${created2?.branch}`);

  // 4. List dan get-by-id mengikuti cabang di claim JWT, bukan filter UI/klien.
  const createOtherRes = await app.inject({
    method: "POST",
    url: "/api/surveys",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { id: otherSurveyId, branch: "Banjarmasin", data: { judul: "Survey Probe Cabang Lain", surveyor: "Tester" } },
  });
  assert("Direktur dapat membuat fixture survei Banjarmasin", createOtherRes.statusCode === 201, `HTTP ${createOtherRes.statusCode}`);
  const createdOther = JSON.parse(createOtherRes.body)?.data;
  assert("Fixture direktur benar-benar tersimpan di Banjarmasin", createdOther?.branch === "Banjarmasin", `branch=${createdOther?.branch}`);

  // Simulasikan data legacy tanpa branch: fail-closed untuk scope cabang.
  await exec(
    "INSERT INTO surveys (id, branch, data, updated_at) VALUES (?, ?, ?, ?)",
    [emptyBranchRowId, "", JSON.stringify({ judul: "Survey Probe Tanpa Cabang" }), new Date().toISOString()],
  );

  const scopedListRes = await app.inject({
    method: "GET", url: "/api/surveys?limit=1000", headers: { authorization: `Bearer ${projToken}` },
  });
  const scopedRows = JSON.parse(scopedListRes.body)?.data?.rows as Array<{ id: string; branch: string }> | undefined;
  assert(
    "GET list pengguna Samarinda hanya mengembalikan row cabang Samarinda",
    scopedListRes.statusCode === 200 && !!scopedRows?.some((row) => row.id === created1.id)
      && !scopedRows?.some((row) => row.id === createdOther.id || row.id === emptyBranchRowId)
      && scopedRows?.every((row) => row.branch === "Samarinda"),
    `HTTP ${scopedListRes.statusCode}; rows=${scopedRows?.length ?? "?"}`,
  );

  const forgedBranchRes = await app.inject({
    method: "GET", url: "/api/surveys?branch=Banjarmasin&limit=1000", headers: { authorization: `Bearer ${projToken}` },
  });
  const forgedRows = JSON.parse(forgedBranchRes.body)?.data?.rows as Array<{ id: string }> | undefined;
  assert(
    "Query branch palsu tidak dapat memperluas scope pengguna Samarinda",
    forgedBranchRes.statusCode === 200 && (forgedRows?.length ?? -1) === 0,
    `HTTP ${forgedBranchRes.statusCode}; rows=${forgedRows?.length ?? "?"}`,
  );

  const crossBranchGetRes = await app.inject({
    method: "GET", url: `/api/surveys/${createdOther.id}`, headers: { authorization: `Bearer ${projToken}` },
  });
  assert("GET-by-id lintas cabang disamarkan sebagai 404", crossBranchGetRes.statusCode === 404, `HTTP ${crossBranchGetRes.statusCode}`);

  const crossBranchPatchRes = await app.inject({
    method: "PATCH", url: `/api/surveys/${createdOther.id}`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { data: { judul: "Tidak boleh diubah lintas cabang" } },
  });
  assert("PATCH row lintas cabang ditolak sebagai 404", crossBranchPatchRes.statusCode === 404, `HTTP ${crossBranchPatchRes.statusCode}`);

  const crossBranchDeleteRes = await app.inject({
    method: "DELETE", url: `/api/surveys/${createdOther.id}`, headers: { authorization: `Bearer ${projToken}` },
  });
  assert("DELETE row lintas cabang ditolak sebagai 404", crossBranchDeleteRes.statusCode === 404, `HTTP ${crossBranchDeleteRes.statusCode}`);

  // Sama-cabang project di luar keanggotaan harus tertutup pada semua by-id verbs.
  await exec(
    "INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)",
    [outOfScopeProjectId, "Samarinda", JSON.stringify({ vessel: "Probe Vessel", client: "Probe Client" }), new Date().toISOString()],
  );
  const outOfScopeProjectPatchRes = await app.inject({
    method: "PATCH", url: `/api/projects/${outOfScopeProjectId}`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { data: { note: "Tidak boleh diubah di luar team scope" } },
  });
  assert("PATCH project satu-cabang di luar team scope ditolak 404", outOfScopeProjectPatchRes.statusCode === 404, `HTTP ${outOfScopeProjectPatchRes.statusCode}`);

  const outOfScopeProjectDeleteRes = await app.inject({
    method: "DELETE", url: `/api/projects/${outOfScopeProjectId}`, headers: { authorization: `Bearer ${projToken}` },
  });
  assert("DELETE project satu-cabang di luar team scope ditolak 404", outOfScopeProjectDeleteRes.statusCode === 404, `HTTP ${outOfScopeProjectDeleteRes.statusCode}`);

  const teamGrantRes = await app.inject({
    method: "PUT", url: `/api/projects/${outOfScopeProjectId}/team`,
    headers: { authorization: `Bearer ${globalToken}`, "content-type": "application/json" },
    payload: { memberIds: [scopedEmployeeId], baseData: [] },
  });
  assert("Admin dapat memberi membership fixture proyek", teamGrantRes.statusCode === 200, `HTTP ${teamGrantRes.statusCode}`);

  const inScopeProjectGetRes = await app.inject({
    method: "GET", url: `/api/projects/${outOfScopeProjectId}`, headers: { authorization: `Bearer ${projToken}` },
  });
  assert("Member proyek dapat membaca project dalam team scope", inScopeProjectGetRes.statusCode === 200, `HTTP ${inScopeProjectGetRes.statusCode}`);

  const inScopeProjectPatchRes = await app.inject({
    method: "PATCH", url: `/api/projects/${outOfScopeProjectId}`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { data: { note: "Perubahan oleh anggota proyek" } },
  });
  assert("Member proyek dapat PATCH project dalam team scope", inScopeProjectPatchRes.statusCode === 200, `HTTP ${inScopeProjectPatchRes.statusCode}`);

  const inScopeWbsPutRes = await app.inject({
    method: "PUT", url: `/api/projects/${outOfScopeProjectId}/wbs`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { wbs: scopedWbsFixture, baseData: [] },
  });
  assert("Member proyek dapat menulis WBS dalam team scope", inScopeWbsPutRes.statusCode === 200, `HTTP ${inScopeWbsPutRes.statusCode}`);

  const inScopeTeamPutRes = await app.inject({
    method: "PUT", url: `/api/projects/${outOfScopeProjectId}/team`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { memberIds: [scopedEmployeeId], baseData: [scopedEmployeeId] },
  });
  assert("Member proyek dapat menulis Team dalam team scope", inScopeTeamPutRes.statusCode === 200, `HTTP ${inScopeTeamPutRes.statusCode}`);

  const teamRevokeRes = await app.inject({
    method: "PUT", url: `/api/projects/${outOfScopeProjectId}/team`,
    headers: { authorization: `Bearer ${globalToken}`, "content-type": "application/json" },
    payload: { memberIds: [], baseData: [scopedEmployeeId] },
  });
  assert("Admin dapat mencabut membership fixture proyek", teamRevokeRes.statusCode === 200, `HTTP ${teamRevokeRes.statusCode}`);

  const revokedProjectPatchRes = await app.inject({
    method: "PATCH", url: `/api/projects/${outOfScopeProjectId}`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { data: { note: "Tidak boleh diubah setelah membership dicabut" } },
  });
  assert("PATCH proyek ditolak 404 setelah membership dicabut", revokedProjectPatchRes.statusCode === 404, `HTTP ${revokedProjectPatchRes.statusCode}`);

  const revokedWbsPutRes = await app.inject({
    method: "PUT", url: `/api/projects/${outOfScopeProjectId}/wbs`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { wbs: [], baseData: scopedWbsFixture },
  });
  assert("PUT WBS ditolak 404 setelah membership dicabut", revokedWbsPutRes.statusCode === 404, `HTTP ${revokedWbsPutRes.statusCode}`);

  const revokedTeamPutRes = await app.inject({
    method: "PUT", url: `/api/projects/${outOfScopeProjectId}/team`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: { memberIds: [], baseData: [scopedEmployeeId] },
  });
  assert("PUT Team ditolak 404 setelah membership dicabut", revokedTeamPutRes.statusCode === 404, `HTTP ${revokedTeamPutRes.statusCode}`);

  const revokedProjectDeleteRes = await app.inject({
    method: "DELETE", url: `/api/projects/${outOfScopeProjectId}`, headers: { authorization: `Bearer ${projToken}` },
  });
  assert("DELETE proyek ditolak 404 setelah membership dicabut", revokedProjectDeleteRes.statusCode === 404, `HTTP ${revokedProjectDeleteRes.statusCode}`);

  const emptyBranchGetRes = await app.inject({
    method: "GET", url: `/api/surveys/${emptyBranchRowId}`, headers: { authorization: `Bearer ${projToken}` },
  });
  assert("GET-by-id row tanpa branch ditolak fail-closed", emptyBranchGetRes.statusCode === 404, `HTTP ${emptyBranchGetRes.statusCode}`);

  const directorListRes = await app.inject({
    method: "GET", url: "/api/surveys?branch=Banjarmasin&limit=1000", headers: { authorization: `Bearer ${globalToken}` },
  });
  const directorRows = JSON.parse(directorListRes.body)?.data?.rows as Array<{ id: string }> | undefined;
  assert(
    "Direktur dengan scope SEMUA tetap dapat melihat Banjarmasin",
    directorListRes.statusCode === 200 && !!directorRows?.some((row) => row.id === createdOther.id),
    `HTTP ${directorListRes.statusCode}`,
  );

  // 5. PATCH branch oleh peran operasional -> ditolak 403 Forbidden
  const patchOperasionalRes = await app.inject({
    method: "PATCH",
    url: `/api/surveys/${created1.id}`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: {
      branch: "Balikpapan",
    },
  });
  assert("PATCH branch oleh peran operasional ditolak 403 Forbidden", patchOperasionalRes.statusCode === 403, `HTTP ${patchOperasionalRes.statusCode}`);

  // 6. PATCH data biasa tanpa mengubah branch oleh peran operasional -> berhasil 200
  const patchDataRes = await app.inject({
    method: "PATCH",
    url: `/api/surveys/${created1.id}`,
    headers: { authorization: `Bearer ${projToken}`, "content-type": "application/json" },
    payload: {
      data: { judul: "Survey Probe 1 Updated" },
    },
  });
  assert("PATCH data biasa oleh peran operasional berhasil 200 OK", patchDataRes.statusCode === 200, `HTTP ${patchDataRes.statusCode}`);

  // 7. PATCH branch oleh direktur -> diizinkan 200 OK
  const patchDirRes = await app.inject({
    method: "PATCH",
    url: `/api/surveys/${created1.id}`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: {
      branch: "Banjarmasin",
    },
  });
  assert("PATCH branch oleh direktur diizinkan 200 OK", patchDirRes.statusCode === 200, `HTTP ${patchDirRes.statusCode}`);
  const patchedDirData = JSON.parse(patchDirRes.body)?.data;
  assert("Branch berhasil diperbarui ke 'Banjarmasin' oleh direktur", patchedDirData?.branch === "Banjarmasin", `branch=${patchedDirData?.branch}`);

  console.log(`\nHasil: ${passed}/${total} checks passed.`);
  if (passed !== total) process.exitCode = 1;
  } finally {
    let cleanupFailed = false;
    const cleanup = async (sql: string, params: unknown[]) => {
      try {
        await exec(sql, params);
      } catch (error) {
        cleanupFailed = true;
        console.error("Gagal membersihkan fixture probe:", error);
      }
    };
    await cleanup("DELETE FROM surveys WHERE id IN (?, ?, ?, ?)", [surveyId1, surveyId2, otherSurveyId, emptyBranchRowId]);
    await cleanup(`DELETE FROM inventory WHERE id IN (${inventoryFixtureIds.map(() => "?").join(",")})`, inventoryFixtureIds);
    await cleanup("DELETE FROM audit_log WHERE table_name IN ('projects', 'team_by_project', 'wbs_by_project') AND row_id = ?", [outOfScopeProjectId]);
    await cleanup("DELETE FROM wbs_by_project WHERE project_id = ?", [outOfScopeProjectId]);
    await cleanup("DELETE FROM team_by_project WHERE project_id = ?", [outOfScopeProjectId]);
    await cleanup("DELETE FROM projects WHERE id = ?", [outOfScopeProjectId]);
    await cleanup("DELETE FROM users WHERE id IN (?, ?)", [globalUserId, scopedUserId]);
    await cleanup("DELETE FROM employees WHERE id = ?", [scopedEmployeeId]);
    try {
      await closeDb();
    } catch (error) {
      cleanupFailed = true;
      console.error("Gagal menutup database probe:", error);
    }
    if (cleanupFailed) process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error in branch-scope-probe:", err);
  process.exit(1);
});
