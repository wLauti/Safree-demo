'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { CheckCircle } from 'lucide-react'

export function CompleteBookingButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleComplete = async () => {
    if (!confirm('Mark this booking as completed? This starts the 7-day fund release window.')) return
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}/complete`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      notify.success('Booking marked as completed. Funds release in 7 days.')
      router.refresh()
    } else {
      notify.error(data.error ?? 'Failed to mark complete')
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      onClick={handleComplete}
      leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
    >
      Mark Complete
    </Button>
  )
}
