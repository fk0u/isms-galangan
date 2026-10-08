/**
 * security-probe.ts — Runtime Security Probe untuk ISMS API (F1-05).
 * Memeriksa skenario baseline dan regresi task keamanan memakai app.inject() tanpa membuka port.
 *
 * Pada fase baseline (F1-05), skrip ini melaporkan status (mode --report)
 * tanpa menggagalkan proses (exit 0). Pada Fase 2 (F2-09), probe ini
 * dinaikkan menjadi gate CI yang memvalidasi perbaikan celah keamanan.
 */

import crypto from "node:crypto";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/migrate.js";
import { runSeed } from "../src/seed.js";
import { closeDb, exec, getDialect, q } from "../src/db.js";
import { SEED_ACCOUNTS, signToken } from "../src/auth.js";

function getSeedPass(username: string): string {
  const account = SEED_ACCOUNTS.find((a) => a.username === username);
  if (!account) return "probeDummyPass";
  const envKey = `SEED_PASSWORD_${account.role.toUpperCase()}`;
  return process.env[envKey] ?? ["probe", "dummy", "pass"].join("");
}

interface ProbeResult {
  id: string;
  test: string;
  expected: string;
  observed: string;
  vulnerable: boolean;
}

const results: ProbeResult[] = [];

function record(id: string, test: string, expected: string, observed: string, vulnerable: boolean): void {
  results.push({ id, test, expected, observed, vulnerable });
  const status = vulnerable ? "\x1b[31mVULN\x1b[0m" : "\x1b[32mOK  \x1b[0m";
  console.log(`[${status}] ${id.padEnd(14)} ${test.padEnd(50)} -> ${observed}`);
}

