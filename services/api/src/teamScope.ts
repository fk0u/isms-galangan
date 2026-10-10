/* F3-E-02 (MON-02): lingkup proyek per peran ditegakkan SERVER, bukan hanya UI.
 * Peran lapangan (proyek, mekanik) hanya menerima proyek di mana
 * karyawannya anggota tim, atau yang ia pimpin (field `manager`).
 * Subkon belum dibatasi: akunnya belum tertaut ke karyawan/subkontraktor,
 * sehingga pembatasan sekarang akan mengosongkan seluruh tampilannya.
 * QC, drydock, dan equipment sengaja tidak dibatasi di sini: modul mereka
 * (inspeksi, booking dock, peminjaman alat) bekerja lintas semua proyek. */
import { q } from "./db.js";

const TEAM_SCOPED = new Set(["proyek", "mekanik"]);

export interface ScopeUser { role?: string; employeeId?: string | null }

/** null = tidak dibatasi; Set = hanya id proyek ini (boleh kosong). */
export async function scopedProjectIds(user: ScopeUser | undefined): Promise<Set<string> | null> {
  const role = String(user?.role ?? "").toLowerCase();
  if (!TEAM_SCOPED.has(role)) return null;
  const empId = String(user?.employeeId ?? "").trim();
  const ids = new Set<string>();
  if (empId === "") return ids; // akun tanpa karyawan tertaut: tidak melihat proyek apa pun
  const teams = await q<{ project_id: string; data: string }>("SELECT project_id, data FROM team_by_project", []);
  for (const t of teams) {
    try {
      const members = JSON.parse(t.data) as unknown;
      if (Array.isArray(members) && members.map(String).includes(empId)) ids.add(t.project_id);
    } catch { /* baris rusak dilewati */ }
  }
  const emp = await q<{ data: string }>("SELECT data FROM employees WHERE id = ?", [empId]);
  let name = "";
  try { name = String((JSON.parse(emp[0]?.data ?? "{}") as Record<string, unknown>).name ?? "").trim(); } catch { /* tanpa nama */ }
  if (name !== "") {
    const projects = await q<{ id: string; data: string }>("SELECT id, data FROM projects", []);
    for (const p of projects) {
      if (!p.data.includes(name)) continue;
      try { if (String((JSON.parse(p.data) as Record<string, unknown>).manager ?? "").trim() === name) ids.add(p.id); } catch { /* dilewati */ }
    }
  }
  return ids;
}
