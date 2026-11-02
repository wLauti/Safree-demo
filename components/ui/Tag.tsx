import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type TagVariant = 'category' | 'species' | 'status' | 'default'

interface TagProps {
  variant?: TagVariant
  children: ReactNode
  onRemove?: () => void
  className?: string
}

const variantStyles: Record<TagVariant, string> = {
  category: 'bg-red-primary/20 text-red-primary border-red-primary/30',
  species: 'bg-accent-cream/10 text-accent-cream border-accent-cream/20',
  status: 'bg-bg-secondary text-text-muted border-border',
  default: 'bg-bg-secondary text-text-primary border-border',
}

export function Tag({ variant = 'default', children, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-red-primary transition-colors ml-0.5"
          aria-label="Remove tag"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
