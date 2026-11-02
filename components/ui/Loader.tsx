import { cn } from '@/lib/utils/cn'

// ── Skeleton card loader ──────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card-base overflow-hidden animate-pulse', className)}>
      <div className="aspect-square bg-bg-primary" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-bg-primary rounded w-1/3" />
        <div className="h-4 bg-bg-primary rounded w-3/4" />
        <div className="h-4 bg-bg-primary rounded w-1/2" />
        <div className="h-5 bg-bg-primary rounded w-1/4" />
      </div>
    </div>
  )
}

// ── Skeleton table row ────────────────────────────────────────
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-bg-secondary rounded" />
        </td>
      ))}
    </tr>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-red-primary',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

// ── Full page loader ─────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary">
      <Spinner className="h-12 w-12" />
    </div>
  )
}
