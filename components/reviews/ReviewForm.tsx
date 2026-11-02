'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rating } from '@/components/ui/Rating'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { notify } from '@/components/ui/Notification'
import { Star } from 'lucide-react'

interface Props {
  refType: 'order' | 'booking'
  refId: string
  triggerLabel?: string
  triggerClassName?: string
}

export function ReviewForm({ refType, refId, triggerLabel = 'Leave a Review', triggerClassName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (rating < 1) { notify.error('Please select a star rating'); return }
    setLoading(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref_type: refType, ref_id: refId, rating, body: body.trim() || null, anonymous }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success('Thanks for your review!')
      setOpen(false)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Could not submit review')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClassName ?? 'text-xs text-accent-cream hover:underline flex items-center gap-1'}
      >
        <Star className="h-3.5 w-3.5" /> {triggerLabel}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Leave a Review" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-2">Your rating</label>
            <Rating value={rating} onChange={setRating} size="lg" />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Your review <span className="text-text-muted text-xs">(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="Share details of your experience..."
              className="input-base w-full resize-none"
            />
            <p className="text-xs text-text-muted mt-1 text-right">{body.length}/1000</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="accent-red-primary" />
            <span className="text-sm text-text-muted">Post as &quot;Verified Buyer&quot; (hide my name)</span>
          </label>

          <div className="flex gap-3">
            <Button variant="primary" loading={loading} onClick={submit} disabled={rating < 1}>Submit Review</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
