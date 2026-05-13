import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartOptionItem {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  /** Precio adicional en centavos */
  extraPrice: number;
}

export interface CartItem {
  /** ID único en el carrito (productId + variantes hash) */
  cartItemId: string;
  productId: string;
  name: string;
  /** Precio base en centavos */
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  selectedOptions: CartOptionItem[];
}

interface CartState {
  tenantId: string | null;
  items: CartItem[];

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setTenantId: (id: string) => void;

  /** Subtotal en centavos */
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      items: [],

      addItem: (newItem) => {
        const quantity = newItem.quantity ?? 1;
        set((state) => {
          const existing = state.items.find(
            (i) => i.cartItemId === newItem.cartItemId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartItemId === newItem.cartItemId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...newItem, quantity }],
          };
        });
      },

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        })),

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      setTenantId: (id) => set({ tenantId: id }),

      subtotal: () =>
        get().items.reduce((total, item) => {
          const optionsExtra = item.selectedOptions.reduce(
            (sum, o) => sum + o.extraPrice,
            0
          );
          return total + (item.unitPrice + optionsExtra) * item.quantity;
        }, 0),

      itemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: "picky-cart",
      storage: createJSONStorage(() => localStorage),
      // Nunca persistir tokens — solo el carrito
      partialize: (state) => ({
        tenantId: state.tenantId,
        items: state.items,
      }),
    }
  )
);
