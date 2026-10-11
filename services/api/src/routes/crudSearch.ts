import type { Dialect } from "../db.js";

/** Predicate pencarian substring pada JSON row yang konsisten untuk kapitalisasi Unicode. */
export function searchContainsPredicate(dialect: Dialect): string {
  return dialect === "mysql"
    ? "LOCATE(LOWER(?), LOWER(data)) > 0"
    : "instr(unicode_lower(data), unicode_lower(?)) > 0";
}

/** Perbandingan nama JSON yang exact (hanya case-folded), bukan substring. */
export function exactJsonNamePredicate(dialect: Dialect): string {
  return dialect === "mysql"
    ? "CASE WHEN JSON_VALID(data) THEN BINARY LOWER(JSON_UNQUOTE(JSON_EXTRACT(data, '$.name'))) = BINARY LOWER(?) ELSE 0 END"
    : "CASE WHEN json_valid(data) THEN unicode_lower(json_extract(data, '$.name')) = unicode_lower(?) ELSE 0 END";
}

/** Perbandingan branch exact; MySQL BINARY menetralkan collation case/accent-insensitive. */
export function exactBranchPredicate(dialect: Dialect): string {
  return dialect === "mysql" ? "BINARY branch = BINARY ?" : "branch = ?";
}
