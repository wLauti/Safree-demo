import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbProps {
  crumbs: Crumb[]
  className?: string
}

export function Breadcrumb({ crumbs, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5', className)}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="text-sm text-text-muted hover:text-accent-cream transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className={cn(
              'text-sm',
              i === crumbs.length - 1 ? 'text-text-primary' : 'text-text-muted'
            )}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
