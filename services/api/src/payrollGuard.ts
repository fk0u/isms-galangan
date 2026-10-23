/* #281: HR menghitung & menyetujui payroll, pembayaran (status Dibayar)
 * hanya oleh Keuangan. Finance/Pajak butuh menulis `employees` hanya untuk
 * memotong kasbon saat bayar, jadi field lain karyawan tetap wewenang HR. */
import { normalizeRole } from "./policy.js";

type Data = Record<string, unknown>;

export const PAYROLL_PAYERS = ["finance", "pajak", "direktur", "developer"];
const FINANCE_ROLES = ["finance", "pajak"];

export function payrollRoleError(table: string, before: Data | null, after: Data | null, role: unknown): string | null {
  const r = normalizeRole(role);
  if (table === "payroll" && after && String(after.status ?? "") === "Dibayar" && String(before?.status ?? "") !== "Dibayar" && !PAYROLL_PAYERS.includes(r)) {
    return "Pembayaran gaji hanya bisa dilakukan Keuangan";
  }
  if (table === "employees" && FINANCE_ROLES.includes(r)) {
    if (!before || !after) return "Keuangan tidak dapat menambah atau menghapus karyawan";
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter((k) => k !== "kasbon" && k !== "updatedAt" && JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
    if (changed.length > 0) return `Keuangan hanya boleh mengubah kasbon karyawan (bukan ${changed.join(", ")})`;
  }
  if (table === "payroll" && FINANCE_ROLES.includes(r)) {
    // Keuangan hanya mencatat pembayaran; komponen gaji tetap dihitung HR.
    if (!before || !after) return "Keuangan tidak dapat menambah atau menghapus payroll";
    const allowed = new Set(["status", "paidAt", "paidMethod", "paidRef", "kasbonPot", "deductions", "net", "updatedAt"]);
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter((k) => !allowed.has(k) && JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
    if (changed.length > 0) return `Keuangan hanya boleh mencatat pembayaran gaji (bukan ${changed.join(", ")})`;
    if (String(after.status ?? "") !== String(before.status ?? "") && !(before.status === "Disetujui" && after.status === "Dibayar")) {
      return "Keuangan hanya boleh membayar slip yang sudah disetujui HR";
    }
  }
  return null;
}
