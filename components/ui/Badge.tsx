import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type BadgeVariant = 'verified' | 'pending' | 'new' | 'sale' | 'species' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  verified: 'bg-green-900/60 text-green-300 border-green-700',
  pending: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  new: 'bg-blue-900/60 text-blue-300 border-blue-700',
  sale: 'bg-red-primary text-accent-cream border-transparent',
  species: 'bg-bg-primary text-text-muted border-border',
  default: 'bg-bg-secondary text-text-muted border-border',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-body font-medium border tracking-wide uppercase',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
