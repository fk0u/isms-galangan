import type { Dialect } from "../db.js";

/** Predicate pencarian substring pada JSON row yang bekerja konsisten untuk kapitalisasi. */
export function searchContainsPredicate(dialect: Dialect): string {
  return dialect === "mysql"
    ? "LOCATE(LOWER(?), LOWER(data)) > 0"
    : "instr(lower(data), lower(?)) > 0";
}
