/* "Lihat sebagai peran" (demo RBAC). Server: routes/demoSwitch.ts.
 *
 * Token & sesi akun asal (direktur/developer) disimpan di sessionStorage saat
 * pertama berpindah, supaya perpindahan berikutnya dan "Kembali" selalu
 * memakai akun asal. Cache offline dibersihkan setiap pindah agar data peran
 * sebelumnya tidak ikut terlihat oleh peran yang haknya lebih sempit. */
import { apiFetch, getJwt, setJwt } from "../services/http";
import { purgeOfflineCache } from "../data/idb";
import type { PermissionsMap } from "./auth";

const SESSION_KEY = "isms.session";
const ORIGIN_KEY = "isms.demo.origin";

export interface DemoRole { role: string; name: string; username: string }

interface Origin { jwt: string; session: string }

function readOrigin(): Origin | null {
  try {
    const raw = sessionStorage.getItem(ORIGIN_KEY);
    return raw ? (JSON.parse(raw) as Origin) : null;
  } catch { return null; }
}

/** Sedang memakai akun peran demo (bukan akun asal). */
export function isImpersonating(): boolean {
  return readOrigin() !== null;
}

function authHeader(): Record<string, string> {
  const jwt = readOrigin()?.jwt ?? getJwt();
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

/** Peran yang boleh dipilih (kosong bila fitur mati / bukan direktur-developer). */
export async function fetchDemoRoles(): Promise<DemoRole[]> {
  const res = await apiFetch<{ enabled: boolean; roles: DemoRole[] }>("/api/auth/demo-switch", { headers: authHeader() });
  return res.enabled ? res.roles : [];
}

async function resetCacheFor(userId: string): Promise<void> {
  await purgeOfflineCache();
  try { localStorage.setItem("isms.cache.ownerUserId", userId); } catch { /* abaikan */ }
}

export async function switchToRole(role: string): Promise<void> {
  const res = await apiFetch<{ token: string; permissions: PermissionsMap; user: { id: string; username: string; name: string; role: string; branch: string; email: string } }>(
    "/api/auth/demo-switch",
    { method: "POST", body: JSON.stringify({ role }), headers: authHeader() },
  );
  if (!readOrigin()) {
    sessionStorage.setItem(ORIGIN_KEY, JSON.stringify({ jwt: getJwt() ?? "", session: sessionStorage.getItem(SESSION_KEY) ?? "" }));
  }
  const u = res.user;
  setJwt(res.token);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    id: u.id, name: u.name, role: u.role, email: u.email, username: u.username,
    initials: u.name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase(),
    loginAt: new Date().toISOString(), branch: u.branch || "SEMUA", permissions: res.permissions,
  }));
  await resetCacheFor(u.id);
  window.location.assign("/dashboard");
}

export async function restoreOriginal(): Promise<void> {
  const origin = readOrigin();
  if (!origin) return;
  setJwt(origin.jwt);
  sessionStorage.setItem(SESSION_KEY, origin.session);
  sessionStorage.removeItem(ORIGIN_KEY);
  let id = "";
  try {
    const sess = JSON.parse(origin.session) as { id?: string; username?: string };
    id = String(sess.id || sess.username || "");
  } catch { /* abaikan */ }
  await resetCacheFor(id);
  window.location.assign("/dashboard");
}
