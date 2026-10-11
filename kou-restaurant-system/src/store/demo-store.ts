import { create } from "zustand";
import { MENU_BY_ID } from "@/data/menu";
import { TABLE_BY_ID } from "@/data/tables";
import { getCartTotals, type Cart } from "@/lib/cart";

export type DemoStep = "menu" | "table" | "summary" | "payment" | "confirm";

export const DEMO_STEPS: ReadonlyArray<{ id: DemoStep; label: string; title: string }> = [
  { id: "menu", label: "Menu", title: "Pilih menu" },
  { id: "table", label: "Meja", title: "Pilih meja" },
  { id: "summary", label: "Ringkasan", title: "Ringkasan pesanan" },
  { id: "payment", label: "Bayar", title: "Bayar dengan QRIS" },
  { id: "confirm", label: "Selesai", title: "Pesanan diterima" },
];

export const stepIndex = (step: DemoStep): number => DEMO_STEPS.findIndex((s) => s.id === step);

export type PaymentStatus = "pending" | "processing" | "failed" | "paid";
export type NoticeTone = "info" | "error";

export interface Notice {
  id: number;
  message: string;
  tone: NoticeTone;
}

export interface CompletedOrder {
  code: string;
  tableId: string;
  cart: Cart;
  total: number;
}

const MAX_QTY_PER_ITEM = 20;

interface DemoState {
  step: DemoStep;
  cart: Cart;
  tableId: string | null;
  paymentStatus: PaymentStatus;
  notice: Notice | null;
  order: CompletedOrder | null;

  addItem: (id: string) => void;
  decrementItem: (id: string) => void;
  removeItem: (id: string) => void;
  selectTable: (id: string) => void;
  goTo: (step: DemoStep) => boolean;
  back: () => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  completeOrder: () => void;
  notify: (message: string, tone?: NoticeTone) => void;
  dismissNotice: () => void;
  reset: () => void;
}

type DemoData = Pick<DemoState, "step" | "cart" | "tableId" | "paymentStatus" | "notice" | "order">;

const initialData: DemoData = {
  step: "menu",
  cart: {},
  tableId: null,
  paymentStatus: "pending",
  notice: null,
  order: null,
};

/**
 * Aturan alur: kembalikan pesan error bila langkah belum boleh dibuka.
 * Dipusatkan di sini supaya tombol "lanjut" dan stepper memakai aturan yang sama.
 */
export function getStepBlocker(target: DemoStep, state: Pick<DemoState, "cart" | "tableId" | "order">): string | null {
  const { count } = getCartTotals(state.cart);
  const idx = stepIndex(target);
  if (target === "confirm" && !state.order) return "Selesaikan pembayaran dulu.";
  if (idx >= stepIndex("table") && count === 0) return "Keranjang masih kosong. Tambah minimal 1 menu dulu.";
  if (idx >= stepIndex("summary") && !state.tableId) return "Pilih meja dulu di denah.";
  return null;
}

let noticeSeq = 0;

function generateOrderCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `KOU-${n}`;
}

export const useDemoStore = create<DemoState>()((set, get) => ({
  ...initialData,

  addItem: (id) => {
    const item = MENU_BY_ID.get(id);
    if (!item) return get().notify("Menu tidak ditemukan.", "error");
    if (item.soldOut) return get().notify(`${item.name} sedang habis.`, "error");
    const current = get().cart[id] ?? 0;
    if (current >= MAX_QTY_PER_ITEM) return get().notify(`Maksimal ${MAX_QTY_PER_ITEM} porsi per menu.`, "error");
    set((s) => ({ cart: { ...s.cart, [id]: current + 1 } }));
  },

  decrementItem: (id) => {
    const current = get().cart[id] ?? 0;
    if (current <= 1) return get().removeItem(id);
    set((s) => ({ cart: { ...s.cart, [id]: current - 1 } }));
  },

  removeItem: (id) => {
    set((s) => {
      const next = { ...s.cart };
      delete next[id];
      return { cart: next };
    });
  },

  selectTable: (id) => {
    const table = TABLE_BY_ID.get(id);
    if (!table) return get().notify("Meja tidak ditemukan.", "error");
    if (table.status === "occupied") {
      return get().notify(`Meja ${table.label} sedang terisi. Pilih meja lain.`, "error");
    }
    // Tap meja yang sama lagi = batal pilih.
    set((s) => ({ tableId: s.tableId === id ? null : id }));
  },

  goTo: (step) => {
    const state = get();
    // Setelah pesanan selesai, satu-satunya jalan adalah ulangi demo.
    if (state.step === "confirm" && step !== "confirm") return false;
    const blocker = getStepBlocker(step, state);
    if (blocker) {
      state.notify(blocker, "error");
      return false;
    }
    set({ step, notice: null, paymentStatus: step === "payment" ? "pending" : state.paymentStatus });
    return true;
  },

  back: () => {
    const { step, paymentStatus } = get();
    if (paymentStatus === "processing") return;
    const prev = DEMO_STEPS[stepIndex(step) - 1];
    if (prev && step !== "confirm") set({ step: prev.id, notice: null });
  },

  setPaymentStatus: (paymentStatus) => set({ paymentStatus }),

  completeOrder: () => {
    const { cart, tableId } = get();
    if (!tableId) return get().notify("Pilih meja dulu di denah.", "error");
    const { total } = getCartTotals(cart);
    set({
      paymentStatus: "paid",
      order: { code: generateOrderCode(), tableId, cart, total },
      step: "confirm",
      notice: null,
    });
  },

  notify: (message, tone = "info") => {
    noticeSeq += 1;
    set({ notice: { id: noticeSeq, message, tone } });
  },

  dismissNotice: () => set({ notice: null }),

  reset: () => set({ ...initialData }),
}));
