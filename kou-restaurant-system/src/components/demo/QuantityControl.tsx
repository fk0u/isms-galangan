"use client";

import { AnimatePresence, m } from "framer-motion";
import { Icon } from "@/components/ui/Icon";

interface QuantityControlProps {
  name: string;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const btn =
  "grid size-11 place-items-center rounded-full text-sand-50 transition-[background-color,transform] duration-150 hover:bg-white/10 motion-safe:active:scale-90";

export function QuantityControl({ name, quantity, onIncrement, onDecrement }: QuantityControlProps) {
  return (
    <div className="flex items-center rounded-full bg-white/5 ring-1 ring-white/10">
      <button type="button" onClick={onDecrement} className={btn} aria-label={`Kurangi ${name}`}>
        <Icon name={quantity <= 1 ? "trash" : "minus"} className="size-4" />
      </button>
      <span className="relative grid w-6 place-items-center overflow-hidden text-sm font-bold tabular-nums" aria-label={`Jumlah ${quantity}`}>
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={quantity}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {quantity}
          </m.span>
        </AnimatePresence>
      </span>
      <button type="button" onClick={onIncrement} className={btn} aria-label={`Tambah ${name}`}>
        <Icon name="plus" className="size-4" />
      </button>
    </div>
  );
}
