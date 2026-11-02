import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="mb-4 text-text-muted opacity-40 [&>svg]:h-16 [&>svg]:w-16">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-xl text-text-primary mb-2">{title}</h3>
      {description && <p className="text-text-muted text-sm max-w-sm">{description}</p>}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <a href={action.href}>
              <Button variant="primary">{action.label}</Button>
            </a>
          ) : (
            <Button variant="primary" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
