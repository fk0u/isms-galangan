import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec } from "../src/db.js";

async function main() {
  console.log("=== ISMS User Hierarchy Probe (F2-03) ===");
  const app = buildApp();
  await app.ready();

  const usersSeed = await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE username IN ('direktur@galangan.com', 'manager@galangan.com', 'demo@galangan.com')",
  );
  const dirUser = usersSeed.find((u) => u.username === "direktur@galangan.com")!;
  const mgrUser = usersSeed.find((u) => u.username === "manager@galangan.com")!;
  const viewUser = usersSeed.find((u) => u.username === "demo@galangan.com")!;

  const dirToken = signToken({ id: dirUser.id, username: dirUser.username, role: dirUser.role, branch: "Samarinda", v: dirUser.token_version });
  const mgrToken = signToken({ id: mgrUser.id, username: mgrUser.username, role: mgrUser.role, branch: "Samarinda", v: mgrUser.token_version });
  const viewToken = signToken({ id: viewUser.id, username: viewUser.username, role: viewUser.role, branch: "Samarinda", v: viewUser.token_version });

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

  // 1. Direktur membuat manager baru (harus berhasil)
  const uniqueMgrUname = `mgr.probe.${Date.now()}`;
  const createMgrRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { username: uniqueMgrUname, name: "Manager Probe", role: "manager", password: "Password1234" },
  });
  assert("Direktur bisa membuat akun peran manager", createMgrRes.statusCode === 201, `HTTP ${createMgrRes.statusCode}`);
  const createdMgr = JSON.parse(createMgrRes.body)?.data;
  const createdMgrId = createdMgr?.id;

  // 2. Direktur mengubah akun manager (harus berhasil)
  const patchMgrRes = await app.inject({
    method: "PATCH",
    url: `/api/users/${createdMgrId}`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { name: "Manager Probe Updated" },
  });
  assert("Direktur bisa mengubah info akun manager", patchMgrRes.statusCode === 200, `HTTP ${patchMgrRes.statusCode}`);

  // 3. Direktur mereset password akun manager (harus berhasil)
  const resetPassRes = await app.inject({
    method: "POST",
    url: `/api/users/${createdMgrId}/password`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { newPassword: "NewManagerPassword123" },
  });
  assert("Direktur bisa mereset password manager", resetPassRes.statusCode === 200, `HTTP ${resetPassRes.statusCode}`);

  // 4. Manager mencoba mereset password akun direktur (harus ditolak 403)
  const dirUsers = await q<{ id: string }>("SELECT id FROM users WHERE role = 'direktur' LIMIT 1");
  if (dirUsers.length > 0) {
    const mgrResetDirRes = await app.inject({
      method: "POST",
      url: `/api/users/${dirUsers[0].id}/password`,
      headers: { authorization: `Bearer ${mgrToken}`, "content-type": "application/json" },
      payload: { newPassword: "HackedPassword123" },
    });
    assert("Manager ditolak saat reset password direktur", mgrResetDirRes.statusCode === 403, `HTTP ${mgrResetDirRes.statusCode}`);
  }

  // 5. Manager mencoba membuat akun developer (harus ditolak 403)
  const mgrCreateDevRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${mgrToken}`, "content-type": "application/json" },
    payload: { username: `dev.probe.${Date.now()}`, name: "Dev Probe", role: "developer", password: "Password1234" },
  });
  assert("Manager ditolak saat membuat akun developer", mgrCreateDevRes.statusCode === 403, `HTTP ${mgrCreateDevRes.statusCode}`);

  // 6. Viewer mencoba mengelola user (harus ditolak 403)
  const viewGetUsersRes = await app.inject({
    method: "GET",
    url: "/api/users",
    headers: { authorization: `Bearer ${viewToken}` },
  });
  assert("Viewer ditolak saat mengakses daftar user", viewGetUsersRes.statusCode === 403, `HTTP ${viewGetUsersRes.statusCode}`);

  // Bersihkan data tes
  if (createdMgrId) {
    await exec("DELETE FROM users WHERE id = ?", [createdMgrId]);
  }

  console.log(`\nHasil: ${passed}/${total} checks passed.\n`);
  await app.close();
}

main().catch((err) => {
  console.error("Fatal error in user-hierarchy-probe:", err);
  process.exit(1);
});
