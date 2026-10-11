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
  const surveyId1 = `S-PROBE-${fixtureSuffix}-1`;
  const surveyId2 = `S-PROBE-${fixtureSuffix}-2`;
  const otherSurveyId = `S-PROBE-${fixtureSuffix}-3`;

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
