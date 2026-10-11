"use client";

import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { HeroPhone } from "./HeroPhone";

/** Parallax ringan: glow & HP bergerak beda kecepatan saat scroll. Mati bila reduced motion. */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -60]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 80]);

  return (
    <div ref={ref} className="relative">
      <m.div
        aria-hidden="true"
        style={{ y: glowY }}
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-500/25 blur-[100px]"
      />
      <m.div style={{ y: phoneY }}>
        <HeroPhone />
      </m.div>
    </div>
  );
}
