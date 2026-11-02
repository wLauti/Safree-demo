import { Star } from 'lucide-react'

interface RatingBarsProps {
  distribution: Record<number, number>
  total: number
}

export function RatingBars({ distribution, total }: RatingBarsProps) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map(stars => {
        const count = distribution[stars] ?? 0
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-0.5 w-14 flex-shrink-0">
              <Star className="h-3 w-3 fill-accent-cream text-accent-cream" />
              <span className="text-text-muted">{stars} star</span>
            </div>
            <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cream rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-text-muted w-8 text-right flex-shrink-0">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
