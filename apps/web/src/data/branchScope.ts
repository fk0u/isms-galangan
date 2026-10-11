/** Filter offline harus seketat API; branch kosong tidak diwariskan ke cabang mana pun. */
export function rowsInBranch<T>(rows: T[], branch: string): T[] {
  if (branch === "SEMUA") return rows;
  return rows.filter((row) => {
    if (typeof row !== "object" || row === null) return false;
    const rowBranch = (row as { branch?: unknown }).branch;
    return typeof rowBranch === "string" && rowBranch === branch;
  });
}
