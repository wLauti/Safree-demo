import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: string
  title: string
  price: number
  image_url: string | null
  store_id: string
  store_name: string
  quantity: number
  stock: number
}

interface CartStore {
  items: CartItem[]
  drawerOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (product_id: string) => void
  updateQuantity: (product_id: string, quantity: number) => void
  clearCart: () => void
  openDrawer: () => void
  closeDrawer: () => void
  mergeGuestCart: (serverItems: CartItem[]) => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(i => i.product_id === item.product_id)
          const qty = item.quantity ?? 1
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.stock, 10) }
                  : i
              ),
            }
          }
          return {
            items: state.items.length < 10
              ? [...state.items, { ...item, quantity: qty }]
              : state.items,
          }
        })
      },

      removeItem: (product_id) =>
        set((state) => ({ items: state.items.filter(i => i.product_id !== product_id) })),

      updateQuantity: (product_id, quantity) => {
        if (quantity <= 0) { get().removeItem(product_id); return }
        set((state) => ({
          items: state.items.map(i =>
            i.product_id === product_id
              ? { ...i, quantity: Math.min(quantity, i.stock, 10) }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),

      // Merge guest localStorage cart with server cart after login
      mergeGuestCart: (serverItems) => {
        const guestItems = get().items
        const merged = [...serverItems]
        for (const guest of guestItems) {
          if (!merged.find(i => i.product_id === guest.product_id)) {
            merged.push(guest)
          }
        }
        set({ items: merged.slice(0, 10) })
      },

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'safree-cart', skipHydration: true }
  )
)
