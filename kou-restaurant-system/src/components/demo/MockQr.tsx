import { useMemo } from "react";

const MODULES = 29;
const FINDER = 7;

/** PRNG deterministik (mulberry32) supaya QR mock stabil untuk nominal yang sama. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inFinderZone(x: number, y: number): boolean {
  const near = (v: number, start: number) => v >= start && v < start + FINDER + 1;
  return (near(x, 0) && near(y, 0)) || (near(x, MODULES - FINDER - 1) && near(y, 0)) || (near(x, 0) && near(y, MODULES - FINDER - 1));
}

function inCenterZone(x: number, y: number): boolean {
  const c = Math.floor(MODULES / 2);
  return Math.abs(x - c) <= 4 && Math.abs(y - c) <= 2;
}

function finderPath(ox: number, oy: number): string {
  // Kotak luar 7x7, lubang 5x5 (evenodd), inti 3x3.
  return `M${ox} ${oy}h7v7h-7z M${ox + 1} ${oy + 1}v5h5v-5z M${ox + 2} ${oy + 2}h3v3h-3z`;
}

interface MockQrProps {
  seed: number;
  className?: string;
}

/**
 * QR PALSU untuk simulasi — bukan kode QRIS valid dan tidak bisa dipindai untuk bayar.
 */
export function MockQr({ seed, className }: MockQrProps) {
  const path = useMemo(() => {
    const rand = mulberry32(seed);
    let d = "";
    for (let y = 0; y < MODULES; y += 1) {
      for (let x = 0; x < MODULES; x += 1) {
        if (inFinderZone(x, y) || inCenterZone(x, y)) continue;
        if (rand() > 0.52) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return [d, finderPath(0, 0), finderPath(MODULES - FINDER, 0), finderPath(0, MODULES - FINDER)].join(" ");
  }, [seed]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg viewBox={`-2 -2 ${MODULES + 4} ${MODULES + 4}`} className="block h-full w-full" role="img" aria-label="Kode QR simulasi, bukan kode pembayaran asli">
        <rect x="-2" y="-2" width={MODULES + 4} height={MODULES + 4} rx="1.5" fill="#fff" />
        <path d={path} fill="#15110e" fillRule="evenodd" shapeRendering="crispEdges" />
      </svg>
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-ember-400 px-2 py-0.5 text-[10px] font-extrabold tracking-[0.18em] text-ink-950"
      >
        SIMULASI
      </span>
    </div>
  );
}
