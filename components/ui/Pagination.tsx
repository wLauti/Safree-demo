'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  total: number
  perPage: number
  currentPage: number
}

export function Pagination({ total, perPage, currentPage }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / perPage)

  if (totalPages <= 1) return null

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  // Build page number list with ellipsis
  const pages: (number | '…')[] = []
  const delta = 2
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary border border-border rounded-card disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Prev
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-text-muted">…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p as number)}
            className={cn(
              'w-9 h-9 text-sm rounded-card border transition-colors',
              p === currentPage
                ? 'bg-red-primary text-accent-cream border-transparent'
                : 'border-border text-text-muted hover:text-text-primary hover:border-red-primary'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary border border-border rounded-card disabled:opacity-40 transition-colors"
      >
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  )
}