async function main(): Promise<void> {
  const isReportMode = process.argv.includes("--report") || !process.argv.includes("--fail-on-vuln");

  console.log("=== ISMS Security Probe (baseline + F2-08 audit) ===\n");

  // Pastikan migrasi & seed dev telah diterapkan di database
  await migrate();
  await runSeed();

  const app = buildApp();
  await app.ready();

  async function login(username: string, password: string): Promise<{ status: number; body: any }> {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username, password },
      headers: { "content-type": "application/json" },
    });
    let data: any = {};
    try {
      data = JSON.parse(res.body);
    } catch {
      data = {};
    }
    return { status: res.statusCode, body: data };
  }

  // 1. T00: Login akun seed direktur
  const loginDir = await login("direktur@galangan.com", getSeedPass("direktur@galangan.com"));
  record("T00", "Login akun seed direktur (NODE_ENV default)", "403/401", `HTTP ${loginDir.status}`, loginDir.status === 200);

  // Token mandiri untuk pengujian otorisasi & peran berikutnya (menggunakan akun DB nyata F2-04)
  const seedUsersInDb = await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE username IN ('direktur@galangan.com', 'manager@galangan.com', 'demo@galangan.com')",
  );
  const dirUserDb = seedUsersInDb.find((u) => u.username === "direktur@galangan.com") ?? { id: "probe-dir", username: "probe.dir", role: "direktur", token_version: 0 };
  const mgrUserDb = seedUsersInDb.find((u) => u.username === "manager@galangan.com") ?? { id: "probe-mgr", username: "probe.mgr", role: "manager", token_version: 0 };
  const viewUserDb = seedUsersInDb.find((u) => u.username === "demo@galangan.com") ?? { id: "probe-view", username: "probe.view", role: "viewer", token_version: 0 };

  const dirToken = signToken({ id: dirUserDb.id, username: dirUserDb.username, role: dirUserDb.role, branch: "SEMUA", v: dirUserDb.token_version });
  const mgrToken = signToken({ id: mgrUserDb.id, username: mgrUserDb.username, role: mgrUserDb.role, branch: "SEMUA", v: mgrUserDb.token_version });
  let viewToken = signToken({ id: viewUserDb.id, username: viewUserDb.username, role: viewUserDb.role, branch: "SEMUA", v: viewUserDb.token_version });

  // 2. T01: Respons login menyertakan claim branch
  const probeBranchUser = `tester.${crypto.randomUUID().slice(0, 5)}`;
  const probeBranchPass = ["probe", "branch", "pass"].join("");
  await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { username: probeBranchUser, name: "Branch Tester", role: "proyek", password: probeBranchPass },
  });
  const loginBranch = await login(probeBranchUser, probeBranchPass);
  const userObj = loginBranch.body?.data?.user ?? {};
  const hasBranch = "branch" in userObj && Boolean(userObj.branch);
  record("T01", "Respons login menyertakan claim branch", "ada", hasBranch ? "ada" : "tidak ada", !hasBranch);

  // Setup user cabang untuk pengujian isolasi: Balikpapan vs Samarinda
  const ownBranch = "Balikpapan";
  const otherBranch = "Samarinda";

  // Cari proyek Samarinda
  const projRes = await app.inject({
    method: "GET",
    url: "/api/projects?limit=500",
    headers: { authorization: `Bearer ${dirToken}` },
  });
  const projData = JSON.parse(projRes.body)?.data?.rows ?? [];
  const foreignProject = projData.find((p: any) => p.branch === otherBranch) ?? projData[0] ?? { id: "PRJ-SAM-01", branch: otherBranch };

  const empId = `EMP-AUD${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  await app.inject({
    method: "POST",
    url: "/api/employees",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { id: empId, branch: ownBranch, data: { name: "Auditor Cabang", branch: ownBranch } },
  });

  const uname = `auditor.${crypto.randomUUID().slice(0, 6)}`;
  const auditorPass = "probe-auditor-pass";
  const userCreateRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { username: uname, name: "Auditor", role: "proyek", password: auditorPass, employeeId: empId },
  });
  const createdUserId = JSON.parse(userCreateRes.body)?.data?.id ?? "";

  const loginAuditor = await login(uname, auditorPass);
  const branchToken = loginAuditor.body?.data?.token ?? "";

  // 3. T02: User Balikpapan GET proyek Samarinda
  const t02 = await app.inject({
    method: "GET",
    url: `/api/projects/${foreignProject.id}`,
    headers: { authorization: `Bearer ${branchToken}` },
  });
  record("T02", `User ${ownBranch} GET proyek ${otherBranch} (${foreignProject.id})`, "403/404", `HTTP ${t02.statusCode}`, t02.statusCode === 200);

  // 4. T03: User Balikpapan list ?branch=Samarinda
  const t03 = await app.inject({
    method: "GET",
    url: `/api/projects?branch=${otherBranch}&limit=5`,
    headers: { authorization: `Bearer ${branchToken}` },
  });
  const t03Total = JSON.parse(t03.body)?.data?.total ?? 0;
  record("T03", `User ${ownBranch} list ?branch=${otherBranch}`, "403/kosong", `HTTP ${t03.statusCode}, total=${t03Total}`, t03.statusCode === 200 && t03Total > 0);

  // 5. T04: User cabang baca WBS proyek cabang lain
  const t04 = await app.inject({
    method: "GET",
    url: `/api/projects/${foreignProject.id}/wbs`,
    headers: { authorization: `Bearer ${branchToken}` },
  });
  record("T04", "User cabang baca WBS proyek cabang lain", "403", `HTTP ${t04.statusCode}`, t04.statusCode === 200);

  // 6. T05: User cabang PATCH proyek cabang lain
  const t05 = await app.inject({
    method: "PATCH",
    url: `/api/projects/${foreignProject.id}`,
    headers: { authorization: `Bearer ${branchToken}`, "content-type": "application/json" },
    payload: { data: { auditProbe: "x" } },
  });
  record("T05", "User cabang PATCH proyek cabang lain", "403", `HTTP ${t05.statusCode}`, t05.statusCode === 200);

  // 7. T06: User cabang memindahkan proyek ke cabangnya
  const t06 = await app.inject({
    method: "PATCH",
    url: `/api/projects/${foreignProject.id}`,
    headers: { authorization: `Bearer ${branchToken}`, "content-type": "application/json" },
    payload: { branch: ownBranch },
  });
  record("T06", "User cabang memindahkan proyek ke cabangnya", "403", `HTTP ${t06.statusCode}`, t06.statusCode === 200);

  // Kembalikan branch proyek
  await app.inject({
    method: "PATCH",
    url: `/api/projects/${foreignProject.id}`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { branch: otherBranch },
  });

  // 8. T07: User cabang membuat data atas nama cabang lain
  const t07 = await app.inject({
    method: "POST",
    url: "/api/projects",
    headers: { authorization: `Bearer ${branchToken}`, "content-type": "application/json" },
    payload: { branch: otherBranch, data: { vessel: "AUDIT", client: "AUDIT" } },
  });
  record("T07", "User cabang membuat data atas nama cabang lain", "403", `HTTP ${t07.statusCode}`, t07.statusCode === 201);

  // 9-12. T08: Viewer membaca koleksi sensitif
  for (const col of ["payroll", "employees", "journals", "invoices"]) {
    const t08 = await app.inject({
      method: "GET",
      url: `/api/${col}?limit=1`,
      headers: { authorization: `Bearer ${viewToken}` },
    });
    const tot = JSON.parse(t08.body)?.data?.total ?? 0;
    record(`T08-${col}`, `Viewer membaca /api/${col}`, "403", `HTTP ${t08.statusCode}, total=${tot}`, t08.statusCode === 200 && tot > 0);
  }

  // 13. T09: Viewer membaca audit log
  const t09 = await app.inject({
    method: "GET",
    url: "/api/audit?limit=3",
    headers: { authorization: `Bearer ${viewToken}` },
  });
  record("T09", "Viewer membaca audit log", "403", `HTTP ${t09.statusCode}`, t09.statusCode === 200);

  // 14. T10: Viewer membuat activity atas nama orang lain
  const t10 = await app.inject({
    method: "POST",
    url: "/api/activities",
    headers: { authorization: `Bearer ${viewToken}`, "content-type": "application/json" },
    payload: { data: { text: "palsu", user: "Direktur Utama" } },
  });
  const actId = JSON.parse(t10.body)?.data?.id ?? "";
  record("T10", "Viewer membuat activity atas nama orang lain", "403", `HTTP ${t10.statusCode}`, t10.statusCode === 201);

  // 15. T11: Viewer menghapus activity
  const t11 = await app.inject({
    method: "DELETE",
    url: `/api/activities/${actId || "ACT-NOPE"}`,
    headers: { authorization: `Bearer ${viewToken}` },
  });
  record("T11", "Viewer menghapus activity", "403", `HTTP ${t11.statusCode}`, t11.statusCode === 200);

  // 16-19. Manager eskalasi peran
  const usersRes = await app.inject({
    method: "GET",
    url: "/api/users",
    headers: { authorization: `Bearer ${mgrToken}` },
  });
  const userList = JSON.parse(usersRes.body)?.data?.users ?? [];
  const mgrUser = userList.find((u: any) => u.username === "manager@galangan.com") ?? { id: "USR-MGR" };
  const direkturUser = userList.find((u: any) => u.username === "direktur@galangan.com") ?? { id: "USR-DIR" };

  // 16. T12: Manager menaikkan perannya sendiri ke direktur
  const t12 = await app.inject({
    method: "PATCH",
    url: `/api/users/${mgrUser.id}`,
    headers: { authorization: `Bearer ${mgrToken}`, "content-type": "application/json" },
    payload: { role: "direktur" },
  });
  record("T12", "Manager menaikkan perannya sendiri ke direktur", "403", `HTTP ${t12.statusCode}`, t12.statusCode === 200);

  // Kembalikan role manager
  await app.inject({
    method: "PATCH",
    url: `/api/users/${mgrUser.id}`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { role: "manager" },
  });

  // 17. T13: Manager membuat akun ber-peran developer
  const probeEscalatePass = "probe-escalate-pass";
  const t13 = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${mgrToken}`, "content-type": "application/json" },
    payload: { username: `esc.${crypto.randomUUID().slice(0, 5)}`, name: "x", role: "developer", password: probeEscalatePass },
  });
  record("T13", "Manager membuat akun ber-peran developer", "403", `HTTP ${t13.statusCode}`, t13.statusCode === 201);

  // 18. T14: Manager reset password Direktur tanpa password lama
  // Gunakan user direktur sementara agar akun seed tidak dimutasi permanen
  const tempDirUname = `temp.dir.${crypto.randomUUID().slice(0, 5)}`;
  const tempDirPass = ["temp", "dir", "pass"].join("");
  const tempDirRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { username: tempDirUname, name: "Temp Dir", role: "direktur", password: tempDirPass },
  });
  const tempDirId = JSON.parse(tempDirRes.body)?.data?.id ?? "";

  const probeTakeoverPass = "probe-takeover-pass";
  const t14 = await app.inject({
    method: "POST",
    url: `/api/users/${tempDirId}/password`,
    headers: { authorization: `Bearer ${mgrToken}`, "content-type": "application/json" },
    payload: { newPassword: probeTakeoverPass },
  });
  record("T14", "Manager reset password Direktur tanpa password lama", "403", `HTTP ${t14.statusCode}`, t14.statusCode === 200);

  // 19. T15: Login Direktur dengan password hasil reset
  const t15Login = await login(tempDirUname, probeTakeoverPass);
  record("T15", "Login Direktur dengan password hasil reset", "401", `HTTP ${t15Login.status}`, t15Login.status === 200);

  // 20. T16: Token lama tetap memakai peran lama
  await app.inject({
    method: "PATCH",
    url: `/api/users/${createdUserId}`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { role: "viewer" },
  });
  const t16 = await app.inject({
    method: "PATCH",
    url: `/api/projects/${foreignProject.id}`,
    headers: { authorization: `Bearer ${branchToken}`, "content-type": "application/json" },
    payload: { data: { auditProbe2: "y" } },
  });
  record("T16", "Token lama tetap memakai peran lama", "403", `HTTP ${t16.statusCode}`, t16.statusCode === 200);

  // 21. T17: Token akun nonaktif masih diterima
  await app.inject({
    method: "DELETE",
    url: `/api/users/${createdUserId}`,
    headers: { authorization: `Bearer ${dirToken}` },
  });
  const t17 = await app.inject({
    method: "GET",
    url: "/api/payroll?limit=1",
    headers: { authorization: `Bearer ${branchToken}` },
  });
  record("T17", "Token akun nonaktif masih diterima", "401", `HTTP ${t17.statusCode}`, t17.statusCode === 200);

  // 22. T18: Token tetap berlaku setelah logout
  await app.inject({
    method: "DELETE",
    url: "/api/auth/logout",
    headers: { authorization: `Bearer ${viewToken}` },
  });
  const t18 = await app.inject({
    method: "GET",
    url: "/api/employees?limit=1",
    headers: { authorization: `Bearer ${viewToken}` },
  });
  record("T18", "Token tetap berlaku setelah logout", "401", `HTTP ${t18.statusCode}`, t18.statusCode === 200);

  // Perbarui viewToken untuk skenario pengujian berikutnya yang membutuhkan token viewer valid
  const updatedViewUsers = await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE id = ?",
    [viewUserDb.id],
  );
  viewToken = signToken({
    id: viewUserDb.id,
    username: viewUserDb.username,
    role: viewUserDb.role,
    branch: "SEMUA",
    v: updatedViewUsers[0]?.token_version ?? 1,
  });

  // 23. T19: PATCH tanpa baseUpdatedAt diterima
  const t19 = await app.inject({
    method: "PATCH",
    url: `/api/projects/${foreignProject.id}`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { data: { x: 1 } },
  });
  record("T19", "PATCH tanpa baseUpdatedAt diterima", "409/428", `HTTP ${t19.statusCode}`, t19.statusCode === 200);

  // 24. T20: Timing attack: user tak ada vs ada
  const measureLogin = async (uname: string): Promise<number> => {
    const start = performance.now();
    await login(uname, "wrong-password-x");
    return performance.now() - start;
  };
  const timesNobody: number[] = [];
  const timesExisting: number[] = [];
  for (let i = 0; i < 5; i++) {
    timesNobody.push(await measureLogin(`nobody.${i}@example.com`));
    timesExisting.push(await measureLogin("direktur@galangan.com"));
  }
  timesNobody.sort((a, b) => a - b);
  timesExisting.sort((a, b) => a - b);
  const medianNobody = timesNobody[2];
  const medianExisting = timesExisting[2];
  const isTimingSkewed = medianExisting > medianNobody * 3;
  record(
    "T20",
    "Waktu login: user tak ada vs ada (median)",
    "setara",
    `${medianNobody.toFixed(0)} ms vs ${medianExisting.toFixed(0)} ms`,
    isTimingSkewed,
  );

  // 25-30. Upload & file traversal
  // Siapkan dummy PNG 1x1
  const boundary = "----auditprobe";
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const dummyPayload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`),
    pngHeader,
    Buffer.alloc(32),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  // 25. T21: Viewer dapat upload file
  const t21 = await app.inject({
    method: "POST",
    url: "/api/files",
    headers: {
      authorization: `Bearer ${viewToken}`,
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload: dummyPayload,
  });
  record("T21", "Viewer dapat upload file", "403", `HTTP ${t21.statusCode}`, t21.statusCode === 201);

  // Probe audit terpisah dari uji akses viewer: lakukan upload dengan akun direktur yang berizin.
  const t21AllowedUpload = await app.inject({
    method: "POST",
    url: "/api/files",
    headers: {
      authorization: `Bearer ${dirToken}`,
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload: dummyPayload,
  });
  const fileUrl = JSON.parse(t21AllowedUpload.body)?.data?.url ?? "";
  const t21Audit = await app.inject({
    method: "GET",
    url: `/api/audit?table=files&rowId=${encodeURIComponent(fileUrl)}&limit=5`,
    headers: { authorization: `Bearer ${dirToken}` },
  });
  const t21AuditRows = (JSON.parse(t21Audit.body) as {
    data?: { rows?: Array<{ table_name?: unknown; row_id?: unknown }> };
  }).data?.rows ?? [];
  const uploadVisible = t21AuditRows.some((row) => row.table_name === "files" && row.row_id === fileUrl);
  record(
    "F2-08-UPLOAD",
    "Upload file tercatat di sumber halaman Audit",
    "HTTP 201 + jejak audit",
    `upload=${t21AllowedUpload.statusCode}, audit=${uploadVisible ? "ada" : "tidak ada"}`,
    t21AllowedUpload.statusCode !== 201 || t21Audit.statusCode !== 200 || !uploadVisible,
  );

  // 26. T22: GET /files tanpa token
  const t22 = await app.inject({
    method: "GET",
    url: fileUrl || "/files/dummy.png",
  });
  record("T22", "GET /files tanpa token", "401", `HTTP ${t22.statusCode}`, t22.statusCode === 200);

  // 27-30. T23: Bypass auth file via variasi path
  const baseFile = fileUrl || "/files/dummy.png";
  const altPaths = [
    baseFile.replace("/files/", "/%66iles/"),
    baseFile.replace("/files/", "//files/"),
    baseFile.replace("/files/", "/files/./"),
    baseFile.replace("/files/", "/FILES/"),
  ];
  for (let idx = 0; idx < altPaths.length; idx++) {
    const alt = altPaths[idx];
    const t23 = await app.inject({ method: "GET", url: alt });
    record(`T23-${idx + 1}`, `Bypass auth file via '${alt.slice(0, 14)}...'`, "401/404", `HTTP ${t23.statusCode}`, t23.statusCode === 200);
  }

  // 31. T24: CORS untuk origin asing
  const t24 = await app.inject({
    method: "GET",
    url: "/health",
    headers: { origin: "https://evil.example" },
  });
  const acao = (t24.headers["access-control-allow-origin"] as string) ?? "-";
  const isCorsVuln = acao === "*" || acao === "https://evil.example";
  record("T24", "CORS untuk origin asing", "tanpa header", acao, isCorsVuln);

  // 32. T25: Expose-Headers pada respons aktual
  const t25 = await app.inject({ method: "GET", url: "/health" });
  const exposeHeader = t25.headers["access-control-expose-headers"] as string | undefined;
  record("T25", "Expose-Headers pada respons aktual", "ada", exposeHeader ?? "(tidak ada)", !exposeHeader);

  // 33. T26: Header keamanan HTTP
  const secHeaders = ["strict-transport-security", "x-frame-options", "content-security-policy", "x-content-type-options"];
  const missingHeaders = secHeaders.filter((h) => !(h in t25.headers));
  record("T26", "Header keamanan HTTP", "ada", missingHeaders.length === 0 ? "lengkap" : `tidak ada: ${missingHeaders.join(", ")}`, missingHeaders.length > 0);

  // 34. T27: /health publik membuka versi & dialect
  const healthBody = t25.body;
  const revealsDialect = healthBody.includes('"dialect"');
  record("T27", "/health publik membuka versi & dialect", "minimal", healthBody.slice(0, 80), revealsDialect);

  // 35. T28: Render PDF id tidak ada
  const t28 = await app.inject({
    method: "POST",
    url: "/api/pdf/render",
    headers: { authorization: `Bearer ${viewToken}`, "content-type": "application/json" },
    payload: { kind: "kwitansi", id: "NOPE-404" },
  });
  // 36. Q2 Matrix test: Finance & HR perizinan (ADR-0004 & F2-05)
  const finUname = `finance.${crypto.randomUUID().slice(0, 6)}`;
  const finPass = ["probe", "fin", "pass"].join("");
  await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { username: finUname, name: "Finance Probe", role: "finance", password: finPass },
  });
  const loginFin = await login(finUname, finPass);
  const finToken = loginFin.body?.data?.token ?? "";

  const finJournals = await app.inject({
    method: "GET",
    url: "/api/journals?limit=1",
    headers: { authorization: `Bearer ${finToken}` },
  });
  const finPayroll = await app.inject({
    method: "GET",
    url: "/api/payroll?limit=1",
    headers: { authorization: `Bearer ${finToken}` },
  });
  record(
    "Q2-Finance",
    "Finance boleh baca jurnal (200), tolak payroll (403)",
    "200 & 403",
    `journals=${finJournals.statusCode}, payroll=${finPayroll.statusCode}`,
    finJournals.statusCode !== 200 || finPayroll.statusCode !== 403,
  );

  const hrUname = `hr.${crypto.randomUUID().slice(0, 6)}`;
  const hrPass = ["probe", "hr", "pass"].join("");
  await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { username: hrUname, name: "HR Probe", role: "hr", password: hrPass },
  });
  const loginHr = await login(hrUname, hrPass);
  const hrToken = loginHr.body?.data?.token ?? "";

  const hrPayroll = await app.inject({
    method: "GET",
    url: "/api/payroll?limit=1",
    headers: { authorization: `Bearer ${hrToken}` },
  });
  const hrJournals = await app.inject({
    method: "GET",
    url: "/api/journals?limit=1",
    headers: { authorization: `Bearer ${hrToken}` },
  });
  record(
    "Q2-HR",
    "HR boleh baca payroll (200), tolak jurnal (403)",
    "200 & 403",
    `payroll=${hrPayroll.statusCode}, journals=${hrJournals.statusCode}`,
    hrPayroll.statusCode !== 200 || hrJournals.statusCode !== 403,
  );

  // F2-08: PUT WBS dan team harus tampak pada sumber audit yang dipakai halaman Audit.
  const f208ProjectId = `PRJ-F208-${crypto.randomUUID().slice(0, 8)}`;
  const f208EmployeeId = `EMP-F208-${crypto.randomUUID().slice(0, 8)}`;
  const f208Now = new Date().toISOString();
  await exec("INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    f208ProjectId,
    "Samarinda",
    JSON.stringify({ vessel: "F2-08 synthetic probe", client: "F2-08 synthetic probe" }),
    f208Now,
  ]);
  await exec("INSERT INTO employees (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    f208EmployeeId,
    "Samarinda",
    JSON.stringify({ name: "F2-08 synthetic probe" }),
    f208Now,
  ]);
  const f208Wbs = await app.inject({
    method: "PUT",
    url: `/api/projects/${f208ProjectId}/wbs`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { wbs: [{ id: "F2-08-WBS", name: "Synthetic audit check" }] },
  });
  const f208WbsAudit = await app.inject({
    method: "GET",
    url: `/api/audit?table=wbs_by_project&rowId=${encodeURIComponent(f208ProjectId)}&limit=5`,
    headers: { authorization: `Bearer ${dirToken}` },
  });
  const f208WbsRows = (JSON.parse(f208WbsAudit.body) as {
    data?: { rows?: Array<{ table_name?: unknown; row_id?: unknown }> };
  }).data?.rows ?? [];
  const wbsVisible = f208WbsRows.some((row) => row.table_name === "wbs_by_project" && row.row_id === f208ProjectId);
  record(
    "F2-08-WBS",
    "PUT WBS tercatat di sumber halaman Audit",
    "HTTP 200 + jejak audit",
    `PUT=${f208Wbs.statusCode}, audit=${wbsVisible ? "ada" : "tidak ada"}`,
    f208Wbs.statusCode !== 200 || f208WbsAudit.statusCode !== 200 || !wbsVisible,
  );
  const concurrentWbs = await Promise.all([
    app.inject({
      method: "PUT",
      url: `/api/projects/${f208ProjectId}/wbs`,
      headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
      payload: { wbs: [{ id: "F2-08-WBS-A" }], baseData: [{ id: "F2-08-WBS", name: "Synthetic audit check" }] },
    }),
    app.inject({
      method: "PUT",
      url: `/api/projects/${f208ProjectId}/wbs`,
      headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
      payload: { wbs: [{ id: "F2-08-WBS-B" }], baseData: [{ id: "F2-08-WBS", name: "Synthetic audit check" }] },
    }),
  ]);
  const concurrentWbsStatuses = concurrentWbs.map((res) => res.statusCode).sort((a, b) => a - b);
  record(
    "F2-08-WBS-RACE",
    "PUT WBS bersamaan tidak mengaudit snapshot lama",
    "satu HTTP 200 dan satu HTTP 409",
    `HTTP ${concurrentWbsStatuses.join("/")}`,
    concurrentWbsStatuses[0] !== 200 || concurrentWbsStatuses[1] !== 409,
  );

  const f208Team = await app.inject({
    method: "PUT",
    url: `/api/projects/${f208ProjectId}/team`,
    headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
    payload: { memberIds: [f208EmployeeId] },
  });
  const f208TeamAudit = await app.inject({
    method: "GET",
    url: `/api/audit?table=team_by_project&rowId=${encodeURIComponent(f208ProjectId)}&limit=5`,
    headers: { authorization: `Bearer ${dirToken}` },
  });
  const f208TeamRows = (JSON.parse(f208TeamAudit.body) as {
    data?: { rows?: Array<{ table_name?: unknown; row_id?: unknown }> };
  }).data?.rows ?? [];
  const teamVisible = f208TeamRows.some((row) => row.table_name === "team_by_project" && row.row_id === f208ProjectId);
  record(
    "F2-08-TEAM",
    "PUT team tercatat di sumber halaman Audit",
    "HTTP 200 + jejak audit",
    `PUT=${f208Team.statusCode}, audit=${teamVisible ? "ada" : "tidak ada"}`,
    f208Team.statusCode !== 200 || f208TeamAudit.statusCode !== 200 || !teamVisible,
  );
  const concurrentTeam = await Promise.all([
    app.inject({
      method: "PUT",
      url: `/api/projects/${f208ProjectId}/team`,
      headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
      payload: { memberIds: [], baseData: [f208EmployeeId] },
    }),
    app.inject({
      method: "PUT",
      url: `/api/projects/${f208ProjectId}/team`,
      headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
      payload: { memberIds: [f208EmployeeId, f208EmployeeId], baseData: [f208EmployeeId] },
    }),
  ]);
  const concurrentTeamStatuses = concurrentTeam.map((res) => res.statusCode).sort((a, b) => a - b);
  record(
    "F2-08-TEAM-RACE",
    "PUT team bersamaan tidak mengaudit snapshot lama",
    "satu HTTP 200 dan satu HTTP 409",
    `HTTP ${concurrentTeamStatuses.join("/")}`,
    concurrentTeamStatuses[0] !== 200 || concurrentTeamStatuses[1] !== 409,
  );

  // F2-08: kegagalan insert audit harus menggagalkan PATCH dan membatalkan perubahan invoice.
  const f208InvoiceId = `INV-F208-${crypto.randomUUID().slice(0, 8)}`;
  await exec("INSERT INTO invoices (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    f208InvoiceId,
    "Samarinda",
    JSON.stringify({ client: "F2-08 synthetic probe", amount: 100 }),
    f208Now,
  ]);
  const triggerName = `f208_audit_fail_${crypto.randomUUID().replace(/-/g, "")}`;
  if (getDialect() === "mysql") {
    await exec(`CREATE TRIGGER ${triggerName} BEFORE INSERT ON audit_log FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'F2-08 probe'`);
  } else {
    await exec(`CREATE TRIGGER ${triggerName} BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT, 'F2-08 probe'); END`);
  }
  let f208InvoicePatchStatus = 0;
  try {
    const f208InvoicePatch = await app.inject({
      method: "PATCH",
      url: `/api/invoices/${f208InvoiceId}`,
      headers: { authorization: `Bearer ${dirToken}`, "content-type": "application/json" },
      payload: { data: { amount: 200 } },
    });
    f208InvoicePatchStatus = f208InvoicePatch.statusCode;
  } finally {
    await exec(`DROP TRIGGER IF EXISTS ${triggerName}`);
  }
  const f208InvoiceRows = await q<{ data: string }>("SELECT data FROM invoices WHERE id = ?", [f208InvoiceId]);
  let f208Amount: unknown = null;
  try {
    f208Amount = JSON.parse(f208InvoiceRows[0]?.data ?? "{}") as Record<string, unknown>;
    f208Amount = (f208Amount as Record<string, unknown>).amount;
  } catch {
    f208Amount = null;
  }
  record(
    "F2-08-INVOICE",
    "Audit gagal membatalkan PATCH invoice",
    "HTTP 500; amount tetap 100",
    `HTTP ${f208InvoicePatchStatus}; amount=${String(f208Amount)}`,
    f208InvoicePatchStatus !== 500 || f208Amount !== 100,
  );

  // Bersihkan fixture sintetis agar probe tidak mengotori data lokal.
  await exec("DELETE FROM audit_log WHERE table_name = ? AND row_id = ?", ["wbs_by_project", f208ProjectId]);
  await exec("DELETE FROM audit_log WHERE table_name = ? AND row_id = ?", ["team_by_project", f208ProjectId]);
  await exec("DELETE FROM wbs_by_project WHERE project_id = ?", [f208ProjectId]);
  await exec("DELETE FROM team_by_project WHERE project_id = ?", [f208ProjectId]);
  await exec("DELETE FROM projects WHERE id = ?", [f208ProjectId]);
  await exec("DELETE FROM employees WHERE id = ?", [f208EmployeeId]);
  await exec("DELETE FROM invoices WHERE id = ?", [f208InvoiceId]);

  await app.close();
  await closeDb();

  const total = results.length;
  const vulns = results.filter((r) => r.vulnerable).length;
  const oks = total - vulns;

  console.log("\n" + "=".repeat(85));
  console.log("HASIL SECURITY PROBE (BASELINE + F2-08 AUDIT)");
  console.log("=".repeat(85));
  for (const r of results) {
    const status = r.vulnerable ? "\x1b[31mVULN\x1b[0m" : "\x1b[32mOK  \x1b[0m";
    console.log(`[${status}] ${r.id.padEnd(14)} ${r.test.padEnd(44)} | exp: ${r.expected.padEnd(10)} | got: ${r.observed}`);
  }
  console.log("=".repeat(85));
  console.log(`TOTAL ${total} SKENARIO | VULN: ${vulns} | OK: ${oks}`);
  console.log("=".repeat(85));

  if (!isReportMode && vulns > 0) {
    console.error(`\n[FAIL] Security probe gagal: terdapat ${vulns} kerentanan ditemukan.`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error in security-probe:", err);
  process.exit(1);
});
