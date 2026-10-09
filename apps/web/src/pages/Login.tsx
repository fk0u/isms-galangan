import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Anchor, Lock, User, AlertCircle, ArrowRight, ArrowUpRight, Container, ShipWheel, Loader2 } from "lucide-react";
import { useAuth, demoUsers } from "../auth/auth";
import { useStore } from "../data/store";
import { useT } from "../i18n/LanguageContext";
import { n_misc } from "../i18n/n_misc";
import { toast } from "../components/ui";

/* Tanda registrasi di sudut kompartemen (Swiss industrial print). */
function Crosshair({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute h-4 w-4 text-navy-900 ${className}`} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

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
      {/* Panel kiri - poster industri */}
      <div className="relative hidden w-[52%] flex-col justify-between border-r-2 border-navy-900 p-10 lg:flex">
        <Crosshair className="left-4 top-4" />
        <Crosshair className="right-4 top-4" />
        <Crosshair className="bottom-4 left-4" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center bg-navy-900 text-white">
              <Anchor className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black uppercase leading-none tracking-[-0.03em] text-navy-900">ISMS Galangan</p>
              <p className="mono-label mt-1.5">Shipyard Management System</p>
            </div>
          </div>
          <div className="text-right font-mono text-[10.5px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-steel-600">
            <p className="flex items-center justify-end gap-1.5"><ShipWheel className="h-3.5 w-3.5" /> REV 2026.1</p>
            <p>UNIT / SMD-01</p>
            <p className="text-ocean-500">PT SYUKUR BERSAUDARA</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="mono-label mb-4 flex items-center gap-2">
            <Container className="h-3.5 w-3.5" /> [ New Build / Repair / Retrofit ]
          </p>
          <h1 className="display text-[clamp(3.5rem,7.2vw,7.5rem)]">
            Command
            <br />
            your
            <br />
            shipyard<span className="text-ocean-500">.</span>
          </h1>
          <div className="rule-accent mt-6 w-24" />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-steel-600">
            Integrated Shipbuilding Management System — 13 modul: proyek, drydock, inventori, QC,
            keuangan, dan siklus hidup kapal dalam satu sistem.
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
              <div key={s.l} className="p-4">
                <dd className="text-[28px] font-black leading-none tracking-[-0.04em] text-navy-900 tabular-nums">{s.v}</dd>
                <dt className="mono-label mt-2">{s.l}</dt>
              </div>
            ))}
          </dl>
          <div className="hazard-stripe mt-6 h-2.5 w-full" aria-hidden="true" />
          <div className="mt-4 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-steel-500">
            <p>© 2026 ISMS Galangan · Alenkosa</p>
            <p className="flex items-center gap-3">
              <span>ISO 9001</span>
              <span className="h-3 w-px bg-steel-400" />
              <span>ISM Code</span>
              <span className="h-3 w-px bg-steel-400" />
              <span>BKI Class</span>
            </p>
          </div>
        </div>
      </div>

      {/* Panel kanan - form */}
      <div className="relative flex flex-1 items-center justify-center bg-white p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-ocean-500" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center bg-navy-900 text-white">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black uppercase tracking-[-0.02em] text-navy-900">ISMS Galangan</p>
              <p className="mono-label mt-0.5">{t.auth.tagline}</p>
            </div>
          </div>

          <p className="mono-label flex items-center gap-2 text-ocean-600"><span className="inline-block h-2 w-2 bg-ocean-500" />{t.auth.continue}</p>
          <h2 className="display mt-2 text-[40px]">{t.auth.title}</h2>
          <p className="mt-2 text-sm text-steel-600">{t.auth.subtitle}</p>

          <motion.form
            key={shake}
            animate={shake > 0 ? { x: [0, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.35 }}
            onSubmit={submit}
            className="mt-6 space-y-4 border-2 border-navy-900 bg-white p-6"
          >
            {error && (
              <div className="flex items-start gap-2 border-l-4 border-ocean-500 bg-ocean-50 px-3 py-2.5 text-sm text-ocean-700">
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
              <p className="mono-label">{t.auth.demoTitle}</p>
              <div className="mt-3 space-y-2">
                {demoUsers.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => quickLogin(u.username)}
                    disabled={busy !== null}
                    className="group flex w-full items-center gap-2.5 border border-steel-300 px-3 py-2.5 text-left transition-colors hover:border-navy-900 hover:bg-steel-50 disabled:opacity-60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-navy-900 font-mono text-xs font-bold text-white">
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
