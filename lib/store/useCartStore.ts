import { create } from "zustand";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  client: string;
  phone: string;
  address: string;
  gps: string;
  channel: string;
  payment: string;
  applyIva: boolean;
  delivery: string;
  commission: string;
  tip: string;

  addItem: (item: CartItem, maxStock: number) => void;
  changeQty: (productId: string, delta: number, maxStock: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  loadFromSale: (data: {
    items: CartItem[];
    client: string;
    phone: string;
    address: string;
    gps: string;
    channel: string;
    delivery: number;
    commission: number;
    tip: number;
    applyIva: boolean;
  }) => void;

  setField: <K extends keyof CartState>(key: K, value: CartState[K]) => void;
}

const EMPTY_FORM = {
  client: "",
  phone: "",
  address: "",
  gps: "",
  channel: "Mostrador",
  payment: "Efectivo USD",
  applyIva: true,
  delivery: "",
  commission: "",
  tip: "",
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  ...EMPTY_FORM,

  addItem: (item, maxStock) => {
    const existing = get().items.find((i) => i.productId === item.productId);
    if (existing) {
      if (existing.qty >= maxStock) return;
      set({ items: get().items.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i)) });
    } else {
      set({ items: [...get().items, item] });
    }
  },

  changeQty: (productId, delta, maxStock) => {
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, maxStock)) } : i
      ),
    });
  },

  removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

  clear: () => set({ items: [], ...EMPTY_FORM }),

  loadFromSale: (data) =>
    set({
      items: data.items,
      client: data.client,
      phone: data.phone,
      address: data.address,
      gps: data.gps,
      channel: data.channel || "Mostrador",
      delivery: data.delivery ? String(data.delivery) : "",
      commission: data.commission ? String(data.commission) : "",
      tip: data.tip ? String(data.tip) : "",
      applyIva: data.applyIva,
    }),

  setField: (key, value) => set({ [key]: value } as Pick<CartState, typeof key>),
}));
