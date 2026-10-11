"use client";

import { AnimatePresence, m, type Variants } from "framer-motion";
import { useState, type ComponentType } from "react";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { stepIndex, useDemoStore, type DemoStep } from "@/store/demo-store";
import { ConfirmScreen } from "./ConfirmScreen";
import { MenuScreen } from "./MenuScreen";
import { PaymentScreen } from "./PaymentScreen";
import { Stepper } from "./Stepper";
import { SummaryScreen } from "./SummaryScreen";
import { TableScreen } from "./TableScreen";
import { Toast } from "./Toast";
import type { ScreenProps } from "./types";

const SCREENS: Record<DemoStep, ComponentType<ScreenProps>> = {
  menu: MenuScreen,
  table: TableScreen,
  summary: SummaryScreen,
  payment: PaymentScreen,
  confirm: ConfirmScreen,
};

const variants: Variants = {
  enter: (dir: number) => ({ x: dir * 36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -36, opacity: 0 }),
};

export function DemoApp() {
  const step = useDemoStore((s) => s.step);

  // Pola "adjust state during render": catat arah navigasi & apakah user sudah berinteraksi,
  // tanpa ref yang dimutasi saat render.
  const [nav, setNav] = useState<{ step: DemoStep; dir: number; moved: boolean }>({ step, dir: 1, moved: false });
  if (nav.step !== step) {
    setNav({ step, dir: stepIndex(step) >= stepIndex(nav.step) ? 1 : -1, moved: true });
  }

  const Screen = SCREENS[step];

  return (
    <PhoneFrame screenClassName="h-[680px] max-h-[82dvh] min-h-[560px]">
      <Stepper />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={nav.dir}>
          <m.div
            key={step}
            custom={nav.dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Screen focusOnMount={nav.moved} />
          </m.div>
        </AnimatePresence>
        <Toast />
      </div>
    </PhoneFrame>
  );
}
