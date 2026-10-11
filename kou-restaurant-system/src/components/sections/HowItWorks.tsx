"use client";

import { m, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { HOW_STEPS } from "@/data/content";

export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  // Garis penghubung "tergambar" mengikuti scroll.
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  return (
    <Section id="cara-kerja" eyebrow="Cara kerja" title="Tiga langkah, dari duduk sampai lunas.">
      <ol ref={ref} className="relative grid gap-6 md:grid-cols-3 md:gap-8">
        {/* Garis penghubung: vertikal di mobile, horizontal di desktop */}
        <div aria-hidden="true" className="absolute bottom-8 left-7 top-8 w-px bg-white/10 md:left-[16%] md:right-[16%] md:top-7 md:bottom-auto md:h-px md:w-auto">
          <m.div
            className="h-full w-full origin-top bg-ember-400 md:hidden"
            style={{ scaleY: reduceMotion ? 1 : progress }}
          />
          <m.div
            className="hidden h-full w-full origin-left bg-ember-400 md:block"
            style={{ scaleX: reduceMotion ? 1 : progress }}
          />
        </div>
        {HOW_STEPS.map((s, i) => (
          <li key={s.id} className="relative">
            <Reveal delay={i * 0.12} className="flex gap-5 md:flex-col md:items-center md:text-center">
              <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-800 text-ember-300 ring-1 ring-ember-400/40 shadow-[0_0_40px_-10px_rgb(255_148_80/0.6)]">
                <Icon name={s.icon} className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ember-300">Langkah {i + 1}</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-sand-50">{s.title}</h3>
                <p className="mt-2 max-w-xs leading-relaxed text-sand-400">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
