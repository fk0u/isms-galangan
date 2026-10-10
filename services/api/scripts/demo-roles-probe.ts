/* demo-roles-probe.ts — demo RBAC: setiap peran Q2 punya akun seed, bisa
 * dipakai lewat "Lihat sebagai peran" (hanya direktur/developer, hanya bila
 * env mengizinkan), dan server menegakkan matriks izinnya (baca modul sendiri
 * 200, modul di luar haknya 403). */
import { buildApp } from "../src/app.js";
import { SEED_ACCOUNTS, signToken } from "../src/auth.js";
import { permissionsFor } from "../src/policy.js";
import { COLLECTIONS } from "../src/routes/crud.js";
import { q, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Demo Roles Probe ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenOf = async (username: string): Promise<string> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>(
      "SELECT id, username, role, token_version FROM users WHERE username = ?", [username],
    ))[0];
    if (!u) throw new Error(`Akun ${username} belum ada — jalankan npm run seed`);
    return signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  };
  const dir = await tokenOf("direktur@galangan.com");
  const viewer = await tokenOf("demo@galangan.com");
  const sw = (t: string, role: string) => app.inject({ method: "POST", url: "/api/auth/demo-switch", headers: { authorization: `Bearer ${t}` }, payload: { role } });

  const prevSwitch = process.env.DEMO_ROLE_SWITCH;
  const prevSeed = process.env.ALLOW_SEED_LOGIN;
  try {
    process.env.DEMO_ROLE_SWITCH = "false";
    process.env.ALLOW_SEED_LOGIN = "true";
    const off = await sw(dir, "procurement");
    assert("fitur mati (env) → 404", off.statusCode === 404, off.body);

    process.env.DEMO_ROLE_SWITCH = "true";
    const byViewer = await sw(viewer, "direktur");
    assert("viewer tidak bisa berpindah peran → 403", byViewer.statusCode === 403, byViewer.body);
    const unknown = await sw(dir, "superadmin");
    assert("peran tak dikenal → 404", unknown.statusCode === 404, unknown.body);

    const list = await app.inject({ method: "GET", url: "/api/auth/demo-switch", headers: { authorization: `Bearer ${dir}` } });
    const roles = (list.json().data as { roles: { role: string }[] }).roles.map((r) => r.role);
    assert("semua 14 peran tersedia untuk direktur", roles.length === 14 && new Set(roles).size === 14, JSON.stringify(roles));

    // Setiap peran: pindah lewat demo-switch, baca modul sendiri 200, modul terlarang 403.
    for (const account of SEED_ACCOUNTS) {
      const res = await sw(dir, account.role);
      const body = res.json().data as { token: string; user: { role: string } } | undefined;
      if (res.statusCode !== 200 || !body) { assert(`pindah ke ${account.role}`, false, res.body); continue; }
      const perms = permissionsFor(account.role);
      const readable = COLLECTIONS.filter((c) => (perms[c] ?? []).includes("r") && !["activities", "branches", "settings"].includes(c));
      const forbidden = COLLECTIONS.find((c) => !(perms[c] ?? []).includes("r"));
      // Modul inti tiap peran (bukan koleksi bersama seperti projects).
      const CORE: Record<string, string> = {
        finance: "invoices", hr: "payroll", procurement: "purchaseOrders", gudang: "inventory", mekanik: "maintenances",
        qc: "ncr", subkon: "workOrders", equipment: "equipment", drydock: "dockSlots", proyek: "projects",
        manager: "projects", viewer: "projects", direktur: "payroll", developer: "payroll",
      };
      const own = CORE[account.role] ?? readable[0];
      const h = { authorization: `Bearer ${body.token}` };
      const okRes = own ? await app.inject({ method: "GET", url: `/api/${own}`, headers: h }) : null;
      const noRes = forbidden ? await app.inject({ method: "GET", url: `/api/${forbidden}`, headers: h }) : null;
      assert(
        `${account.role}: baca ${own ?? "-"} 200, ${forbidden ?? "(semua boleh)"} ${forbidden ? "403" : ""}`.trim(),
        body.user.role === account.role && (!okRes || okRes.statusCode === 200) && (!noRes || noRes.statusCode === 403),
        `${okRes?.statusCode} ${noRes?.statusCode}`,
      );
    }
  } finally {
    process.env.DEMO_ROLE_SWITCH = prevSwitch;
    process.env.ALLOW_SEED_LOGIN = prevSeed;
    if (prevSwitch === undefined) delete process.env.DEMO_ROLE_SWITCH;
    if (prevSeed === undefined) delete process.env.ALLOW_SEED_LOGIN;
  }

  console.log(`\n${passed}/${total} pemeriksaan peran demo lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
