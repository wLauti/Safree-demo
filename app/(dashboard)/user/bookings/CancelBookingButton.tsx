'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { calculateRefund, daysUntil, refundMessage, POLICY_INFO } from '@/lib/bookings/cancellation'
import type { CancellationPolicy } from '@/lib/bookings/cancellation'
import { formatCurrency } from '@/lib/utils/formatters'
import { notify } from '@/components/ui/Notification'

interface Props {
  bookingId: string
  startDate: string
  policy: string
  total: number
  serviceFee: number
}

export function CancelBookingButton({ bookingId, startDate, policy, total, serviceFee }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const cancellationPolicy = (policy ?? 'moderate') as CancellationPolicy
  const refund = calculateRefund(total, serviceFee, cancellationPolicy, startDate)
  const message = refundMessage(refund, total, cancellationPolicy, startDate)

  const handleCancel = async () => {
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      notify.success('Booking cancelled' + (refund > 0 ? `. Refund of ${formatCurrency(refund)} processing.` : '.'))
      setOpen(false)
      router.refresh()
    } else {
      notify.error(data.error ?? 'Cancellation failed')
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-red-primary hover:underline">
        Cancel
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Cancel Booking" size="sm">
        <div className="space-y-4">
          <p className="text-text-muted text-sm">
            Are you sure you want to cancel this booking?
          </p>
          <div className="bg-bg-secondary rounded-card p-3 text-sm">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Cancellation Policy: {POLICY_INFO[cancellationPolicy].name}</p>
            <p className="text-text-primary">{message}</p>
          </div>
          {daysUntil(startDate) < 0 && (
            <p className="text-red-primary text-xs">This experience has already started or passed. No refund will be issued.</p>
          )}
          <div className="flex gap-3">
            <Button variant="primary" className="bg-red-primary flex-1" loading={loading} onClick={handleCancel}>
              Confirm Cancellation
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Keep Booking</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
