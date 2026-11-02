'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { RatingBars } from './RatingBars'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils/formatters'
import { Star } from 'lucide-react'
import type { ProductReview } from '@/lib/types/product'

interface ReviewsSectionProps {
  reviews: ProductReview[]
  avgRating: number
  total: number
}

export function ReviewsSection({ reviews, avgRating, total }: ReviewsSectionProps) {
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const visible = reviews.slice(0, page * PER_PAGE)

  // Build distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] ?? 0) + 1 })

  if (!reviews.length) {
    return (
      <EmptyState
        icon={<Star />}
        title="No reviews yet"
        description="Purchase this product to leave the first review."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-6 card-base p-6">
        <div className="text-center flex-shrink-0">
          <p className="font-heading text-5xl text-accent-cream">{avgRating.toFixed(1)}</p>
          <Rating value={Math.round(avgRating)} readonly size="md" className="justify-center mt-1" />
          <p className="text-text-muted text-sm mt-1">{total} review{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1">
          <RatingBars distribution={distribution} total={total} />
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {visible.map(review => (
          <div key={review.id} className="card-base p-5">
            <div className="flex items-start gap-3">
              <Avatar
                src={review.reviewer?.avatar_url}
                name={review.reviewer?.full_name ?? 'User'}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm text-text-primary font-medium">
                    {review.reviewer?.full_name
                      ? obscureName(review.reviewer.full_name)
                      : 'Anonymous'}
                  </span>
                  <Badge variant="verified">Verified Purchase</Badge>
                  <span className="text-xs text-text-muted ml-auto">{formatDate(review.created_at)}</span>
                </div>
                <Rating value={review.rating} readonly size="sm" />
                {review.body && (
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">{review.body}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {visible.length < reviews.length && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  )
}

function obscureName(name: string): string {
  const parts = name.trim().split(' ')
  return parts.map((p, i) => i === 0 ? p : p[0] + '.').join(' ')
}
