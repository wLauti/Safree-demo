'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PriceRangeSlider } from '@/components/ui/PriceRangeSlider'
import { Rating } from '@/components/ui/Rating'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { US_STATES } from '@/lib/utils/constants'
import type { Category } from '@/lib/types/product'

interface FilterPanelProps {
  categories: Category[]
  className?: string
  onClose?: () => void
}

export function FilterPanel({ categories, className, onClose }: FilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const get = (key: string) => searchParams.get(key)

  const push = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k)
      else params.set(k, v)
    })
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    onClose?.()
  }, [router, pathname, searchParams, onClose])

  const activeCat = get('category')
  const priceMin = Number(get('price_min') ?? 0)
  const priceMax = Number(get('price_max') ?? 5000)
  const condition = get('condition') ?? 'all'
  const state = get('state') ?? ''
  const minRating = Number(get('min_rating') ?? 0)
  const onSale = get('on_sale') === '1'

  const clearAll = () => {
    router.push(pathname, { scroll: false })
    onClose?.()
  }

  const hasFilters = activeCat || get('price_min') || condition !== 'all' || state || minRating > 0 || onSale

  return (
    <aside className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg text-text-primary">Filters</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-red-primary hover:text-accent-cream transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <section className="mb-6">
        <h3 className="text-label text-text-muted mb-3">Category</h3>
        <ul className="space-y-1">
          {categories.map(cat => (
            <li key={cat.id}>
              <button
                onClick={() => push({ category: activeCat === cat.slug ? null : cat.slug })}
                className={cn(
                  'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                  activeCat === cat.slug
                    ? 'text-accent-cream bg-red-primary/20 font-medium'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Divider className="my-4" />

      {/* Price Range */}
      <section className="mb-6">
        <h3 className="text-label text-text-muted mb-4">Price Range</h3>
        <PriceRangeSlider
          value={[priceMin, priceMax]}
          onChange={([lo, hi]) => push({ price_min: String(lo), price_max: String(hi) })}
        />
      </section>

      <Divider className="my-4" />

      {/* Condition */}
      <section className="mb-6">
        <h3 className="text-label text-text-muted mb-3">Condition</h3>
        <div className="flex gap-2">
          {(['all', 'new', 'used'] as const).map(c => (
            <button
              key={c}
              onClick={() => push({ condition: c === 'all' ? null : c })}
              className={cn(
                'flex-1 py-1.5 text-xs font-heading tracking-wider uppercase rounded-card border transition-colors',
                condition === c
                  ? 'bg-red-primary text-accent-cream border-transparent'
                  : 'bg-transparent text-text-muted border-border hover:border-red-primary'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <Divider className="my-4" />

      {/* State */}
      <section className="mb-6">
        <h3 className="text-label text-text-muted mb-3">Location (State)</h3>
        <select
          value={state}
          onChange={e => push({ state: e.target.value || null })}
          className="input-base text-sm"
        >
          <option value="">All States</option>
          {US_STATES.map(s => (
            <option key={s} value={s} className="bg-bg-primary">{s}</option>
          ))}
        </select>
      </section>

      <Divider className="my-4" />

      {/* Min Rating */}
      <section className="mb-6">
        <h3 className="text-label text-text-muted mb-3">Minimum Rating</h3>
        <Rating
          value={minRating}
          onChange={v => push({ min_rating: v > 0 ? String(v) : null })}
          size="md"
        />
        {minRating > 0 && (
          <button
            onClick={() => push({ min_rating: null })}
            className="text-xs text-text-muted hover:text-red-primary mt-1 transition-colors"
          >
            Clear rating
          </button>
        )}
      </section>

      <Divider className="my-4" />

      {/* On Sale */}
      <section className="mb-6">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-text-primary">On Sale Only</span>
          <button
            onClick={() => push({ on_sale: onSale ? null : '1' })}
            className={cn(
              'relative inline-flex h-5 w-10 items-center rounded-full transition-colors',
              onSale ? 'bg-red-primary' : 'bg-bg-secondary border border-border'
            )}
          >
            <span className={cn(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-accent-cream transition-transform shadow',
              onSale ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </label>
      </section>
    </aside>
  )
}
