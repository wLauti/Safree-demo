'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { QuantitySelector } from '@/components/products/QuantitySelector'
import { formatCurrency } from '@/lib/utils/formatters'
import { X, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export function CartDrawer() {
  const { drawerOpen, closeDrawer, items, removeItem, updateQuantity, total } = useCartStore()
  const { user } = useAuth()

  // Rehydrate Zustand persist store from localStorage on the client only
  useEffect(() => {
    useCartStore.persist.rehydrate()
  }, [])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [drawerOpen, closeDrawer])

  return (
    <>
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          onClick={closeDrawer}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-bg-secondary z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Shopping cart"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-heading text-xl text-text-primary">
            Cart <span className="text-text-muted text-base font-body">({items.length})</span>
          </h2>
          <button onClick={closeDrawer} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">
          {items.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart />}
              title="Your cart is empty"
              description="Browse the marketplace and add items to get started."
              action={{ label: 'Browse Products', href: '/products', onClick: closeDrawer }}
            />
          ) : (
            items.map(item => (
              <div key={item.product_id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                {/* Image */}
                <div className="relative w-16 h-16 rounded-card overflow-hidden bg-bg-primary flex-shrink-0">
                  {item.image_url
                    ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="64px" />
                    : <div className="w-full h-full bg-bg-primary" />
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">{item.store_name}</p>
                  <p className="text-sm text-text-primary font-body line-clamp-2 leading-tight">{item.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={qty => updateQuantity(item.product_id, qty)}
                      max={Math.min(item.stock, 10)}
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-accent-cream text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-text-muted hover:text-red-primary transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-body">Subtotal</span>
              <span className="font-heading text-xl text-accent-cream">{formatCurrency(total())}</span>
            </div>
            {user ? (
              <Link href="/user/cart" onClick={closeDrawer}>
                <Button variant="primary" className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={closeDrawer}>
                  <Button variant="primary" className="w-full">
                    Sign in to Checkout
                  </Button>
                </Link>
                <p className="text-xs text-center text-text-muted">Your cart is saved for 30 days</p>
              </div>
            )}
            <button
              onClick={closeDrawer}
              className="w-full text-sm text-text-muted hover:text-text-primary transition-colors py-1"
            >
              Continue Shopping →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
