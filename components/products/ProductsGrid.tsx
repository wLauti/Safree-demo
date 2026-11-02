'use client'

import { ProductCard } from './ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Divider } from '@/components/ui/Divider'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/types/product'

interface ProductsGridProps {
  products: Product[]
  mode: 'grid' | 'list'
}

export function ProductsGrid({ products, mode }: ProductsGridProps) {
  if (!products.length) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="No products found"
        description="Try adjusting your filters or search terms."
        action={{ label: 'Clear Filters', href: '/products' }}
      />
    )
  }

  if (mode === 'list') {
    return (
      <div className="space-y-3">
        {products.map(p => <ProductCard key={p.id} product={p} mode="list" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map(p => <ProductCard key={p.id} product={p} mode="grid" />)}
    </div>
  )
}
