export type CacheOwnerAction = "defer" | "hydrate" | "purge";

/** Cache offline hanya boleh dibaca untuk akun yang tepat; tanpa sesi, tunggu login. */
export function cacheOwnerAction(currentUserId: string | null, storedOwnerId: string | null): CacheOwnerAction {
  if (!currentUserId) return "defer";
  return currentUserId === storedOwnerId ? "hydrate" : "purge";
}
