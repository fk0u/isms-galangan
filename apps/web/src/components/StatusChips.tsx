import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

export interface StatusChipOption {
  value: string;
  label: string;
  count?: number;
}

/** Filter status berbentuk chip responsif dengan indikator pilihan beranimasi. */
export function StatusChips({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly StatusChipOption[];
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const instanceId = useId();
  const duration = reducedMotion ? 0 : 0.18;

  return (
    <div role="group" aria-label={ariaLabel} className={`flex max-w-full flex-wrap gap-1.5 ${className}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <motion.button
            key={option.value}
            type="button"
            layout={!reducedMotion}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`relative inline-flex min-h-10 items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 ${
              selected
                ? "border-navy-700 text-white"
                : "border-steel-200 bg-white text-steel-600 hover:bg-steel-100"
            }`}
            transition={{ duration, ease: "easeOut" }}
          >
            {selected && (
              <AnimatePresence initial={false}>
                <motion.span
                  key="selected-indicator"
                  layoutId={`status-chip-${instanceId}`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-navy-700"
                  initial={reducedMotion ? false : { opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration, ease: "easeOut" }}
                />
              </AnimatePresence>
            )}
            <span className="relative z-[1]">{option.label}</span>
            {option.count !== undefined && <span className="relative z-[1] tabular-nums opacity-80">{option.count}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
