"use client";

import { AnimatePresence, m } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { TABLE_BY_ID } from "@/data/tables";
import { cn } from "@/lib/format";
import { useDemoStore } from "@/store/demo-store";
import { FloorPlan } from "./FloorPlan";
import { ScreenShell } from "./ScreenShell";
import type { ScreenProps } from "./types";

const LEGEND = [
  { label: "Kosong", swatch: "bg-ink-700 ring-1 ring-sand-400/50" },
  { label: "Terisi", swatch: "bg-danger-400/20 ring-1 ring-danger-400/60" },
  { label: "Dipilih", swatch: "bg-ember-400" },
] as const;

export function TableScreen({ focusOnMount }: ScreenProps) {
  const tableId = useDemoStore((s) => s.tableId);
  const selectTable = useDemoStore((s) => s.selectTable);
  const goTo = useDemoStore((s) => s.goTo);
  const back = useDemoStore((s) => s.back);
  const table = tableId ? TABLE_BY_ID.get(tableId) : undefined;

  return (
    <ScreenShell
      title="Pilih meja"
      subtitle="Tap meja kosong pada denah"
      focusOnMount={focusOnMount}
      onBack={back}
      footer={
        <button
          type="button"
          onClick={() => goTo("summary")}
          aria-disabled={!table}
          className={cn(
            "flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition-[background-color,transform] duration-200 motion-safe:active:scale-[0.98]",
            table ? "bg-ember-400 text-ink-950 hover:bg-ember-300" : "bg-white/5 text-sand-400",
          )}
        >
          {table ? `Lanjut dengan Meja ${table.label}` : "Belum pilih meja"}
          <Icon name="arrowRight" className="size-4" />
        </button>
      }
    >
      <FloorPlan selectedId={tableId} onSelect={selectTable} />
      <ul className="mt-3 flex justify-center gap-4" aria-label="Keterangan denah">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5 text-xs text-sand-400">
            <span aria-hidden="true" className={cn("size-3 rounded-[4px]", l.swatch)} />
            {l.label}
          </li>
        ))}
      </ul>
      <div className="mt-3 min-h-14" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {table ? (
            <m.p
              key={table.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 rounded-2xl border border-ember-400/30 bg-ember-400/10 px-3 py-3 text-sm text-sand-50"
            >
              <Icon name="pin" className="size-4 text-ember-300" />
              Meja {table.label} dipilih · {table.seats} kursi
            </m.p>
          ) : (
            <m.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-white/10 px-3 py-3 text-center text-sm text-sand-400"
            >
              Belum ada meja dipilih.
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
