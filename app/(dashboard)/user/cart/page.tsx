'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { QuantitySelector } from '@/components/products/QuantitySelector'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { formatCurrency } from '@/lib/utils/formatters'
import { ShoppingCart, Trash2, Tag, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notify } from '@/components/ui/Notification'
import { cn } from '@/lib/utils/cn'

const PROMO_CODES: Record<string, number> = {
  SAFREE10: 0.1,
  OUTDOOR20: 0.2,
  TEXAS15: 0.15,
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState('')

  const subtotal = total()
  const discount = appliedPromo ? subtotal * (PROMO_CODES[appliedPromo] ?? 0) : 0
  const shipping = subtotal > 0 ? (subtotal >= 150 ? 0 : 12.99) : 0
  const orderTotal = subtotal - discount + shipping

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    if (PROMO_CODES[code]) {
      setAppliedPromo(code)
      setPromoError('')
      notify.success(`Promo code applied — ${Math.round(PROMO_CODES[code] * 100)}% off!`)
    } else {
      setPromoError('Invalid promo code.')
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoInput('')
    setPromoError('')
  }

  if (items.length === 0) {
    return (
      <PageWrapper>
        <div className="py-20">
          <EmptyState
            icon={<ShoppingCart />}
            title="Your cart is empty"
            description="Browse the marketplace and add items to get started."
            action={{ label: 'Browse Products', href: '/products' }}
          />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Shopping Cart</h1>
        <p className="text-text-muted mb-6">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        <Divider />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item list */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.product_id} className="card-base p-4 flex gap-4">
                {/* Image */}
                <Link href={`/products/${item.product_id}`} className="flex-shrink-0">
                  <div className="relative w-24 h-24 rounded-card overflow-hidden bg-bg-primary">
                    {item.image_url
                      ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="96px" />
                      : <div className="w-full h-full bg-bg-primary" />
                    }
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">{item.store_name}</p>
                  <Link href={`/products/${item.product_id}`}>
                    <p className="text-text-primary font-body line-clamp-2 leading-snug hover:text-accent-cream transition-colors">
                      {item.title}
                    </p>
                  </Link>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={qty => updateQuantity(item.product_id, qty)}
                      max={Math.min(item.stock, 10)}
                    />
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-lg text-accent-cream">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({formatCurrency(item.price)} each)
                      </span>
                      <button
                        onClick={() => { removeItem(item.product_id); notify.success('Item removed') }}
                        className="text-text-muted hover:text-red-primary transition-colors ml-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                onClick={() => { clearCart(); notify.success('Cart cleared') }}
                className="text-sm text-text-muted hover:text-red-primary transition-colors"
              >
                Clear cart
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            {/* Promo code */}
            <div className="card-base p-4">
              <h3 className="font-heading text-text-primary mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" /> Promo Code
              </h3>
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-bg-primary rounded-card px-3 py-2">
                  <span className="text-sm text-accent-cream font-mono">{appliedPromo}</span>
                  <button
                    onClick={handleRemovePromo}
                    className="text-xs text-text-muted hover:text-red-primary transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value); setPromoError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                    className="input-base flex-1 text-sm"
                  />
                  <Button variant="secondary" size="sm" onClick={handleApplyPromo}>
                    Apply
                  </Button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-primary mt-2">{promoError}</p>}
            </div>

            {/* Price breakdown */}
            <div className="card-base p-4">
              <h3 className="font-heading text-text-primary mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span className="text-text-primary">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({appliedPromo})</span>
                    <span>−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-muted">
                  <span>Estimated Shipping</span>
                  <span className={cn('text-text-primary', shipping === 0 && 'text-green-400')}>
                    {shipping === 0 ? (subtotal > 0 ? 'FREE' : '—') : formatCurrency(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-text-muted">Free shipping on orders over $150</p>
                )}
                <Divider />
                <div className="flex justify-between font-heading text-lg">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent-cream">{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              {/* Age disclaimer */}
              <div className="mt-4 flex gap-2 bg-bg-primary rounded-card p-3">
                <ShieldAlert className="h-4 w-4 text-accent-cream flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-relaxed">
                  By purchasing hunting equipment you confirm you are 18 years of age or older and comply with all applicable local laws.
                </p>
              </div>

              <Button variant="primary" size="lg" className="w-full mt-4">
                Proceed to Checkout
              </Button>

              <Link href="/products">
                <button className="w-full text-sm text-text-muted hover:text-text-primary transition-colors py-2 mt-2 text-center">
                  Continue Shopping →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
