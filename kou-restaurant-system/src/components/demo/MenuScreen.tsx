"use client";

import { m } from "framer-motion";
import { useMemo, useState } from "react";
import { Icon, type IconKey } from "@/components/ui/Icon";
import { MENU_CATEGORIES, MENU_ITEMS, type MenuCategoryId, type MenuItem } from "@/data/menu";
import { getCartTotals } from "@/lib/cart";
import { cn, formatRupiah } from "@/lib/format";
import { useDemoStore } from "@/store/demo-store";
import { QuantityControl } from "./QuantityControl";
import { ScreenShell } from "./ScreenShell";
import type { ScreenProps } from "./types";

type Filter = MenuCategoryId | "semua";

const CATEGORY_ICON: Record<MenuCategoryId, IconKey> = {
  kopi: "coffee",
  "non-kopi": "soda",
  makanan: "utensils",
  camilan: "cookie",
};

const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [{ id: "semua", label: "Semua" }, ...MENU_CATEGORIES];

function MenuRow({ item }: { item: MenuItem }) {
  const quantity = useDemoStore((s) => s.cart[item.id] ?? 0);
  const addItem = useDemoStore((s) => s.addItem);
  const decrementItem = useDemoStore((s) => s.decrementItem);

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-2.5">
      <div
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ember-400/25 to-ember-950 text-ember-200"
      >
        <Icon name={CATEGORY_ICON[item.categoryId]} className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-sand-50">{item.name}</p>
        <p className="line-clamp-1 text-xs text-sand-400">{item.description}</p>
        <p className="mt-0.5 text-sm font-bold text-ember-300">{formatRupiah(item.price)}</p>
      </div>
      {item.soldOut ? (
        <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-sand-400">Habis</span>
      ) : quantity > 0 ? (
        <QuantityControl
          name={item.name}
          quantity={quantity}
          onIncrement={() => addItem(item.id)}
          onDecrement={() => decrementItem(item.id)}
        />
      ) : (
        <button
          type="button"
          onClick={() => addItem(item.id)}
          aria-label={`Tambah ${item.name} ke keranjang`}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ember-400 text-ink-950 transition-[background-color,transform] duration-150 hover:bg-ember-300 motion-safe:active:scale-90"
        >
          <Icon name="plus" className="size-5" strokeWidth={2.5} />
        </button>
      )}
    </li>
  );
}

function CartBar() {
  const cart = useDemoStore((s) => s.cart);
  const goTo = useDemoStore((s) => s.goTo);
  const { count, total } = useMemo(() => getCartTotals(cart), [cart]);
  const empty = count === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => goTo("table")}
        aria-disabled={empty}
        className={cn(
          "flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition-[background-color,transform] duration-200 motion-safe:active:scale-[0.98]",
          empty ? "bg-white/5 text-sand-400" : "bg-ember-400 text-ink-950 hover:bg-ember-300",
        )}
      >
        <span className="relative">
          <Icon name="bag" className="size-5" />
          {!empty && (
            <m.span
              key={count}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-ink-950 px-1 text-[10px] font-bold text-ember-300"
            >
              {count}
            </m.span>
          )}
        </span>
        <span className="flex-1 text-sm font-semibold">{empty ? "Keranjang kosong" : formatRupiah(total)}</span>
        <span className="flex items-center gap-1 text-sm font-bold">
          Pilih meja <Icon name="arrowRight" className="size-4" />
        </span>
      </button>
      <p className="sr-only" aria-live="polite">
        {empty ? "Keranjang kosong" : `${count} item di keranjang, total ${formatRupiah(total)}`}
      </p>
    </>
  );
}

export function MenuScreen({ focusOnMount }: ScreenProps) {
  const [filter, setFilter] = useState<Filter>("semua");
  const items = useMemo(
    () => (filter === "semua" ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.categoryId === filter)),
    [filter],
  );

  return (
    <ScreenShell title="Kafe Contoh" subtitle="Menu demo · harga contoh" focusOnMount={focusOnMount} footer={<CartBar />}>
      <div role="group" aria-label="Filter kategori menu" className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={cn(
                "relative min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                active ? "text-ink-950" : "text-sand-200 hover:text-sand-50",
              )}
            >
              {active && (
                <m.span
                  layoutId="menu-filter-pill"
                  className="absolute inset-0 rounded-full bg-ember-400"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              {!active && <span className="absolute inset-0 rounded-full bg-white/5 ring-1 ring-white/10" />}
              <span className="relative">{f.label}</span>
            </button>
          );
        })}
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-sand-400">Belum ada menu di kategori ini.</p>
      ) : (
        <ul className="space-y-2" aria-label="Daftar menu">
          {items.map((item) => (
            <MenuRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </ScreenShell>
  );
}
