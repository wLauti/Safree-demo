'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { SORT_OPTIONS } from '@/lib/utils/constants'
import { PRODUCTS_PER_PAGE } from '@/lib/utils/constants'

interface SortAndViewBarProps {
  total: number
  mode: 'grid' | 'list'
  onModeChange: (m: 'grid' | 'list') => void
  page: number
}

export function SortAndViewBar({ total, mode, onModeChange, page }: SortAndViewBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sort = searchParams.get('sort') ?? 'newest'
  const start = (page - 1) * PRODUCTS_PER_PAGE + 1
  const end = Math.min(page * PRODUCTS_PER_PAGE, total)

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <p className="text-text-muted text-sm flex-shrink-0">
        {total > 0
          ? <>Showing <span className="text-text-primary">{start}–{end}</span> of <span className="text-text-primary">{total.toLocaleString()}</span> results</>
          : 'No results'
        }
      </p>
      <div className="flex items-center gap-3">
        {/* Sort */}
        <select
          value={sort}
          onChange={e => handleSort(e.target.value)}
          className="bg-bg-secondary border border-border text-text-primary text-sm px-3 py-1.5 rounded-card focus:outline-none focus:border-red-primary"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value} className="bg-bg-primary">{o.label}</option>
          ))}
        </select>
        {/* View toggle */}
        <div className="flex border border-border rounded-card overflow-hidden">
          <button
            onClick={() => onModeChange('grid')}
            className={cn('p-1.5 transition-colors', mode === 'grid' ? 'bg-red-primary text-accent-cream' : 'text-text-muted hover:text-text-primary')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onModeChange('list')}
            className={cn('p-1.5 transition-colors', mode === 'list' ? 'bg-red-primary text-accent-cream' : 'text-text-muted hover:text-text-primary')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
