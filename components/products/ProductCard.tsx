'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { Button } from '@/components/ui/Button'
import { SaveButton } from './SaveButton'
import { formatCurrency } from '@/lib/utils/formatters'
import { useCartStore } from '@/store/cartStore'
import { notify } from '@/components/ui/Notification'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/lib/types/product'

interface ProductCardProps {
  product: Product
  mode?: 'grid' | 'list'
}

export function ProductCard({ product, mode = 'grid' }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)

  const isOnSale = product.compare_at_price && product.compare_at_price > product.price
  const href = product.slug ? `/products/${product.slug}` : `/products/${product.id}`
  const imageUrl = product.images?.[0] ?? null
  const outOfStock = product.stock === 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (outOfStock) return
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      image_url: imageUrl,
      store_id: product.store_id,
      store_name: product.stores?.name ?? '',
      stock: product.stock,
    })
    notify.success('Added to cart')
    openDrawer()
  }

  if (mode === 'list') {
    return (
      <Link
        href={href}
        className="card-base flex gap-4 p-4 hover:border-red-primary transition-colors group"
      >
        {/* Image */}
        <div className="relative w-40 aspect-square rounded bg-bg-primary overflow-hidden flex-shrink-0">
          {imageUrl
            ? <Image src={imageUrl} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full bg-bg-primary" />
          }
          {isOnSale && <div className="absolute top-1 left-1"><Badge variant="sale">Sale</Badge></div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-label text-text-muted mb-0.5">{product.stores?.name}</p>
                <h3 className="font-heading text-text-primary text-lg leading-tight line-clamp-2">{product.title}</h3>
              </div>
              <SaveButton productId={product.id} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={product.condition === 'new' ? 'new' : 'default'}>
                {product.condition === 'new' ? 'New' : 'Used'}
              </Badge>
              {product.state_location && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <MapPin className="h-3 w-3" /> {product.state_location}
                </span>
              )}
            </div>
            {product.avg_rating !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                <Rating value={product.avg_rating} readonly size="sm" />
                <span className="text-xs text-text-muted">({product.review_count ?? 0})</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-xl text-accent-cream">{formatCurrency(product.price)}</span>
              {isOnSale && (
                <span className="text-text-muted text-sm line-through">{formatCurrency(product.compare_at_price!)}</span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </Link>
    )
  }

  // Grid mode
  return (
    <Link
      href={href}
      className="card-base overflow-hidden group hover:border-red-primary transition-colors flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-bg-primary overflow-hidden">
        {imageUrl
          ? <Image src={imageUrl} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
          : <div className="w-full h-full bg-bg-primary" />
        }
        {isOnSale && <div className="absolute top-2 left-2"><Badge variant="sale">Sale</Badge></div>}
        <div className="absolute top-2 right-2">
          <SaveButton productId={product.id} />
        </div>
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="font-heading text-sm text-accent-cream tracking-widest">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5 flex items-center gap-1">
          {product.stores?.name}
          {product.stores?.is_verified && (
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full" title="Verified" />
          )}
        </p>
        <h3 className="font-heading text-text-primary text-sm leading-tight line-clamp-2 mb-1.5 flex-1">
          {product.title}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <Badge variant={product.condition === 'new' ? 'new' : 'default'}>
            {product.condition === 'new' ? 'New' : 'Used'}
          </Badge>
          {product.state_location && (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
              <MapPin className="h-2.5 w-2.5" />{product.state_location}
            </span>
          )}
        </div>

        {product.avg_rating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            <Rating value={product.avg_rating} readonly size="sm" />
            <span className="text-[10px] text-text-muted">({product.review_count ?? 0})</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="font-heading text-base text-accent-cream">{formatCurrency(product.price)}</span>
            {isOnSale && (
              <span className="text-text-muted text-xs line-through ml-1">{formatCurrency(product.compare_at_price!)}</span>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="w-full mt-2"
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </Link>
  )
}
