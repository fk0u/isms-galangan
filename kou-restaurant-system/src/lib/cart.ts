import { MENU_BY_ID, type MenuItem } from "@/data/menu";

export type Cart = Readonly<Record<string, number>>;

export interface CartLine {
  item: MenuItem;
  quantity: number;
  subtotal: number;
}

/** Ubah map {id: qty} jadi baris keranjang. Id yang tak dikenal diabaikan. */
export function getCartLines(cart: Cart): CartLine[] {
  const lines: CartLine[] = [];
  for (const [id, quantity] of Object.entries(cart)) {
    const item = MENU_BY_ID.get(id);
    if (!item || quantity <= 0) continue;
    lines.push({ item, quantity, subtotal: item.price * quantity });
  }
  return lines;
}

export function getCartTotals(cart: Cart): { count: number; total: number } {
  let count = 0;
  let total = 0;
  for (const line of getCartLines(cart)) {
    count += line.quantity;
    total += line.subtotal;
  }
  return { count, total };
}
