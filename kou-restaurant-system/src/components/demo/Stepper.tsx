"use client";

import { m } from "framer-motion";
import { DEMO_STEPS, stepIndex, useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/format";

export function Stepper() {
  const step = useDemoStore((s) => s.step);
  const goTo = useDemoStore((s) => s.goTo);
  const current = stepIndex(step);
  const progress = current / (DEMO_STEPS.length - 1);

  return (
    <nav aria-label="Langkah demo" className="shrink-0 px-4 pb-1 pt-1">
      <div className="relative mb-2 h-1 overflow-hidden rounded-full bg-white/10">
        <m.div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-ember-400"
          initial={false}
          animate={{ scaleX: Math.max(progress, 0.04) }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <ol className="flex justify-between">
        {DEMO_STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          // Hanya langkah yang sudah dilewati yang bisa diklik (kecuali setelah selesai).
          const clickable = done && step !== "confirm";
          const label = (
            <span className={cn("text-[10px] font-semibold", active ? "text-ember-300" : done ? "text-sand-200" : "text-sand-400/80")}>
              {s.label}
            </span>
          );
          return (
            <li key={s.id} aria-current={active ? "step" : undefined}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => goTo(s.id)}
                  className="-mx-1 rounded-md px-1 py-0.5 underline-offset-2 hover:underline"
                  aria-label={`Kembali ke langkah ${s.label}`}
                >
                  {label}
                </button>
              ) : (
                <span className="block px-0 py-0.5">{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
