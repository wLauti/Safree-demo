import { Rating } from '@/components/ui/Rating'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeDate } from '@/lib/utils/formatters'
import { FlagReviewButton } from './FlagReviewButton'

export interface ReviewItem {
  id: string
  rating: number
  body: string | null
  created_at: string
  ref_type: string
  is_anonymous: boolean
  is_verified_purchase: boolean
  profiles?: { full_name: string | null; avatar_url: string | null } | null
}

function displayName(review: ReviewItem): string {
  if (review.is_anonymous) return 'Verified Buyer'
  const full = review.profiles?.full_name
  if (!full) return 'Verified Buyer'
  const parts = full.trim().split(' ')
  const first = parts[0]
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : ''
  return `${first}${lastInitial}`
}

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-text-muted text-sm">No reviews yet — be the first!</p>
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => {
        const name = displayName(review)
        const badgeLabel = review.ref_type === 'booking' ? 'Verified Booking' : 'Verified Purchase'
        return (
          <div key={review.id} className="card-base p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {!review.is_anonymous && <Avatar src={review.profiles?.avatar_url} name={name} size="sm" />}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-body">{name}</span>
                    {review.is_verified_purchase && <Badge variant="verified">{badgeLabel}</Badge>}
                  </div>
                  <Rating value={review.rating} readonly size="sm" className="mt-0.5" />
                </div>
              </div>
              <span className="text-text-muted text-xs whitespace-nowrap">{formatRelativeDate(review.created_at)}</span>
            </div>

            {review.body && <p className="text-text-muted text-sm leading-relaxed mt-3">{review.body}</p>}

            <div className="mt-2 flex justify-end">
              <FlagReviewButton reviewId={review.id} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
