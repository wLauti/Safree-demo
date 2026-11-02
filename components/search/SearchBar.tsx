'use client'

import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, X, Package, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/formatters'
import Image from 'next/image'
import Link from 'next/link'

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { results, loading } = useSearch(query)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const hasResults =
    results.products.length > 0 || results.experiences.length > 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className={cn('relative w-full max-w-md', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search products & experiences..."
            className="w-full bg-bg-secondary border border-border text-text-primary text-sm pl-9 pr-8 py-2 rounded-card focus:outline-none focus:border-red-primary transition-colors placeholder-text-muted"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setOpen(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 w-full bg-bg-secondary border border-border rounded-card shadow-card z-50 overflow-hidden">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-text-muted text-sm">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-border border-t-red-primary" />
              Searching...
            </div>
          )}

          {!loading && !hasResults && (
            <p className="px-4 py-3 text-text-muted text-sm">No results for &quot;{query}&quot;</p>
          )}

          {results.products.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] text-text-muted font-medium tracking-widest uppercase border-b border-border">
                Products
              </p>
              {results.products.map(p => (
                <Link
                  key={p.id}
                  href={p.slug ? `/products/${p.slug}` : `/products/${p.id}`}
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-primary transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-bg-primary overflow-hidden flex-shrink-0">
                    {p.images?.[0]
                      ? <Image src={p.images[0]} alt={p.title} width={40} height={40} className="object-cover w-full h-full" />
                      : <Package className="h-4 w-4 text-text-muted m-auto" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{p.title}</p>
                    <p className="text-xs text-text-muted">{(p.stores as { name: string } | null)?.name}</p>
                  </div>
                  <span className="text-sm font-heading text-accent-cream">{formatCurrency(p.price)}</span>
                </Link>
              ))}
            </div>
          )}

          {results.experiences.length > 0 && (
            <div className={results.products.length > 0 ? 'border-t border-border' : ''}>
              <p className="px-4 py-2 text-[10px] text-text-muted font-medium tracking-widest uppercase border-b border-border">
                Experiences
              </p>
              {results.experiences.map(e => (
                <Link
                  key={e.id}
                  href={`/experiences/${e.id}`}
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-primary transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-bg-primary overflow-hidden flex-shrink-0">
                    {e.images?.[0]
                      ? <Image src={e.images[0]} alt={e.title} width={40} height={40} className="object-cover w-full h-full" />
                      : <MapPin className="h-4 w-4 text-text-muted m-auto" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{e.title}</p>
                    <p className="text-xs text-text-muted">{e.location_state}</p>
                  </div>
                  <span className="text-sm font-heading text-accent-cream">{formatCurrency(e.price_per_person)}<span className="text-text-muted text-[10px]">/pp</span></span>
                </Link>
              ))}
            </div>
          )}

          {hasResults && (
            <button
              onClick={handleSubmit as never}
              className="w-full px-4 py-2.5 text-sm text-red-primary hover:bg-bg-primary transition-colors text-left border-t border-border"
            >
              View all results for &quot;{query}&quot; →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
