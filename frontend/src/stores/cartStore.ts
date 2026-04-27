import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ItemCarrito } from '@/types';

interface CartState {
  items: ItemCarrito[];
  addItem: (item: ItemCarrito) => void;
  setItemStockDisponible: (productoId: string, stockDisponible: number) => void;
  removeItem: (productoId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => set((state) => {
        const itemWithNumberPrice = { ...newItem, precioUnitario: Number(newItem.precioUnitario) };
        const existing = state.items.find(i => i.productoId === itemWithNumberPrice.productoId);
        if (existing) {
          return {
            items: state.items.map(i =>
              i.productoId === itemWithNumberPrice.productoId
                ? {
                    ...i,
                    cantidad: i.cantidad + itemWithNumberPrice.cantidad,
                    stockDisponible: itemWithNumberPrice.stockDisponible ?? i.stockDisponible,
                  }
                : i
            ),
          };
        }
        return { items: [...state.items, itemWithNumberPrice] };
      }),
      setItemStockDisponible: (productoId, stockDisponible) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productoId === productoId ? { ...i, stockDisponible } : i
          ),
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.productoId !== id) })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + (Number(item.precioUnitario) * item.cantidad), 0),
      getCount: () => get().items.reduce((sum, item) => sum + item.cantidad, 0),
    }),
    { name: 'cart-storage' }
  )
);