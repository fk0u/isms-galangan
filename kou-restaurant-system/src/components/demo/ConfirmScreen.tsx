"use client";

import { m } from "framer-motion";
import { useMemo } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TABLE_BY_ID } from "@/data/tables";
import { getCartLines } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useDemoStore } from "@/store/demo-store";
import { ScreenShell } from "./ScreenShell";
import type { ScreenProps } from "./types";

export function ConfirmScreen({ focusOnMount }: ScreenProps) {
  const order = useDemoStore((s) => s.order);
  const reset = useDemoStore((s) => s.reset);
  const lines = useMemo(() => (order ? getCartLines(order.cart) : []), [order]);
  const table = order ? TABLE_BY_ID.get(order.tableId) : undefined;

  // Guard: seharusnya tak terjadi (store mencegah), tapi jangan render layar kosong.
  if (!order) {
    return (
      <ScreenShell title="Belum ada pesanan" focusOnMount={focusOnMount}>
        <div className="py-12 text-center">
          <p className="text-sm text-sand-400">Pesanan belum dibuat.</p>
          <button type="button" onClick={reset} className="mt-4 min-h-11 rounded-full bg-white/5 px-5 text-sm font-semibold ring-1 ring-white/10">
            Mulai dari menu
          </button>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Pesanan diterima"
      subtitle={`Kode ${order.code}`}
      focusOnMount={focusOnMount}
      footer={
        <div className="space-y-2">
          <ButtonLink href={buildWhatsAppUrl()} external variant="primary" className="w-full rounded-2xl">
            <Icon name="chat" className="size-4" /> Mau ini di kafemu? Tanya via WA
          </ButtonLink>
          <button
            type="button"
            onClick={reset}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-sand-200 hover:bg-white/5"
          >
            <Icon name="rotate" className="size-4" /> Ulangi demo
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center pt-2 text-center">
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="grid size-20 place-items-center rounded-full bg-ember-400/15 ring-1 ring-ember-400/40"
        >
          <svg viewBox="0 0 24 24" className="size-10 text-ember-300" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <m.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.15 }} />
          </svg>
        </m.div>
        <p className="mt-4 font-display text-xl font-bold text-sand-50">Terima kasih!</p>
        <p className="mt-1 text-sm text-sand-200">
          Pesanan untuk <strong>Meja {table?.label ?? "-"}</strong> sudah dibayar. Silakan tunggu di meja.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-sm">
        <div className="mb-2 flex justify-between text-xs text-sand-400">
          <span>Kode pesanan</span>
          <span className="font-mono font-semibold text-sand-50">{order.code}</span>
        </div>
        <ul className="space-y-1 border-t border-white/5 pt-2" aria-label="Item yang dipesan">
          {lines.map((l) => (
            <li key={l.item.id} className="flex justify-between gap-2">
              <span className="truncate text-sand-200">
                {l.quantity}× {l.item.name}
              </span>
              <span className="shrink-0 text-sand-200">{formatRupiah(l.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-white/5 pt-2 font-bold">
          <span>Total dibayar</span>
          <span className="text-ember-300">{formatRupiah(order.total)}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-sand-400">Ini simulasi — tidak ada pesanan atau pembayaran sungguhan.</p>
    </ScreenShell>
  );
}
