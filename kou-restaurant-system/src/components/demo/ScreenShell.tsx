"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface ScreenShellProps {
  title: string;
  subtitle?: string;
  /** True setelah user berpindah layar — fokus dipindah ke judul untuk pembaca layar. */
  focusOnMount: boolean;
  onBack?: () => void;
  backDisabled?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

export function ScreenShell({ title, subtitle, focusOnMount, onBack, backDisabled, footer, children }: ScreenShellProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // preventScroll: jangan bikin halaman melompat saat transisi antar-layar.
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-14 shrink-0 items-center gap-2 px-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={backDisabled}
            aria-label="Kembali ke langkah sebelumnya"
            className="grid size-11 place-items-center rounded-full text-sand-200 transition-colors hover:bg-white/5 hover:text-sand-50 disabled:opacity-40"
          >
            <Icon name="chevronLeft" className="size-5" />
          </button>
        ) : (
          <span className="w-2" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <h3 ref={headingRef} tabIndex={-1} className="truncate font-display text-lg font-bold text-sand-50 outline-none">
            {title}
          </h3>
          {subtitle && <p className="truncate text-xs text-sand-400">{subtitle}</p>}
        </div>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
      {footer && <div className="shrink-0 border-t border-white/5 bg-ink-900/90 p-3 backdrop-blur">{footer}</div>}
    </div>
  );
}
