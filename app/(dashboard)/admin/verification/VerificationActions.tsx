'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { notify } from '@/components/ui/Notification'

export function VerificationActions({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const call = async (action: 'approve' | 'reject') => {
    setLoading(true)
    const res = await fetch(`/api/admin/verification/${storeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: reason.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success(action === 'approve' ? `${storeName} verified` : 'Verification rejected')
      setRejectOpen(false)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Action failed')
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="bg-green-700 border-transparent" loading={loading} onClick={() => call('approve')}>
          Approve
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setRejectOpen(true)}>Reject</Button>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Verification" size="sm">
        <div className="space-y-4">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejection (min 10 chars)..."
            className="input-base w-full resize-none"
          />
          <div className="flex gap-3">
            <Button variant="primary" className="bg-red-primary border-transparent" loading={loading} disabled={reason.trim().length < 10} onClick={() => call('reject')}>
              Confirm Rejection
            </Button>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
