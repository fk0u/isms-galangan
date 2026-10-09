import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Anchor, Lock, User, AlertCircle, ArrowRight, ArrowUpRight, Container, ShipWheel, Loader2 } from "lucide-react";
import { useAuth, demoUsers } from "../auth/auth";
import { useStore } from "../data/store";
import { useT } from "../i18n/LanguageContext";
import { n_misc } from "../i18n/n_misc";
import { toast } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const { resync } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  // busy: null | "auth" (menghubungi server) | "sync" (menarik data).
  // Bedakan "sedang proses" vs "jaringan mati" + cegah double-submit.
  const [busy, setBusy] = useState<null | "auth" | "sync">(null);
  const { t, locale } = useT();
  const S = n_misc[locale];

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
    setBusy("sync");
    await resync().catch(() => undefined);
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
      setBusy("sync");
      await resync().catch(() => undefined);
      setBusy(null);
      navigate(from, { replace: true });
    } else {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Panel kiri - identitas, tenang */}
      <div className="relative hidden w-[48%] flex-col justify-between border-r border-steel-200 bg-surface p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-500 text-white shadow-soft">
            <Anchor className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[-0.01em] text-navy-900">ISMS Galangan</p>
            <p className="text-xs text-steel-500">PT Syukur Bersaudara</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-steel-600 ring-1 ring-inset ring-steel-200">
            <ShipWheel className="h-3.5 w-3.5" /> v2026.1
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, transform: "translateY(8px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-lg"
        >
          <p className="inline-flex items-center gap-2 text-[13px] font-medium text-ocean-600">
            <Container className="h-4 w-4" /> New build · Repair · Retrofit
          </p>
          <h1 className="display mt-4 text-[44px] xl:text-[52px]">
            Seluruh galangan, dalam satu sistem<span className="text-ocean-500">.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-steel-500">
            Proyek, drydock, inventori, QC, keuangan, dan siklus hidup kapal — terhubung dan
            terpantau real-time.
          </p>
        </motion.div>

        <div>
          <dl className="grid-ruled grid-cols-4">
            {[
              { v: "13", l: "Modul" },
              { v: "120m", l: "Max dock" },
              { v: "52T", l: "Bollard pull" },
              { v: "24/7", l: "Yard ops" },
            ].map((s) => (
              <div key={s.l} className="px-4 py-3.5">
                <dd className="text-xl font-semibold tracking-[-0.02em] text-navy-900 tabular-nums">{s.v}</dd>
                <dt className="mt-0.5 text-xs text-steel-500">{s.l}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex items-center justify-between text-xs text-steel-400">
            <p>© 2026 ISMS Galangan</p>
            <p className="flex items-center gap-3">
              <span>ISO 9001</span>
              <span className="h-3 w-px bg-steel-300" />
              <span>ISM Code</span>
              <span className="h-3 w-px bg-steel-300" />
              <span>BKI Class</span>
            </p>
          </div>
        </div>
      </div>

      {/* Panel kanan - form */}
      <div className="relative flex flex-1 items-center justify-center bg-white p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-500 text-white">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold tracking-[-0.01em] text-navy-900">ISMS Galangan</p>
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
            className="mt-7 space-y-4 rounded-2xl border border-steel-200 bg-white p-6 shadow-md"
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
                  {busy === "auth" ? S.lgConnecting : S.lgSyncing}
                </>
              )}
            </button>
          </motion.form>

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
