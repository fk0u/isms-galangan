import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec } from "../src/db.js";

async function main() {
  console.log("=== ISMS Token Revocation Probe (F2-04) ===");
  const app = buildApp();
  await app.ready();

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

  // Cari akun direktur nyata dari DB
  const dirUsers = await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE username = 'direktur@galangan.com'",
  );
  if (dirUsers.length === 0) throw new Error("Direktur seed user not found");
  const dir = dirUsers[0];
  const dirToken = signToken({ id: dir.id, username: dir.username, role: dir.role, branch: "SEMUA", v: dir.token_version });

  // 1. Buat user tes operasional
  const testUname = `revocable.${Date.now()}`;
  const testPass = "TestPassword123";
  const createRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { username: testUname, name: "Revocation Tester", role: "proyek", password: testPass },
  });
  assert("Pembuatan user tes berhasil", createRes.statusCode === 201);
  const testUser = JSON.parse(createRes.body)?.data;
  const testUserId = testUser.id;

  // 2. Login user tes untuk mendapatkan token valid
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    headers: { "content-type": "application/json" },
    payload: { username: testUname, password: testPass },
  });
  assert("Login user tes berhasil", loginRes.statusCode === 200);
  const userToken = JSON.parse(loginRes.body)?.data?.token;

  // 3. Akses /api/auth/me dengan token valid (harus 200)
  const meRes1 = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: { authorization: `Bearer ${userToken}` },
  });
  assert("Akses /api/auth/me dengan token aktif berhasil", meRes1.statusCode === 200);

  // 4. Ubah peran user tes menjadi viewer (peran turun) -> bump token version
  const patchRoleRes = await app.inject({
    method: "PATCH",
    url: `/api/users/${testUserId}`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { role: "viewer" },
  });
  assert("PATCH peran user tes berhasil", patchRoleRes.statusCode === 200);

  // 5. Cek token lama: harus ditolak 401 seketika (karena token_version di-bump)
  const meRes2 = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: { authorization: `Bearer ${userToken}` },
  });
  assert("Token lama ditolak setelah peran diubah (revoked)", meRes2.statusCode === 401, `HTTP ${meRes2.statusCode}`);

  // 6. Login lagi untuk mendapatkan token baru versi 1
  const login2Res = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    headers: { "content-type": "application/json" },
    payload: { username: testUname, password: testPass },
  });
  const userToken2 = JSON.parse(login2Res.body)?.data?.token;

  // 7. Logout -> bump token version
  const logoutRes = await app.inject({
    method: "DELETE",
    url: "/api/auth/logout",
    headers: { authorization: `Bearer ${userToken2}` },
  });
  assert("Logout berhasil", logoutRes.statusCode === 200);

  // 8. Cek token setelah logout: harus ditolak 401
  const meRes3 = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: { authorization: `Bearer ${userToken2}` },
  });
  assert("Token ditolak setelah logout (revoked)", meRes3.statusCode === 401, `HTTP ${meRes3.statusCode}`);

  // 9. Bersihkan data uji
  await exec("DELETE FROM users WHERE id = ?", [testUserId]);

  console.log(`\nHasil: ${passed}/${total} checks passed.\n`);
  await app.close();
}

main().catch((err) => {
  console.error("Fatal error in token-revocation-probe:", err);
  process.exit(1);
});
