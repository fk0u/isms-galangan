export interface EquipmentNotificationTarget {
  index: number;
  page: number;
}

/** Cari posisi target pada hasil Register yang sudah difilter dan diurutkan. */
export function findEquipmentNotificationTarget<T extends { id?: unknown }>(
  rows: readonly T[],
  ids: readonly string[],
  pageSize: number,
): EquipmentNotificationTarget | null {
  const index = rows.findIndex((row) => ids.includes(String(row.id ?? "")));
  if (index < 0) return null;
  return {
    index,
    page: Math.floor(index / Math.max(1, pageSize)) + 1,
  };
}
