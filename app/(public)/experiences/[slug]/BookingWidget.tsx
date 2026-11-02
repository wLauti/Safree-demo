'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/formatters'
import { AvailabilityCalendar } from './AvailabilityCalendar'
import { Users } from 'lucide-react'

interface Props {
  experienceId: string
  experienceSlug: string
  pricePerPerson: number
  maxGuests: number
  minBookingDays: number
  title: string
  storeNotReady?: boolean
}

export function BookingWidget({
  experienceId, experienceSlug, pricePerPerson, maxGuests, minBookingDays, title, storeNotReady
}: Props) {
  const [guests, setGuests] = useState(1)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const router = useRouter()

  const nights = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0
  const subtotal = nights > 0 ? pricePerPerson * guests * nights : 0

  const handleBook = () => {
    if (!startDate || !endDate) return
    // TODO: implement booking flow in Sprint 5
    router.push(`/book/${experienceId}?start=${startDate}&end=${endDate}&guests=${guests}`)
  }

  return (
    <div className="card-base p-5 space-y-5 sticky top-24">
      <div>
        <span className="font-heading text-3xl text-accent-cream">{formatCurrency(pricePerPerson)}</span>
        <span className="text-text-muted text-sm ml-1">/ person / day</span>
      </div>

      {/* Guests */}
      <div>
        <label className="text-sm text-text-muted flex items-center gap-1.5 mb-2">
          <Users className="h-3.5 w-3.5" /> Guests
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGuests(g => Math.max(1, g - 1))}
            className="w-8 h-8 rounded-full border border-border text-text-primary hover:border-red-primary transition-colors flex items-center justify-center"
          >
            –
          </button>
          <span className="font-heading text-text-primary text-xl w-8 text-center">{guests}</span>
          <button
            onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}
            className="w-8 h-8 rounded-full border border-border text-text-primary hover:border-red-primary transition-colors flex items-center justify-center"
          >
            +
          </button>
          <span className="text-text-muted text-xs">(max {maxGuests})</span>
        </div>
      </div>

      {/* Calendar */}
      <AvailabilityCalendar
        experienceSlug={experienceSlug}
        minBookingDays={minBookingDays}
        onRangeSelect={(s, e) => { setStartDate(s); setEndDate(e) }}
      />

      {/* Price breakdown */}
      {subtotal > 0 && (
        <div className="space-y-1.5 text-sm border-t border-border pt-4">
          <div className="flex justify-between text-text-muted">
            <span>{formatCurrency(pricePerPerson)} × {guests} {guests === 1 ? 'guest' : 'guests'} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
            <span className="text-text-primary">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between font-heading text-lg border-t border-border pt-2">
            <span className="text-text-primary">Total</span>
            <span className="text-accent-cream">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      )}

      {storeNotReady ? (
        <div className="text-center text-xs text-text-muted py-2">
          Bookings not available yet for this listing.
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!startDate || !endDate}
          onClick={handleBook}
        >
          {!startDate ? 'Select Dates to Book' : 'Request to Book'}
        </Button>
      )}
    </div>
  )
}
