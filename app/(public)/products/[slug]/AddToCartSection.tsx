'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/Button'
import { QuantitySelector } from '@/components/products/QuantitySelector'
import { SaveButton } from '@/components/products/SaveButton'
import { notify } from '@/components/ui/Notification'
import { ShoppingCart, MessageCircle } from 'lucide-react'
import type { Product } from '@/lib/types/product'

export function AddToCartSection({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const addItem = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)

  // Increment view count
  useEffect(() => {
    fetch(`/api/products/${product.id}/views`, { method: 'POST' }).catch(() => {})
  }, [product.id])

  const outOfStock = product.stock === 0
  const maxQty = Math.min(product.stock, 10)

  const store = product.stores as unknown as { name: string; id: string } | undefined

  const handleAdd = () => {
    if (outOfStock) return
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.images?.[0] ?? null,
      store_id: product.store_id,
      store_name: store?.name ?? '',
      stock: product.stock,
      quantity: qty,
    })
    notify.success(`${qty > 1 ? `${qty}× ` : ''}${product.title} added to cart`)
    openDrawer()
  }

  return (
    <div className="space-y-4">
      {/* Quantity */}
      {!outOfStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">Qty:</span>
          <QuantitySelector value={qty} onChange={setQty} max={maxQty} />
        </div>
      )}

      {/* Primary CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={outOfStock}
        onClick={handleAdd}
        leftIcon={<ShoppingCart className="h-5 w-5" />}
      >
        {outOfStock ? 'Out of Stock' : 'Add to Cart'}
      </Button>

      {/* Secondary actions */}
      <div className="flex gap-3">
        <SaveButton productId={product.id} size="md" className="flex-1 rounded-card border border-border justify-center" />
        <Button variant="ghost" size="sm" className="flex-1" leftIcon={<MessageCircle className="h-4 w-4" />}>
          Contact Seller
        </Button>
      </div>
    </div>
  )
}
