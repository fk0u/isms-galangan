/** Data menu MOCK untuk demo. Semua nama & harga sintetis. */

export type MenuCategoryId = "kopi" | "non-kopi" | "makanan" | "camilan";

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: MenuCategoryId;
  soldOut?: boolean;
}

export const MENU_CATEGORIES: readonly MenuCategory[] = [
  { id: "kopi", label: "Kopi" },
  { id: "non-kopi", label: "Non-kopi" },
  { id: "makanan", label: "Makanan" },
  { id: "camilan", label: "Camilan" },
];

export const MENU_ITEMS: readonly MenuItem[] = [
  { id: "kopi-susu-aren", name: "Kopi Susu Gula Aren", description: "Espresso, susu segar, gula aren cair.", price: 22000, categoryId: "kopi" },
  { id: "americano", name: "Americano", description: "Espresso dan air, panas atau dingin.", price: 18000, categoryId: "kopi" },
  { id: "cappuccino", name: "Cappuccino", description: "Espresso dengan foam susu tebal.", price: 25000, categoryId: "kopi" },
  { id: "es-teh-leci", name: "Es Teh Leci", description: "Teh melati dingin dengan buah leci.", price: 15000, categoryId: "non-kopi" },
  { id: "matcha-latte", name: "Matcha Latte", description: "Matcha dan susu, manis ringan.", price: 26000, categoryId: "non-kopi" },
  { id: "cokelat-panas", name: "Cokelat Panas", description: "Cokelat pekat dengan susu hangat.", price: 22000, categoryId: "non-kopi", soldOut: true },
  { id: "nasi-goreng", name: "Nasi Goreng Kampung", description: "Telur ceplok, kerupuk, acar.", price: 28000, categoryId: "makanan" },
  { id: "mie-ayam", name: "Mie Ayam Jamur", description: "Mie kenyal, ayam kecap, jamur.", price: 24000, categoryId: "makanan" },
  { id: "ayam-geprek", name: "Ayam Geprek Sambal Matah", description: "Nasi putih, ayam krispi, sambal matah.", price: 27000, categoryId: "makanan" },
  { id: "kentang-goreng", name: "Kentang Goreng", description: "Renyah, dengan saus sambal.", price: 16000, categoryId: "camilan" },
  { id: "pisang-goreng", name: "Pisang Goreng Keju", description: "Pisang kepok, keju parut, susu.", price: 15000, categoryId: "camilan" },
  { id: "roti-bakar", name: "Roti Bakar Cokelat", description: "Roti tebal, mentega, cokelat.", price: 17000, categoryId: "camilan" },
];

/** Lookup O(1) by id — dipakai keranjang. */
export const MENU_BY_ID: ReadonlyMap<string, MenuItem> = new Map(MENU_ITEMS.map((item) => [item.id, item]));
