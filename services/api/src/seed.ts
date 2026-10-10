import { exec, q, closeDb } from "./db.js";
import { seedUsers } from "./auth.js";
import { buildSeedRows, buildTeamSeeds, buildWbsSeeds, topUpDemoWbsHistory } from "./seedData.js";

// Full DB seed (idempotent, skip-if-exists): users + all seedData rows +
// wbs/team. Same content as POST /api/admin/seed (without force).
// Run with the production .env loaded: set -a; source .env; set +a
export async function runSeed(): Promise<void> {
  await seedUsers(exec, q);
  const now = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;
  for (const row of buildSeedRows()) {
    const exists = await q("SELECT id FROM " + row.table + " WHERE id = ?", [row.id]);
    if (exists.length > 0) {
      skipped += 1;
      continue;
    }
    await exec(`INSERT INTO ${row.table} (id, branch, data, updated_at) VALUES (?, ?, ?, ?)`, [
      row.id,
      row.branch || "Samarinda",
      JSON.stringify(row.data),
      now,
    ]);
    inserted += 1;
  }
  for (const w of buildWbsSeeds()) {
    const exists = await q<{ project_id: string; data: string }>("SELECT project_id, data FROM wbs_by_project WHERE project_id = ?", [w.projectId]);
    if (exists.length > 0) {
      // Demo top-up hanya untuk WBS seed murni tanpa histori (lihat topUpDemoWbsHistory).
      const next = topUpDemoWbsHistory(w.projectId, exists[0].data);
      if (next) {
        await exec("UPDATE wbs_by_project SET data = ? WHERE project_id = ? AND data = ?", [next, w.projectId, exists[0].data]);
        inserted += 1;
      } else {
        skipped += 1;
      }
      continue;
    }
    await exec("INSERT INTO wbs_by_project (project_id, data) VALUES (?, ?)", [w.projectId, JSON.stringify(w.wbs)]);
    inserted += 1;
  }
  for (const t of buildTeamSeeds()) {
    const exists = await q("SELECT project_id FROM team_by_project WHERE project_id = ?", [t.projectId]);
    if (exists.length > 0) {
      skipped += 1;
      continue;
    }
    await exec("INSERT INTO team_by_project (project_id, data) VALUES (?, ?)", [t.projectId, JSON.stringify(t.memberIds)]);
    inserted += 1;
  }
  /* F5-03: tahap demo untuk proyek yang SUDAH ada di DB. Seed bersifat
     insert-if-missing, jadi field baru tidak pernah sampai ke baris lama;
     di sini diisi hanya bila `tahap` masih kosong (tidak menimpa isian user). */
  const DEMO_TAHAP: Record<string, string> = { "RP-2026-007": "Trial", "RP-2026-002": "Handover", "RP-2026-008": "Handover" };
  for (const [pid, tahap] of Object.entries(DEMO_TAHAP)) {
    const rows = await q<{ data: string }>("SELECT data FROM projects WHERE id = ?", [pid]);
    if (rows.length === 0) continue;
    try {
      const d = JSON.parse(rows[0].data) as Record<string, unknown>;
      if (String(d.tahap ?? "") !== "") continue;
      await exec("UPDATE projects SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify({ ...d, tahap }), new Date().toISOString(), pid]);
    } catch { /* baris rusak dilewati */ }
  }
  // Tautkan akun seed ke karyawan (default; bisa diubah via /api/users).
  // Peran lapangan ditautkan ke anggota tim proyek (TEAM_SEED) supaya
  // Monitoring "proyek saya" (F3-E-02) bisa diperagakan.
  const LINKS: Array<[string, string]> = [
    ["direktur@galangan.com", "EMP-001"], ["proyek@galangan.com", "EMP-004"], ["mekanik@galangan.com", "EMP-005"],
    ["qc@galangan.com", "EMP-006"], ["finance@galangan.com", "EMP-007"], ["procurement@galangan.com", "EMP-008"],
  ];
  try {
    for (const [username, empId] of LINKS) {
      const emp = await q("SELECT id FROM employees WHERE id = ?", [empId]);
      if (emp.length === 0) continue;
      await exec("UPDATE users SET employee_id = ? WHERE username = ? AND (employee_id IS NULL OR employee_id = '')", [empId, username]);
    }
  } catch {
    // DB lama tanpa kolom employee_id — migrasi akan menambahkannya saat boot.
  }
  console.log(`[seed] done (inserted=${inserted} skipped=${skipped})`);
}

const entry = process.argv[1] ?? "";
if (entry.endsWith("seed.ts") || entry.endsWith("seed.js")) {
  runSeed()
    .then(() => closeDb().then(() => process.exit(0)))
    .catch((err) => {
      console.error("[seed] failed:", err);
      process.exit(1);
    });
}
