'use client'

import { cn } from '@/lib/utils/cn'
import { Star } from 'lucide-react'
import { useState } from 'react'

interface RatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' }

export function Rating({ value, onChange, readonly = false, size = 'md', className }: RatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = (readonly ? value : (hovered || value)) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
            )}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled ? 'fill-accent-cream text-accent-cream' : 'fill-transparent text-text-muted'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
