import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

function lineKey(productId: string, variantId: string | null): string {
  return `${productId}::${variantId ?? "default"}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = lineKey(item.productId, item.variantId);
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, id, quantity: item.quantity ?? 1 }],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "paws-cart",
      version: 2,
      migrate: (persisted, fromVersion) => {
        const state = persisted as { items?: CartItem[] } | undefined;
        if (!state?.items || fromVersion >= 2) return state ?? { items: [] };
        return {
          ...state,
          items: state.items.map((i) => ({
            ...i,
            id: lineKey(i.productId, i.variantId ?? null),
          })),
        };
      },
    }
  )
);
