import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { fetchLoginRoles, loginAsRole, type LoginRole } from "../auth/demoSwitch";
import { isBackendConfigured } from "../services/http";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User, AlertCircle, ArrowRight, ArrowUpRight, Container, ShipWheel, Loader2 } from "lucide-react";
import { useAuth, demoUsers } from "../auth/auth";
import { useT } from "../i18n/LanguageContext";
import { n_misc } from "../i18n/n_misc";
import { toast } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  // Mencegah double-submit selama autentikasi; sinkronisasi dilakukan per modul.
  const [busy, setBusy] = useState<null | "auth">(null);
  const { t, locale } = useT();
  const S = n_misc[locale];

  /* Pilihan peran untuk presentasi (permintaan 14 Okt): hanya muncul bila
     server mengaktifkan DEMO_LOGIN_PAGE. */
  const [loginRoles, setLoginRoles] = useState<LoginRole[]>([]);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  useEffect(() => {
    if (!isBackendConfigured()) return;
    let alive = true;
    void fetchLoginRoles().then((r) => { if (alive) setLoginRoles(r); });
    return () => { alive = false; };
  }, []);
  // Satu klik pada tombol peran = langsung masuk (catatan CTO 14 Okt).
  const enterAsRole = async (role: string) => {
    if (roleBusy) return;
    setRoleBusy(role);
    setError(null);
    try {
      await loginAsRole(role, from);
    } catch (e) {
      setRoleBusy(null);
      fail(e instanceof Error ? e.message : t.auth.roleLoginFail);
    }
  };

  const fail = (message: string) => {
    setError(message);
    setShake((s) => s + 1);
  };

  const registerFail = (message: string) => {
    const n = fails + 1;
    setFails(n);
    if (n >= 5) {
      setLockedUntil(Date.now() + 30000);
      fail(t.auth.lockedOut);
    } else {
      fail(message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const now = Date.now();
    if (now < lockedUntil) {
      const s = Math.ceil((lockedUntil - now) / 1000);
      fail(S.lgLockedCountdown.replace("{a}", t.auth.lockedOut).replace("{n}", String(s)));
      return;
    }
    const uname = username.trim();
    if (uname.length < 3 || /\s/.test(uname)) {
      fail(t.auth.fillUsername);
      return;
    }
    setError(null);
    setBusy("auth");
    const err = await login(username, password);
    if (err) {
      setBusy(null);
      registerFail(err);
      return;
    }
    setFails(0);
    setLockedUntil(0);
    toast(t.auth.welcome);
    setBusy(null);
    navigate(from, { replace: true });
  };

  const quickLogin = async (u: string) => {
    if (busy) return;
    if (Date.now() < lockedUntil) {
      fail(t.auth.lockedOut);
      return;
    }
    setError(null);
    setBusy("auth");
    const found = demoUsers.find((x) => x.username.toLowerCase() === u.toLowerCase());
    const err = await login(u, found?.password ?? "");
    if (!err) {
      setFails(0);
      setLockedUntil(0);
      toast(`${t.auth.asUser} ${found?.name ?? t.auth.demoAccount}`);
      setBusy(null);
      navigate(from, { replace: true });
    } else {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Panel kiri - bidang merah merek (bukan putih datar, catatan CTO 14 Okt).
          ocean-600 dengan teks putih = kontras 6,1:1. Pola garis & cahaya radial
          hanya dekorasi (aria-hidden), tidak bergerak. */}
      <div className="relative hidden h-dvh w-[46%] flex-col justify-between overflow-hidden bg-ocean-600 p-12 text-white lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.25),transparent_65%)]" />
        <ShipWheel aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-[26rem] w-[26rem] text-white/[0.06]" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10">
            <img src="/logo-sb.png" alt="Logo perusahaan" width={36} height={36} className="h-9 w-9 object-contain" />
          </span>
          <div>
            <p className="text-base font-bold tracking-[-0.01em]">ISMS Galangan</p>
            <p className="text-sm text-white/90">PT Syukur Bersaudara</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
            <ShipWheel className="h-3.5 w-3.5" /> v2026.1
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, transform: "translateY(8px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative max-w-lg"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[13px] font-medium ring-1 ring-inset ring-white/25">
            <Container className="h-4 w-4" /> New build · Repair · Retrofit
          </p>
          <h1 className="mt-5 text-[44px] font-bold leading-[1.05] tracking-[-0.03em] xl:text-[54px]">
            Seluruh galangan, dalam satu sistem.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/90">
            Proyek, drydock, inventori, QC, keuangan, dan siklus hidup kapal terhubung serta
            terpantau real-time.
          </p>
        </motion.div>

        <p className="relative text-xs text-white/90">© 2026 PT Syukur Bersaudara</p>
      </div>

      {/* Panel kanan - form */}
      <div className="relative flex h-dvh flex-1 justify-center overflow-y-auto overflow-x-hidden bg-surface px-6 py-10">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(230,25,25,0.08),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative my-auto w-full max-w-md"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src="/logo-sb.png" alt="Logo perusahaan" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
            <div>
              <p className="font-semibold tracking-[-0.01em] text-navy-900">ISMS PT Syukur Bersaudara</p>
              <p className="text-xs text-steel-500">{t.auth.tagline}</p>
            </div>
          </div>

          <h2 className="display text-[28px]">{t.auth.title}</h2>
          <p className="mt-1.5 text-sm text-steel-500">{t.auth.subtitle}</p>

          <motion.form
            key={shake}
            animate={shake > 0 ? { x: [0, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.35 }}
            onSubmit={submit}
            className="mt-7 space-y-4 rounded-2xl border border-steel-200 bg-white p-6 shadow-[0_20px_40px_-18px_rgba(9,9,11,0.18)]"
          >
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-ocean-50 px-3 py-2.5 text-sm text-ocean-700 ring-1 ring-inset ring-ocean-600/15">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <label className="block">
              <span className="label">{t.auth.username}</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
                <input
                  className="input pl-9"
                  placeholder={t.auth.usernamePh}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={busy !== null}
                />
              </div>
            </label>
            <label className="block">
              <span className="label">{t.auth.password}</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
                <input
                  type="password"
                  className="input pl-9"
                  placeholder={t.auth.passwordPh}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={busy !== null}
                />
              </div>
            </label>
            <button type="submit" className="btn-primary-gradient w-full justify-center py-2.5" disabled={busy !== null}>
              {busy === null ? (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {S.lgConnecting}
                </>
              )}
            </button>
          </motion.form>

          {loginRoles.length > 0 && (
            <div className="mt-5 rounded-2xl border border-steel-200 bg-white p-5 shadow-[0_20px_40px_-18px_rgba(9,9,11,0.18)]">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-navy-900">
                <UserCog className="h-5 w-5 text-ocean-600" /> {t.auth.roleLoginTitle}
              </p>
              <p className="mt-1 text-xs text-steel-500">{t.auth.roleLoginHint}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {loginRoles.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => void enterAsRole(r.role)}
                    disabled={roleBusy !== null}
                    className="group flex min-h-12 items-center gap-2.5 rounded-xl border border-steel-200 bg-white px-3 py-2 text-left transition-[background-color,border-color,transform] duration-150 hover:border-ocean-300 hover:bg-ocean-50 active:scale-[0.98] disabled:opacity-60 motion-reduce:transform-none"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-600 text-xs font-bold text-white">
                      {roleBusy === r.role ? <Loader2 className="h-4 w-4 animate-spin" /> : r.name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy-900">{r.name}</span>
                      <span className="block truncate text-xs capitalize text-steel-500">{r.role}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-steel-400 transition-colors group-hover:text-ocean-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {demoUsers.length > 0 && (
            <div className="card mt-4 p-5">
              <p className="text-[13px] font-medium text-steel-500">{t.auth.demoTitle}</p>
              <div className="mt-3 space-y-2">
                {demoUsers.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => quickLogin(u.username)}
                    disabled={busy !== null}
                    className="group flex w-full items-center gap-2.5 rounded-xl border border-steel-200 px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-steel-300 hover:bg-steel-50 active:scale-[0.99] disabled:opacity-60"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                      {u.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-navy-900">{u.name}</span>
                      <span className="block truncate text-[11px] text-steel-500">
                        {u.role} · <span className="font-mono">{u.username}</span>
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-steel-300 transition-colors group-hover:text-ocean-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
