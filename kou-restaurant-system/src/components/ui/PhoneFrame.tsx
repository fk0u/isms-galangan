import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Tinggi tetap mencegah layout shift saat isi layar berganti. */
  screenClassName?: string;
}

export function PhoneFrame({ children, className, screenClassName }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[360px] rounded-[2.75rem] p-2.5",
        "bg-gradient-to-b from-white/15 to-white/5 shadow-[0_40px_120px_-30px_rgb(255_148_80/0.35),inset_0_1px_0_rgb(255_255_255/0.15)]",
        "ring-1 ring-white/10 backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[2.25rem] bg-ink-900 ring-1 ring-black/40",
          screenClassName,
        )}
      >
        {/* Status bar dekoratif */}
        <div aria-hidden="true" className="flex h-9 shrink-0 items-center justify-between px-6 text-[11px] font-semibold text-sand-200">
          <span>09.41</span>
          <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-[2px] bg-sand-200/80" />
            <span className="h-2.5 w-5 rounded-[3px] border border-sand-200/80 p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-sand-200/80" />
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
