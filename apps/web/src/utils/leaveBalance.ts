/* Saldo cuti tahunan. Hanya cuti jenis "Tahunan" yang sudah Disetujui yang
   memotong jatah; Sakit, Izin, Melahirkan, Cuti Besar, dan Unpaid tidak
   (catatan klien 17 Okt, K17-HR-02). Dipakai HR untuk tampilan & validasi. */
export const BALANCE_LEAVE_TYPE = "Tahunan";

export function leaveUsedByEmployee(leaves: readonly Record<string, unknown>[]): Map<string, number> {
  const used = new Map<string, number>();
  for (const l of leaves) {
    if (l.type !== BALANCE_LEAVE_TYPE || l.status !== "Disetujui") continue;
    const id = String(l.employeeId);
    used.set(id, (used.get(id) ?? 0) + (Number(l.days) || 0));
  }
  return used;
}

/** Apakah pengajuan jenis ini memotong saldo (dan perlu cek saldo cukup). */
export const reducesLeaveBalance = (type: string): boolean => type === BALANCE_LEAVE_TYPE;
