import { cn } from '@/lib/utils/cn'

interface DividerProps {
  className?: string
  label?: string
}

export function Divider({ className, label }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4 my-6', className)}>
        <div className="flex-1 h-0.5 bg-red-primary" />
        <span className="text-label text-text-muted shrink-0">{label}</span>
        <div className="flex-1 h-0.5 bg-red-primary" />
      </div>
    )
  }

  return <div className={cn('section-divider', className)} />
}
