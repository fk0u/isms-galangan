"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/format";

const AUTO_DISMISS_MS = 3200;

/** Notifikasi di dalam frame HP. Live region selalu ada agar pembaca layar menangkap perubahan. */
export function Toast() {
  const notice = useDemoStore((s) => s.notice);
  const dismiss = useDemoStore((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);

  return (
    <div aria-live="assertive" aria-atomic="true" className="pointer-events-none absolute inset-x-3 bottom-24 z-20 flex justify-center">
      <AnimatePresence>
        {notice && (
          <m.div
            key={notice.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-2 rounded-2xl border px-3 py-2.5 text-sm shadow-xl backdrop-blur-xl",
              notice.tone === "error" ? "border-danger-400/40 bg-[#2a1212]/95 text-sand-50" : "border-white/10 bg-ink-700/95 text-sand-50",
            )}
          >
            <Icon name="alert" className={cn("mt-0.5 size-4 shrink-0", notice.tone === "error" ? "text-danger-400" : "text-ember-300")} />
            <p className="flex-1">{notice.message}</p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Tutup notifikasi"
              className="-my-3 -mr-3 grid size-11 shrink-0 place-items-center rounded-full text-sand-400 hover:text-sand-50"
            >
              <Icon name="x" className="size-4" />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
