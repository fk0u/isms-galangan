"use client";

import { LazyMotion, MotionConfig, domMax } from "framer-motion";
import type { ReactNode } from "react";

/**
 * LazyMotion + komponen `m` memangkas bundle framer-motion.
 * domMax dipakai karena demo butuh layout animation (layoutId).
 * reducedMotion="user" menghormati prefers-reduced-motion secara global.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
