/* F3-F-01 (DRY-01): kapal yang melebihi batas dock (LOA, lebar, sarat)
 * ditolak server. Direktur/developer boleh override - keputusan docking
 * kapal di luar batas adalah keputusan bisnis, bukan operator.
 * Batas kosong/0 = tidak dibatasi; data kapal kosong = tidak dibandingkan. */
import { q } from "./db.js";

type Data = Record<string, unknown>;
const OVERRIDE = new Set(["direktur", "developer"]);
const DIMS: Array<[limit: string, vessel: string, label: string]> = [
  ["maxLoa", "loa", "LOA"],
  ["maxBeam", "beam", "lebar"],
  ["maxDraft", "draft", "sarat"],
];

/** Murni, supaya bisa diuji probe tanpa DB. */
export function dockFitIssue(dock: Data, vessel: Data): string | null {
  for (const [limit, dim, label] of DIMS) {
    const max = Number(dock[limit]);
    const val = Number(vessel[dim]);
    if (Number.isFinite(max) && max > 0 && Number.isFinite(val) && val > max) {
      return `${label} kapal ${val} m melebihi batas dock ${max} m`;
    }
  }
  return null;
}

async function one(table: string, id: string): Promise<Data | null> {
  const rows = await q<{ data: string }>(`SELECT data FROM ${table} WHERE id = ?`, [id]);
  if (rows.length === 0) return null;
  try { return JSON.parse(rows[0].data) as Data; } catch { return null; }
}

/** null = boleh. Dipanggil saat create dan saat dock/proyek slot berubah. */
export async function dockFitError(table: string, after: Data | null, role: string | undefined): Promise<string | null> {
  if (table !== "dockSlots" || !after || String(after.project ?? "") === "MAINT") return null;
  if (role && OVERRIDE.has(role)) return null;
  const dock = await one("drydocks", String(after.dockId ?? ""));
  const project = await one("projects", String(after.project ?? ""));
  if (!dock || !project) return null;
  const name = String(project.vessel ?? "");
  const vessels = await q<{ data: string }>("SELECT data FROM vessels", []);
  for (const v of vessels) {
    let d: Data;
    try { d = JSON.parse(v.data) as Data; } catch { continue; }
    if (String(d.name ?? "") !== name) continue;
    const issue = dockFitIssue(dock, d);
    return issue ? `${name}: ${issue} (${String(dock.name ?? after.dockId)})` : null;
  }
  return null;
}
