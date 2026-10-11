/** Filter offline harus seketat API; branch kosong tidak diwariskan ke cabang mana pun. */
export function rowsInBranch<T>(rows: T[], branch: string): T[] {
  if (branch.trim() === "") return [];
  if (branch === "SEMUA") return rows;
  return rows.filter((row) => {
    if (typeof row !== "object" || row === null) return false;
    const rowBranch = (row as { branch?: unknown }).branch;
    return typeof rowBranch === "string" && rowBranch === branch;
  });
}

/** Backend-backed sessions remain hidden until /auth/me confirms current scope. */
export function initialBranchScope(backendConfigured: boolean, savedBranch: unknown): string {
  if (backendConfigured) return "";
  return typeof savedBranch === "string" && savedBranch.trim() !== "" ? savedBranch.trim() : "SEMUA";
}

/** Missing/invalid server scope fails closed instead of reusing a stale session claim. */
export function verifiedBranchScope(serverBranch: unknown): string {
  return typeof serverBranch === "string" ? serverBranch.trim() : "";
}
