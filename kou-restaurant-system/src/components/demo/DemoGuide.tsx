"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";
import { DEMO_STEPS, stepIndex, useDemoStore } from "@/store/demo-store";

const HINTS: Record<(typeof DEMO_STEPS)[number]["id"], string> = {
  menu: "Pilih kategori, tambah menu ke keranjang. Coba juga tombol lanjut saat keranjang masih kosong.",
  table: "Tap meja kosong di denah. Meja merah sedang terisi dan tidak bisa dipilih.",
  summary: "Ubah jumlah atau hapus item, ganti meja kalau perlu.",
  payment: "Layar QRIS simulasi. Coba skenario berhasil maupun gagal.",
  confirm: "Pesanan tercatat lengkap dengan nomor meja dan kode pesanan.",
};

/** Panduan di samping frame HP — sinkron dengan langkah aktif di store. */
export function DemoGuide() {
  const step = useDemoStore((s) => s.step);
  const reset = useDemoStore((s) => s.reset);
  const current = stepIndex(step);

  return (
    <div className="glass rounded-3xl p-6">
      <ol className="space-y-1">
        {DEMO_STEPS.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <li
              key={s.id}
              className={cn(
                "flex gap-3 rounded-2xl p-3 transition-colors duration-300",
                active ? "bg-ember-400/10 ring-1 ring-ember-400/30" : "",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-300",
                  active ? "bg-ember-400 text-ink-950" : done ? "bg-ember-400/20 text-ember-300" : "bg-white/5 text-sand-400",
                )}
              >
                {done ? <Icon name="check" className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <div>
                <p className={cn("font-semibold", active ? "text-sand-50" : "text-sand-200")}>
                  {s.title}
                  {active && <span className="sr-only"> (langkah aktif)</span>}
                </p>
                {active && <p className="mt-1 text-sm leading-relaxed text-sand-400">{HINTS[s.id]}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-sand-200 ring-1 ring-white/10 transition-colors hover:bg-white/5 hover:text-sand-50"
      >
        <Icon name="rotate" className="size-4" /> Ulangi demo
      </button>
    </div>
  );
}
