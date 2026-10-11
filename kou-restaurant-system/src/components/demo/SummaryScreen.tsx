"use client";

import { AnimatePresence, m } from "framer-motion";
import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { TABLE_BY_ID } from "@/data/tables";
import { getCartLines } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { useDemoStore } from "@/store/demo-store";
import { QuantityControl } from "./QuantityControl";
import { ScreenShell } from "./ScreenShell";
import type { ScreenProps } from "./types";

export function SummaryScreen({ focusOnMount }: ScreenProps) {
  const cart = useDemoStore((s) => s.cart);
  const tableId = useDemoStore((s) => s.tableId);
  const addItem = useDemoStore((s) => s.addItem);
  const decrementItem = useDemoStore((s) => s.decrementItem);
  const goTo = useDemoStore((s) => s.goTo);
  const back = useDemoStore((s) => s.back);

  const lines = useMemo(() => getCartLines(cart), [cart]);
  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const table = tableId ? TABLE_BY_ID.get(tableId) : undefined;
  const empty = lines.length === 0;

  return (
    <ScreenShell
      title="Ringkasan pesanan"
      subtitle="Cek lagi sebelum bayar"
      focusOnMount={focusOnMount}
      onBack={back}
      footer={
        empty ? undefined : (
          <button
            type="button"
            onClick={() => goTo("payment")}
            className="flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl bg-ember-400 px-4 text-sm font-bold text-ink-950 transition-[background-color,transform] duration-200 hover:bg-ember-300 motion-safe:active:scale-[0.98]"
          >
            <span>Bayar dengan QRIS</span>
            <span>{formatRupiah(total)}</span>
          </button>
        )
      }
    >
      {empty ? (
        // Empty state: keranjang dikosongkan dari halaman ringkasan.
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <span className="mb-4 grid size-16 place-items-center rounded-full bg-white/5 text-sand-400">
            <Icon name="bag" className="size-7" />
          </span>
          <p className="font-semibold text-sand-50">Keranjang kosong</p>
          <p className="mt-1 text-sm text-sand-400">Tambah menu dulu sebelum lanjut bayar.</p>
          <button
            type="button"
            onClick={() => goTo("menu")}
            className="mt-5 min-h-11 rounded-full bg-white/5 px-5 text-sm font-semibold text-sand-50 ring-1 ring-white/10 hover:bg-white/10"
          >
            Kembali ke menu
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2">
            <p className="flex items-center gap-2 text-sm">
              <Icon name="pin" className="size-4 text-ember-300" />
              {table ? (
                <span>
                  Meja <strong className="text-sand-50">{table.label}</strong>
                  <span className="text-sand-400"> · {table.seats} kursi</span>
                </span>
              ) : (
                <span className="text-danger-400">Belum pilih meja</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => goTo("table")}
              className="min-h-11 rounded-full px-3 text-sm font-semibold text-ember-300 hover:bg-white/5"
            >
              Ubah
            </button>
          </div>

          <ul className="space-y-2" aria-label="Item pesanan">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <m.li
                  key={line.item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-sand-50">{line.item.name}</p>
                      <p className="text-xs text-sand-400">
                        {formatRupiah(line.item.price)} × {line.quantity} ={" "}
                        <span className="font-semibold text-sand-200">{formatRupiah(line.subtotal)}</span>
                      </p>
                    </div>
                    <QuantityControl
                      name={line.item.name}
                      quantity={line.quantity}
                      onIncrement={() => addItem(line.item.id)}
                      onDecrement={() => decrementItem(line.item.id)}
                    />
                  </div>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>

          <dl className="mt-4 space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-sm">
            <div className="flex justify-between text-sand-400">
              <dt>Jumlah item</dt>
              <dd>{lines.reduce((n, l) => n + l.quantity, 0)}</dd>
            </div>
            <div className="flex justify-between font-bold text-sand-50">
              <dt>Total</dt>
              <dd className="text-ember-300">{formatRupiah(total)}</dd>
            </div>
          </dl>
        </>
      )}
    </ScreenShell>
  );
}
