'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { notify } from '@/components/ui/Notification'

interface StoreOrderActionsProps {
  orderId: string
  status: string
}

export function StoreOrderActions({ orderId, status }: StoreOrderActionsProps) {
  const router = useRouter()
  const [showShipModal, setShowShipModal] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const markShipped = async () => {
    setLoading(true)
    const res = await fetch(`/api/orders/${orderId}/ship`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_number: trackingNumber, tracking_url: trackingUrl }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success('Order marked as shipped')
      setShowShipModal(false)
      router.refresh()
    } else {
      const { error } = await res.json()
      notify.error(error ?? 'Failed to update order')
    }
  }

  const markDelivered = async () => {
    setLoading(true)
    const res = await fetch(`/api/orders/${orderId}/deliver`, { method: 'PATCH' })
    setLoading(false)
    if (res.ok) {
      notify.success('Order marked as delivered')
      router.refresh()
    } else {
      const { error } = await res.json()
      notify.error(error ?? 'Failed to update order')
    }
  }

  if (status === 'paid') {
    return (
      <>
        <Button variant="secondary" size="sm" onClick={() => setShowShipModal(true)}>
          Mark Shipped
        </Button>

        <Modal
          open={showShipModal}
          onClose={() => setShowShipModal(false)}
          title="Ship Order"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Tracking Number <span className="text-text-muted text-xs">(optional)</span></label>
              <input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1Z999AA10123456784"
                className="input-base w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Tracking URL <span className="text-text-muted text-xs">(optional)</span></label>
              <input
                value={trackingUrl}
                onChange={e => setTrackingUrl(e.target.value)}
                placeholder="https://tracking.example.com/..."
                className="input-base w-full"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" loading={loading} onClick={markShipped} className="flex-1">
                Confirm Shipped
              </Button>
              <Button variant="ghost" onClick={() => setShowShipModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  if (status === 'shipped') {
    return (
      <Button variant="secondary" size="sm" loading={loading} onClick={markDelivered}>
        Mark Delivered
      </Button>
    )
  }

  return <span className="text-text-muted text-xs">—</span>
}
