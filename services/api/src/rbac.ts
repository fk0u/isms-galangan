// rbac.ts sekarang mengalirkan implementasi ke policy.ts (ADR-0004 & F2-05)
export {
  ROLES,
  type Role,
  type Action,
  ROLE_RANK,
  roleRank,
  normalizeRole,
  MATRIX,
  can,
  permissionsFor,
  requirePermission,
  requireCollectionWrite,
  requireCollectionRead,
  requireCollectionDelete,
  requireManageUsers,
  requireSettingsWrite,
  requireAuditRead,
} from "./policy.js";

import { can } from "./policy.js";

export function canWriteCollection(role: unknown, collection: string): boolean {
  return can(role, collection, "w");
}
