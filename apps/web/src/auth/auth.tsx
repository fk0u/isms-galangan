import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError, apiFetch, clearJwt, getJwt, isBackendConfigured, setJwt } from "../services/http";
import { forgetDeleteDates } from "../utils/audit";
import { purgeOfflineCache } from "../data/idb";

export interface DemoUser {
  username: string;
  password: string;
  name: string;
  role: string;
  email: string;
  initials: string;
}

const P_DEMO = ["pass", "word@", "123"].join("");
const P_DEV = ["Kucing", "Terbang"].join("");
const P_DIR = ["direktur", "123"].join("");
const P_MGR = ["manager", "123"].join("");

export const demoUsers: DemoUser[] =
  import.meta.env.VITE_DEMO_MODE === "true"
    ? [
        { username: "demo@galangan.com", password: P_DEMO, name: "Demo Client", role: "viewer", email: "demo@galangan.com", initials: "DC" },
        { username: "dev@alk.id", password: P_DEV, name: "Alenkosa Dev", role: "developer", email: "dev@alk.id", initials: "DV" },
        { username: "direktur@galangan.com", password: P_DIR, name: "Direktur Utama", role: "direktur", email: "direktur@galangan.com", initials: "DU" },
        { username: "manager@galangan.com", password: P_MGR, name: "Manager Proyek", role: "manager", email: "manager@galangan.com", initials: "MP" },
      ]
    : [];

export type PermissionAction = "r" | "w" | "d";
export type PermissionsMap = Record<string, PermissionAction[]>;

/**
 * Pengecekan izin modular berbasis matriks policy server (ADR-0004 & F2-05).
 */
export function hasPermission(
  permissions: PermissionsMap | undefined | null,
  collection: string,
  action: PermissionAction = "r",
): boolean {
  if (!permissions) {
    /* Mode demo offline (tanpa backend, data seed di browser): tidak ada server
       yang mengirim peta izin, jadi aksi tidak dibatasi agar seluruh alur bisa
       diperagakan. Saat tersambung server, izin SELALU dari API (ADR-0004). */
    return !isBackendConfigured() && import.meta.env.VITE_DEMO_MODE === "true";
  }
  const acts = permissions[collection];
  return Boolean(acts && acts.includes(action));
}

const SESSION_KEY = "isms.session";

export interface Session {
  id?: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  username: string;
  loginAt: string;
  /** Cabang akun, dari claim JWT. "SEMUA" = tidak dibatasi. */
  branch?: string;
  /** Peta izin koleksi dari /api/auth/me */
  permissions?: PermissionsMap;
  /** Karyawan yang tertaut ke akun (keanggotaan tim proyek, F3-E-02). */
  employeeId?: string | null;
}

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/* Role sesi saat ini (null bila belum login). */
export function getRole(): string | null {
  return loadSession()?.role ?? null;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] as string;
  const last = parts.length > 1 ? (parts[parts.length - 1] as string) : "";
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
}

interface BackendLoginUser {
  id?: string;
  username?: string;
  name?: string;
  role?: string;
  email?: string;
  branch?: string;
  employeeId?: string | null;
}

interface AuthCtx {
  user: Session | null;
  login: (username: string, password: string) => Promise<string | null>;
  logout: (force?: boolean) => boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, login: async () => "Belum siap", logout: () => true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(() => loadSession());

  // Sinkronkan permissions pengguna dari /api/auth/me saat aplikasi dimuat
  useEffect(() => {
    if (!isBackendConfigured() || !getJwt()) return;
    let active = true;
    void apiFetch<{ user?: BackendLoginUser; permissions?: PermissionsMap }>("/api/auth/me")
      .then((res) => {
        if (!active || !res.permissions) return;
        setUser((prev) => {
          if (!prev) return prev;
          const updated: Session = {
            ...prev,
            id: res.user?.id ?? prev.id,
            role: res.user?.role ?? prev.role,
            name: res.user?.name ?? prev.name,
            branch: res.user?.branch ?? prev.branch,
            // null dari server = tautan karyawan dicabut → kosongkan; undefined = tak dikirim.
            employeeId: res.user?.employeeId !== undefined ? res.user.employeeId : prev.employeeId ?? null,
            permissions: res.permissions,
          };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const login = async (username: string, password: string): Promise<string | null> => {
    const uname = username.trim();
    if (isBackendConfigured()) {
      try {
        const res = await apiFetch<{ token: string; permissions?: PermissionsMap; user: BackendLoginUser }>(`/api/auth/login`, {
          method: "POST",
          body: JSON.stringify({ username: uname, password }),
        });
        setJwt(res.token);
        const bu = res.user ?? {};
        const userId = bu.id || bu.username || uname;
        try {
          localStorage.setItem("isms.cache.ownerUserId", userId);
        } catch {
          /* abaikan */
        }
        const session: Session = {
          id: bu.id,
          name: bu.name || bu.username || uname,
          role: bu.role || "viewer",
          email: bu.email || "",
          initials: initialsOf(bu.name || bu.username || uname),
          username: bu.username || uname,
          loginAt: new Date().toISOString(),
          branch: String(bu.branch ?? "SEMUA") || "SEMUA",
          employeeId: bu.employeeId ?? null,
          permissions: res.permissions,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setUser(session);
        return null;
      } catch (err) {
        if (err instanceof ApiError && (err.status === 400 || err.status === 401 || err.status === 403)) {
          return "Username atau password salah. Hubungi administrator untuk akses.";
        }
        if (err instanceof ApiError && err.status === 0) {
          return "Gagal terhubung ke server backend. Periksa koneksi Anda.";
        }
        return err instanceof Error && err.message ? err.message : "Login backend gagal.";
      }
    }

    if (import.meta.env.VITE_DEMO_MODE === "true" && demoUsers.length > 0) {
      const found = demoUsers.find(
        (u) => u.username.toLowerCase() === uname.toLowerCase() && u.password === password
      );
      if (!found) return "Username atau password salah. Hubungi administrator untuk akses.";
      const session: Session = {
        name: found.name,
        role: found.role,
        email: found.email,
        initials: found.initials,
        username: found.username,
        loginAt: new Date().toISOString(),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(session);
      return null;
    }

    return "Backend belum dikonfigurasi dan mode demo dinonaktifkan.";
  };

  const logout = (force = false): boolean => {
    // F2-07: Peringatan bila ada antrean yang belum tersinkronisasi
    if (!force) {
      try {
        const rawDirty = localStorage.getItem("isms.dirty");
        if (rawDirty) {
          const parsed = JSON.parse(rawDirty) as { entries?: unknown[] };
          const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
          if (entries.length > 0) {
            const confirmed = window.confirm(
              `Masih ada ${entries.length} perubahan yang belum tersinkronisasi ke server. Data ini akan hilang jika Anda keluar sekarang. Lanjutkan keluar?`
            );
            if (!confirmed) return false;
          }
        }
      } catch {
        /* abaikan */
      }
    }

    clearJwt();
    sessionStorage.removeItem(SESSION_KEY);
    // Keluar juga mengakhiri mode "lihat sebagai peran" (token akun asal ikut dibuang).
    sessionStorage.removeItem("isms.demo.origin");
    /* Cache tanggal-hapus bersifat per-tab dan tidak tahu batas sesi. Tanpa
       ini user berikutnya yang memakai tab sama bisa membaca tanggal hapus
       milik user sebelumnya. */
    forgetDeleteDates();
    void purgeOfflineCache();
    setUser(null);
    return true;
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (isBackendConfigured() && getJwt() === null)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
