// Security Probe: Scope Cabang di Server (F2-06 / ADR-0003 Jalur A)
import { randomUUID } from "node:crypto";
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";
import { COLLECTIONS } from "../src/routes/crud.js";

async function main() {
  console.log("=== ISMS Branch Scope Server Probe (F2-06 Jalur A) ===");
  const app = await buildApp();

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

  // Cari user direktur untuk skenario yang boleh mengubah branch.
  const dirUsers = await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1",
  );
  if (dirUsers.length === 0) throw new Error("Direktur user not found in DB");
  const dir = dirUsers[0];
  const dirToken = signToken({ id: dir.id, username: dir.username, role: dir.role, branch: "SEMUA", v: dir.token_version ?? 0 });

  // Cari atau buat user non-direktur (peran proyek) yang benar-benar ada di DB.
  const projUsers = await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE role = 'proyek' LIMIT 1",
  );
  let probeUserId: string | null = null;
  if (projUsers.length === 0) {
    probeUserId = randomUUID();
    await exec(
      "INSERT INTO users (id, username, pass_hash, name, role, email, is_active, token_version) VALUES (?, ?, ?, ?, ?, ?, 1, 0)",
      [probeUserId, `probe.proyek.${Date.now()}@local`, "probe-hash-unused", "Probe Proyek", "proyek", "probe.proyek@local"],
    );
  }
  const freshProjUsers = probeUserId
    ? await q<{ id: string; username: string; role: string; token_version: number }>(
      "SELECT id, username, role, token_version FROM users WHERE id = ? LIMIT 1",
      [probeUserId],
    )
    : projUsers;
  if (freshProjUsers.length === 0) throw new Error("Proyek user not found in DB");
  const projUser = freshProjUsers[0];
  const projToken = signToken({ id: projUser.id, username: projUser.username, role: "proyek", branch: "Samarinda", v: projUser.token_version ?? 0 });

  // 2. POST oleh peran operasional (proyek) tanpa branch -> dipaksa default Samarinda
  const createRes1 = await app.inject({
    method: "POST",
    url: "/api/surveys",
    headers: { authorization: "Bearer " + projToken, "content-type": "application/json" },
    payload: {
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
    headers: { authorization: "Bearer " + projToken, "content-type": "application/json" },
    payload: {
      branch: "Balikpapan",
      data: { judul: "Survey Probe 2", surveyor: "Tester" },
    },
  });
  assert("Peran proyek create dengan branch luar tetap berhasil 201", createRes2.statusCode === 201, `HTTP ${createRes2.statusCode}`);
  const created2 = JSON.parse(createRes2.body)?.data;
  assert("Server memaksa branch = 'Samarinda' untuk peran non-direktur", created2?.branch === "Samarinda", `branch=${created2?.branch}`);

  if (created1?.id) {
    // 4. PATCH branch oleh peran operasional -> ditolak 403 Forbidden
    const patchOperasionalRes = await app.inject({
      method: "PATCH",
      url: `/api/surveys/${created1.id}`,
      headers: { authorization: "Bearer " + projToken, "content-type": "application/json" },
      payload: {
        branch: "Balikpapan",
      },
    });
    assert("PATCH branch oleh peran operasional ditolak 403 Forbidden", patchOperasionalRes.statusCode === 403, `HTTP ${patchOperasionalRes.statusCode}`);

    // 5. PATCH data biasa tanpa mengubah branch oleh peran operasional -> berhasil 200
    const patchDataRes = await app.inject({
      method: "PATCH",
      url: `/api/surveys/${created1.id}`,
      headers: { authorization: "Bearer " + projToken, "content-type": "application/json" },
      payload: {
        data: { judul: "Survey Probe 1 Updated" },
      },
    });
    assert("PATCH data biasa oleh peran operasional berhasil 200 OK", patchDataRes.statusCode === 200, `HTTP ${patchDataRes.statusCode}`);

    // 6. PATCH branch oleh direktur -> diizinkan 200 OK
    const patchDirRes = await app.inject({
      method: "PATCH",
      url: `/api/surveys/${created1.id}`,
      headers: { authorization: "Bearer " + dirToken, "content-type": "application/json" },
      payload: {
        branch: "Banjarmasin",
      },
    });
    assert("PATCH branch oleh direktur diizinkan 200 OK", patchDirRes.statusCode === 200, `HTTP ${patchDirRes.statusCode}`);
    const patchedDirData = JSON.parse(patchDirRes.body)?.data;
    assert("Branch berhasil diperbarui ke 'Banjarmasin' oleh direktur", patchedDirData?.branch === "Banjarmasin", `branch=${patchedDirData?.branch}`);
  }

  // Bersihkan data tes
  if (created1?.id) {
    await app.inject({ method: "DELETE", url: `/api/surveys/${created1.id}`, headers: { authorization: "Bearer " + dirToken } });
  }
  if (created2?.id) {
    await app.inject({ method: "DELETE", url: `/api/surveys/${created2.id}`, headers: { authorization: "Bearer " + dirToken } });
  }
  if (probeUserId) {
    await exec("DELETE FROM users WHERE id = ?", [probeUserId]);
  }

  console.log(`\nHasil: ${passed}/${total} checks passed.`);
  await closeDb();
  if (passed !== total) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal error in branch-scope-probe:", err);
  process.exit(1);
});
