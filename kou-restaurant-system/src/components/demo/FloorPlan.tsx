"use client";

import { m, useReducedMotion } from "framer-motion";
import type { KeyboardEvent } from "react";
import { DINING_TABLES, FLOOR_VIEWBOX, type DiningTable } from "@/data/tables";
import { cn } from "@/lib/format";

/** Ukuran area sentuh (unit viewBox). Pada lebar layar demo ≈ 1:1 px → ≥ 44px. */
const HIT = 66;
const HIT_LONG = { w: 70, h: 124 };

function seatPositions(t: DiningTable): Array<{ cx: number; cy: number }> {
  if (t.shape === "round") {
    return [
      { cx: t.x, cy: t.y - 30 },
      { cx: t.x, cy: t.y + 30 },
    ];
  }
  if (t.shape === "square") {
    return [
      { cx: t.x, cy: t.y - 34 },
      { cx: t.x, cy: t.y + 34 },
      { cx: t.x - 34, cy: t.y },
      { cx: t.x + 34, cy: t.y },
    ];
  }
  return [-34, 0, 34].flatMap((dy) => [
    { cx: t.x - 32, cy: t.y + dy },
    { cx: t.x + 32, cy: t.y + dy },
  ]);
}

function tableAriaLabel(t: DiningTable, selected: boolean): string {
  const status = t.status === "occupied" ? "terisi" : selected ? "dipilih" : "kosong";
  return `Meja ${t.label}, ${t.seats} kursi, ${status}`;
}

interface TableNodeProps {
  table: DiningTable;
  selected: boolean;
  onSelect: (id: string) => void;
}

function TableNode({ table: t, selected, onSelect }: TableNodeProps) {
  const reduceMotion = useReducedMotion();
  const occupied = t.status === "occupied";
  const hitW = t.shape === "long" ? HIT_LONG.w : HIT;
  const hitH = t.shape === "long" ? HIT_LONG.h : HIT;

  const surface = cn(
    "transition-colors duration-200",
    selected ? "fill-ember-400 stroke-ember-200" : occupied ? "fill-danger-400/15 stroke-danger-400/60" : "fill-ink-700 stroke-sand-400/50 group-hover:fill-ink-600",
  );
  const seat = cn(
    "transition-colors duration-200",
    selected ? "fill-ember-300" : occupied ? "fill-danger-400/45" : "fill-sand-400/40 group-hover:fill-sand-400/70",
  );

  const handleKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(t.id);
    }
  };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={tableAriaLabel(t, selected)}
      aria-pressed={occupied ? undefined : selected}
      aria-disabled={occupied || undefined}
      onClick={() => onSelect(t.id)}
      onKeyDown={handleKey}
      className={cn("group outline-none", occupied ? "cursor-not-allowed" : "cursor-pointer")}
    >
      {/* Area sentuh transparan yang lebih besar dari mejanya */}
      <rect x={t.x - hitW / 2} y={t.y - hitH / 2} width={hitW} height={hitH} rx="14" fill="transparent" />
      {/* Ring fokus keyboard */}
      <rect
        x={t.x - hitW / 2 + 1}
        y={t.y - hitH / 2 + 1}
        width={hitW - 2}
        height={hitH - 2}
        rx="14"
        fill="none"
        strokeWidth="2"
        className="stroke-ember-300 opacity-0 group-focus-visible:opacity-100"
      />

      {selected && !reduceMotion && (
        <m.circle
          cx={t.x}
          cy={t.y}
          r={t.shape === "long" ? 44 : 30}
          fill="none"
          strokeWidth="2"
          className="stroke-ember-400"
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: 1.25, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      )}

      <m.g
        animate={{ scale: selected ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        {seatPositions(t).map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r="6" className={seat} />
        ))}
        {t.shape === "round" ? (
          <circle cx={t.x} cy={t.y} r="21" strokeWidth="1.5" className={surface} />
        ) : t.shape === "square" ? (
          <rect x={t.x - 24} y={t.y - 24} width="48" height="48" rx="10" strokeWidth="1.5" className={surface} />
        ) : (
          <rect x={t.x - 22} y={t.y - 52} width="44" height="104" rx="12" strokeWidth="1.5" className={surface} />
        )}
        <text
          x={t.x}
          y={t.y + 5}
          textAnchor="middle"
          className={cn("pointer-events-none select-none text-[14px] font-bold", selected ? "fill-ink-950" : occupied ? "fill-danger-400" : "fill-sand-50")}
        >
          {t.label}
        </text>
      </m.g>
    </g>
  );
}

interface FloorPlanProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FloorPlan({ selectedId, onSelect }: FloorPlanProps) {
  const { width, height } = FLOOR_VIEWBOX;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="group" aria-label="Denah meja. Pilih satu meja yang kosong.">
      {/* Dekorasi ruangan */}
      <g aria-hidden="true">
        <rect x="6" y="6" width={width - 12} height={height - 12} rx="20" className="fill-ink-800 stroke-white/10" strokeWidth="1.5" />
        <line x1="40" y1="8" x2="280" y2="8" strokeWidth="3" strokeDasharray="20 8" className="stroke-sky-300/30" />
        <text x={width / 2} y="26" textAnchor="middle" className="fill-sand-400 text-[9px] font-semibold tracking-[0.2em]">
          JENDELA
        </text>
        <rect x="22" y="336" width="160" height="40" rx="10" className="fill-ink-700/70 stroke-white/10" />
        <text x="102" y="360" textAnchor="middle" className="fill-sand-400 text-[11px] font-semibold">
          Kasir & Bar
        </text>
        <line x1="218" y1={height - 6} x2="294" y2={height - 6} strokeWidth="6" className="stroke-ink-950" />
        <text x="256" y="378" textAnchor="middle" className="fill-sand-400 text-[10px] font-semibold">
          Pintu masuk
        </text>
      </g>
      {DINING_TABLES.map((t) => (
        <TableNode key={t.id} table={t} selected={selectedId === t.id} onSelect={onSelect} />
      ))}
    </svg>
  );
}
