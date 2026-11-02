'use client'

import { cn } from '@/lib/utils/cn'
import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface DropdownItem {
  value: string
  label: string
  icon?: ReactNode
}

interface DropdownProps {
  items: DropdownItem[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchable?: boolean
  label?: string
  className?: string
}

export function Dropdown({ items, value, onChange, placeholder = 'Select...', searchable = false, label, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = items.find(i => i.value === value)
  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      {label && <p className="text-label text-text-muted mb-1.5">{label}</p>}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input-base flex items-center justify-between text-left cursor-pointer"
      >
        <span className={cn(selected ? 'text-text-primary' : 'text-text-muted')}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.icon} {selected.label}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-bg-secondary border border-border rounded-card shadow-card overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-bg-primary text-text-primary text-sm pl-7 pr-3 py-1.5 rounded border border-border focus:outline-none focus:border-red-primary"
                  autoFocus
                />
              </div>
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-text-muted">No results</li>
            ) : filtered.map(item => (
              <li key={item.value}>
                <button
                  type="button"
                  onClick={() => { onChange?.(item.value); setOpen(false); setQuery('') }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-bg-primary transition-colors',
                    item.value === value ? 'text-accent-cream bg-red-primary/20' : 'text-text-primary'
                  )}
                >
                  {item.icon} {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
