/* F3-I-04 (SUB-05): field SPK/kontrak work order hanya boleh diubah peran
 * procurement (dan direktur/developer sebagai admin). Peran lain tetap boleh
 * memperbarui progres, milestone, dan foto WO. */
import { normalizeRole } from "./policy.js";

type Data = Record<string, unknown>;

export const SPK_FIELDS = ["value", "scope", "date", "targetDate", "sub", "project", "penaltyPct", "paymentScheme", "taxPct", "retPct"] as const;
const SPK_EDITORS = new Set(["procurement", "direktur", "developer"]);

export function canEditSpk(role: unknown): boolean {
  return SPK_EDITORS.has(normalizeRole(role));
}

/** null = boleh; selain itu pesan penolakan (403). */
export function spkLockError(table: string, before: Data | null, after: Data | null, role: unknown): string | null {
  if (table !== "workOrders" || canEditSpk(role)) return null;
  // Menerbitkan atau menghapus SPK juga wewenang procurement, bukan hanya mengubahnya.
  if (!before && after) return "SPK/WO hanya bisa diterbitkan procurement";
  if (before && !after) return "SPK/WO hanya bisa dihapus procurement";
  if (!before || !after) return null;
  const changed = SPK_FIELDS.filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
  return changed.length > 0 ? `Field SPK (${changed.join(", ")}) hanya bisa diubah procurement` : null;
}
