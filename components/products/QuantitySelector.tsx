'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface QuantitySelectorProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  className?: string
}

export function QuantitySelector({ value, onChange, min = 1, max = 10, className }: QuantitySelectorProps) {
  return (
    <div className={cn('flex items-center gap-0', className)}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 flex items-center justify-center border border-border rounded-l-card text-text-muted hover:text-text-primary hover:border-red-primary transition-colors disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="w-12 h-9 flex items-center justify-center border-y border-border text-text-primary text-sm font-body">
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 flex items-center justify-center border border-border rounded-r-card text-text-muted hover:text-text-primary hover:border-red-primary transition-colors disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
