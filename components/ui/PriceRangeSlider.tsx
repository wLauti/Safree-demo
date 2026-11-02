'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface PriceRangeSliderProps {
  min?: number
  max?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  step?: number
  className?: string
}

export function PriceRangeSlider({
  min = 0,
  max = 5000,
  value,
  onChange,
  step = 10,
  className,
}: PriceRangeSliderProps) {
  const [low, high] = value
  const trackRef = useRef<HTMLDivElement>(null)

  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const handleLow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), high - step)
    onChange([v, high])
  }
  const handleHigh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), low + step)
    onChange([low, v])
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs text-text-muted mb-3">
        <span>${low.toLocaleString()}</span>
        <span>${high.toLocaleString()}</span>
      </div>
      <div ref={trackRef} className="relative h-1.5 bg-bg-primary rounded-full">
        {/* Active range */}
        <div
          className="absolute h-full bg-red-primary rounded-full"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        {/* Low thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={handleLow}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: low > max - 100 ? 5 : 3 }}
        />
        {/* High thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={handleHigh}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />
        {/* Visual thumbs */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent-cream rounded-full border-2 border-red-primary shadow pointer-events-none"
          style={{ left: `calc(${pct(low)}% - 8px)` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent-cream rounded-full border-2 border-red-primary shadow pointer-events-none"
          style={{ left: `calc(${pct(high)}% - 8px)` }}
        />
      </div>
    </div>
  )
}
