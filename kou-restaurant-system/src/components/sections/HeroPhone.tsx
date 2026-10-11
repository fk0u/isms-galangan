"use client";

import { AnimatePresence, m, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type JSX } from "react";
import { Icon } from "@/components/ui/Icon";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { cn } from "@/lib/format";

const SCENES = ["menu", "meja", "bayar", "selesai"] as const;
type Scene = (typeof SCENES)[number];
const SCENE_LABEL: Record<Scene, string> = { menu: "Pilih menu", meja: "Pilih meja", bayar: "Bayar QRIS", selesai: "Selesai" };
const INTERVAL_MS = 2600;

function MenuScene() {
  const rows = [
    { name: "Kopi Susu Gula Aren", price: "Rp22.000", added: true },
    { name: "Nasi Goreng Kampung", price: "Rp28.000", added: false },
    { name: "Pisang Goreng Keju", price: "Rp15.000", added: false },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.name} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5">
          <div className="size-11 rounded-xl bg-gradient-to-br from-ember-400/30 to-ember-950" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-sand-50">{r.name}</p>
            <p className="text-xs font-bold text-ember-300">{r.price}</p>
          </div>
          <m.span
            initial={false}
            animate={r.added ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
            className={cn("grid size-8 place-items-center rounded-full", r.added ? "bg-ember-400 text-ink-950" : "bg-white/10 text-sand-200")}
          >
            <Icon name={r.added ? "check" : "plus"} className="size-4" strokeWidth={2.5} />
          </m.span>
        </div>
      ))}
      <m.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="flex items-center justify-between rounded-2xl bg-ember-400 px-4 py-3 text-sm font-bold text-ink-950"
      >
        <span>1 item · Rp22.000</span>
        <span>Pilih meja →</span>
      </m.div>
    </div>
  );
}

function TableScene() {
  const tables = [0, 1, 2, 3, 4, 5];
  const occupied = new Set([1, 4]);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.04] p-4">
        {tables.map((t) => {
          const isTarget = t === 3;
          return (
            <m.div
              key={t}
              initial={false}
              animate={isTarget ? { backgroundColor: ["#2a221c", "#ff9450"], scale: [1, 1.1, 1] } : {}}
              transition={{ delay: 0.6, duration: 0.4 }}
              className={cn(
                "grid aspect-square place-items-center rounded-xl text-sm font-bold",
                occupied.has(t) ? "bg-danger-400/15 text-danger-400 ring-1 ring-danger-400/50" : "bg-ink-700 text-sand-50 ring-1 ring-sand-400/40",
                isTarget && "text-ink-950",
              )}
            >
              {t + 1}
            </m.div>
          );
        })}
      </div>
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-3 rounded-2xl bg-ember-400/10 px-3 py-2.5 text-center text-sm text-sand-50 ring-1 ring-ember-400/30"
      >
        Meja 4 dipilih · 4 kursi
      </m.p>
    </div>
  );
}

function PayScene() {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sand-400">QRIS</p>
      <p className="font-display text-2xl font-bold text-sand-50">Rp22.000</p>
      <div className="relative mx-auto mt-3 grid size-36 grid-cols-6 gap-1 rounded-xl bg-white p-2.5">
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} className={cn("rounded-[2px]", (i * 7 + 3) % 5 < 3 ? "bg-ink-900" : "bg-transparent")} />
        ))}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-ember-400 px-1.5 text-[9px] font-extrabold tracking-widest text-ink-950">
          SIMULASI
        </span>
      </div>
      <m.div className="mx-auto mt-3 h-1 w-36 overflow-hidden rounded-full bg-white/10">
        <m.div
          className="h-full w-full origin-left bg-ember-400"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, ease: "linear" }}
        />
      </m.div>
    </div>
  );
}

function DoneScene() {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <m.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
        className="grid size-20 place-items-center rounded-full bg-ember-400/15 ring-1 ring-ember-400/40"
      >
        <Icon name="check" className="size-10 text-ember-300" strokeWidth={2.5} />
      </m.div>
      <p className="mt-4 font-display text-xl font-bold text-sand-50">Pesanan diterima</p>
      <p className="mt-1 text-sm text-sand-400">Meja 4 · Lunas via QRIS</p>
    </div>
  );
}

const SCENE_COMPONENT: Record<Scene, () => JSX.Element> = {
  menu: MenuScene,
  meja: TableScene,
  bayar: PayScene,
  selesai: DoneScene,
};

/** Mockup HP dekoratif di hero: memutar alur pesan otomatis saat terlihat di layar. */
export function HeroPhone() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Hemat CPU & hormati reduced motion: berhenti bila tak terlihat.
    if (!inView || reduceMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SCENES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [inView, reduceMotion]);

  const scene = SCENES[index] ?? "menu";
  const SceneView = SCENE_COMPONENT[scene];

  return (
    <div ref={ref} role="img" aria-label="Ilustrasi alur pemesanan: pilih menu, pilih meja, bayar QRIS, pesanan diterima.">
      <PhoneFrame screenClassName="h-[540px]" className="max-w-[300px]">
        <div aria-hidden="true" className="flex flex-1 flex-col px-4 pb-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-base font-bold text-sand-50">{SCENE_LABEL[scene]}</p>
            <div className="flex gap-1">
              {SCENES.map((s, i) => (
                <span key={s} className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-5 bg-ember-400" : "w-1.5 bg-white/20")} />
              ))}
            </div>
          </div>
          <div className="relative flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={scene}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <SceneView />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}
