"use client";

import { m, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  y?: number;
}

/**
 * Fade + geser saat masuk viewport, sekali saja.
 * MotionConfig reducedMotion="user" di Providers otomatis mematikan geseran.
 */
export function Reveal({ children, delay = 0, y = 20, ...rest }: RevealProps) {
  return (
    <m.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </m.div>
  );
}
