'use client'

import { useState } from 'react'
import { FilterPanel } from '@/components/products/FilterPanel'
import { SortAndViewBar } from '@/components/products/SortAndViewBar'
import { ProductsGrid } from '@/components/products/ProductsGrid'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SlidersHorizontal } from 'lucide-react'
import { PRODUCTS_PER_PAGE } from '@/lib/utils/constants'
import type { Product, Category } from '@/lib/types/product'

interface ProductsPageClientProps {
  products: Product[]
  total: number
  page: number
  categories: Category[]
}

export function ProductsPageClient({ products, total, page, categories }: ProductsPageClientProps) {
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <div className="sticky top-24 bg-bg-secondary rounded-card p-5 border border-border">
          <FilterPanel categories={categories} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setMobileFilterOpen(true)}
          >
            Filters
          </Button>
        </div>

        <SortAndViewBar total={total} mode={mode} onModeChange={setMode} page={page} />
        <ProductsGrid products={products} mode={mode} />
        <Pagination total={total} perPage={PRODUCTS_PER_PAGE} currentPage={page} />
      </div>

      {/* Mobile filter modal */}
      <Modal
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filters"
        size="sm"
      >
        <FilterPanel categories={categories} onClose={() => setMobileFilterOpen(false)} />
      </Modal>
    </div>
  )
}
