/* Panduan demo presentasi: tombol mengambang + panel skenario.
 *
 * - Shift + D membuka/menutup panel dari mana saja (kecuali saat mengetik).
 * - Tombol bisa disembunyikan; pintasan keyboard tetap bekerja.
 * - Progres langkah per skenario disimpan di localStorage (per perangkat).
 *
 * Gerak (Emil Kowalski): panel muncul dari arah tombol (origin kanan-bawah),
 * scale 0.96 + opacity, ease-out kuat 200ms, keluar lebih cepat; tombol
 * mengecil saat ditekan. Pintasan keyboard membuka TANPA animasi karena
 * aksi keyboard berulang tidak boleh terasa lambat. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, EyeOff, Eye, Play, RotateCcw, X } from "lucide-react";
import { useT } from "../i18n/LanguageContext";
import { demoScenarios, n_demo } from "../i18n/n_demo";
import { toast } from "./ui";

const KEY_HIDDEN = "isms.demo.hidden";
const KEY_PROGRESS = "isms.demo.progress";
const KEY_SCENARIO = "isms.demo.scenario";
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage penuh/terkunci: abaikan */ }
}

/** Pintasan tidak boleh mencuri huruf saat pengguna mengetik di form. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export default function DemoGuide() {
  const { locale } = useT();
  const T = n_demo[locale];
  const scenarios = useMemo(() => demoScenarios(locale), [locale]);
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<boolean>(() => readJson(KEY_HIDDEN, false));
  const [scenarioId, setScenarioId] = useState<string | null>(() => readJson<string | null>(KEY_SCENARIO, null));
  const [progress, setProgress] = useState<Record<string, number[]>>(() => readJson(KEY_PROGRESS, {}));
  /* Dibuka lewat keyboard → tanpa animasi masuk. */
  const [instant, setInstant] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => writeJson(KEY_HIDDEN, hidden), [hidden]);
  useEffect(() => writeJson(KEY_PROGRESS, progress), [progress]);
  useEffect(() => writeJson(KEY_SCENARIO, scenarioId), [scenarioId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) { setOpen(false); return; }
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && (e.code === "KeyD" || e.key === "D" || e.key === "d") && !isTyping(e.target)) {
        e.preventDefault();
        setInstant(true);
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* Klik di luar panel menutupnya (tombol pemicu dikecualikan). */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest?.("[data-demo-fab]")) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? null;
  const doneOf = (id: string) => progress[id] ?? [];

  const goStep = useCallback((sid: string, idx: number, to: string) => {
    setProgress((p) => {
      const cur = new Set(p[sid] ?? []);
      cur.add(idx);
      return { ...p, [sid]: [...cur].sort((a, b) => a - b) };
    });
    navigate(to, { state: { from: location.pathname } });
  }, [navigate, location.pathname]);

  const hideButton = () => {
    setHidden(true);
    setOpen(false);
    toast(T.hidden, "info");
  };

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: instant ? false : { opacity: 0, transform: "translateY(6px) scale(0.96)" },
        animate: { opacity: 1, transform: "translateY(0px) scale(1)", transition: { duration: 0.2, ease: EASE_OUT } },
        exit: { opacity: 0, transform: "translateY(4px) scale(0.98)", transition: { duration: 0.12, ease: EASE_OUT } },
      };

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 print:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={T.title}
            {...panelMotion}
            style={{ transformOrigin: "bottom right" }}
            className="pointer-events-auto flex max-h-[min(78vh,640px)] w-full flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-lift sm:w-[380px]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-steel-100 px-4 py-3.5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-navy-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ocean-500 text-white"><Play className="h-3.5 w-3.5" /></span>
                  {T.title}
                </p>
                <p className="mt-1 text-[12.5px] text-steel-500">
                  {T.subtitle} · <kbd className="rounded border border-steel-200 bg-steel-50 px-1 font-sans text-[11px] text-steel-600">{T.shortcut}</kbd> {T.shortcutHint}
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label={T.close} className="rounded-lg p-1.5 text-steel-400 transition-colors hover:bg-steel-100 hover:text-navy-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {!scenario ? (
                <>
                  <p className="px-2 pb-1 pt-1 text-xs font-medium text-steel-400">{T.scenarios}</p>
                  <ul className="space-y-1">
                    {scenarios.map((s, i) => {
                      const done = doneOf(s.id).length;
                      const complete = done >= s.steps.length;
                      return (
                        <li key={s.id}>
                          <button
                            onClick={() => setScenarioId(s.id)}
                            className="group flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-steel-50 active:scale-[0.99]"
                          >
                            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${complete ? "bg-emerald-500 text-white" : "bg-steel-100 text-navy-800"}`}>
                              {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-navy-900">{s.title}</span>
                              <span className="mt-0.5 block text-[12.5px] text-steel-500">{s.summary}</span>
                              <span className="mt-1 block text-[11.5px] text-steel-400">
                                {T.minutes.replace("{n}", String(s.minutes))} · {T.progress.replace("{a}", String(Math.min(done, s.steps.length))).replace("{b}", String(s.steps.length))}
                              </span>
                            </span>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-steel-300 transition-colors group-hover:text-navy-800" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <>
                  <button onClick={() => setScenarioId(null)} className="mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-steel-500 transition-colors hover:text-navy-900">
                    <ArrowLeft className="h-3.5 w-3.5" /> {T.back}
                  </button>
                  <div className="px-2 pb-2">
                    <p className="text-[15px] font-semibold text-navy-900">{scenario.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-steel-500">{scenario.summary}</p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-steel-100">
                      <div
                        className="h-full rounded-full bg-ocean-500 transition-[width] duration-300 ease-out"
                        style={{ width: `${Math.round((Math.min(doneOf(scenario.id).length, scenario.steps.length) / scenario.steps.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <ol className="space-y-1">
                    {scenario.steps.map((st, idx) => {
                      const isDone = doneOf(scenario.id).includes(idx);
                      return (
                        <li key={idx}>
                          <button
                            onClick={() => goStep(scenario.id, idx, st.to)}
                            className="group flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-steel-50 active:scale-[0.99]"
                          >
                            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${isDone ? "bg-emerald-500 text-white" : "bg-steel-100 text-navy-800"}`}>
                              {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-navy-900">{st.title}</span>
                              <span className="mt-0.5 block text-[12.5px] leading-snug text-steel-500">{st.hint}</span>
                            </span>
                            <span className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[12px] font-medium text-ocean-600 transition-colors group-hover:bg-ocean-50">
                              {T.open}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-steel-100 bg-steel-50/70 px-3 py-2">
              <button
                onClick={() => (scenario ? setProgress((p) => ({ ...p, [scenario.id]: [] })) : setProgress({}))}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] text-steel-500 transition-colors hover:bg-white hover:text-navy-900"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {T.reset}
              </button>
              <button
                onClick={() => (hidden ? setHidden(false) : hideButton())}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] text-steel-500 transition-colors hover:bg-white hover:text-navy-900"
              >
                {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {hidden ? T.show : T.hide}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hidden && (
        <button
          data-demo-fab
          onClick={() => { setInstant(false); setOpen((v) => !v); }}
          aria-label={T.fabAria}
          aria-expanded={open}
          title={T.fabAria}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-navy-900 py-2.5 pl-3 pr-4 text-sm font-medium text-white shadow-lift transition-[transform,background-color] duration-150 ease-out hover:bg-navy-700 active:scale-[0.97]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ocean-500">
            {open ? <X className="h-3 w-3" /> : <Play className="h-3 w-3 translate-x-[0.5px]" />}
          </span>
          {T.fab}
          <kbd className="hidden rounded border border-white/20 px-1 font-sans text-[10.5px] text-white/70 sm:inline">⇧D</kbd>
        </button>
      )}
    </div>
  );
}
