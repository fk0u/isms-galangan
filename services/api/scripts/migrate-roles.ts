import { exec, q } from "../src/db.js";
import { normalizeRole, ROLES } from "../src/policy.js";

interface UserRow {
  id: string;
  username: string;
  role: string;
}

async function main() {
  console.log("=== MIGRASI PERAN PENGGUNA KE ENUM RESMI ISMS (ADR-0004 / F2-05) ===");
  console.log("Enum peran valid:", ROLES.join(", "));

  const users = await q<UserRow>("SELECT id, username, role FROM users ORDER BY username ASC");
  console.log(`Ditemukan ${users.length} pengguna di basis data.\n`);

  let changedCount = 0;
  const changes: { username: string; from: string; to: string }[] = [];

  for (const u of users) {
    const nextRole = normalizeRole(u.role);
    if (u.role !== nextRole) {
      await exec("UPDATE users SET role = ? WHERE id = ?", [nextRole, u.id]);
      changes.push({ username: u.username, from: u.role, to: nextRole });
      changedCount += 1;
      console.log(`[UBAH] ${u.username}: "${u.role}" -> "${nextRole}"`);
    } else {
      console.log(`[TETAP] ${u.username}: "${u.role}"`);
    }
  }

  console.log("\n--- RINGKASAN MIGRASI ---");
  console.log(`Total pengguna: ${users.length}`);
  console.log(`Diperbarui: ${changedCount}`);
  console.log(`Tidak berubah: ${users.length - changedCount}`);
  if (changes.length > 0) {
    console.log("\nDaftar perubahan:");
    for (const c of changes) {
      console.log(`  - ${c.username}: ${c.from} -> ${c.to}`);
    }
  }
}

main().catch((err) => {
  console.error("Gagal migrasi peran:", err);
  process.exit(1);
});
