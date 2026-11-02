'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { notify } from '@/components/ui/Notification'
import { Check, X } from 'lucide-react'

const REJECTION_CATEGORIES = [
  'Prohibited content',
  'Price issue',
  'Poor quality images',
  'Incomplete information',
  'Misleading description',
  'Policy violation',
  'Other',
]

interface Props {
  type: 'product' | 'experience'
  id: string
  title: string
  storeName: string
}

export function ModerationActions({ type, id, title, storeName }: Props) {
  const router = useRouter()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [category, setCategory] = useState(REJECTION_CATEGORIES[0])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const approve = async () => {
    setLoading(true)
    const res = await fetch(`/api/moderation/${type}/${id}/approve`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      notify.success(`Approved — "${title}" is now live`)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Approval failed')
    }
  }

  const reject = async () => {
    if (reason.trim().length < 20) {
      notify.error('Reason must be at least 20 characters')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/moderation/${type}/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim(), category }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success('Listing rejected — notification sent')
      setRejectOpen(false)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Rejection failed')
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Button variant="primary" className="bg-green-700 hover:bg-green-600 border-transparent flex-1" loading={loading} onClick={approve} leftIcon={<Check className="h-4 w-4" />}>
          Approve
        </Button>
        <Button variant="primary" className="bg-red-primary hover:bg-red-dark border-transparent flex-1" onClick={() => setRejectOpen(true)} leftIcon={<X className="h-4 w-4" />}>
          Reject
        </Button>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Listing" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Rejection reason category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-base w-full">
              {REJECTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Specific reason <span className="text-text-muted text-xs">(min 20 chars)</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Explain clearly what needs to change so the seller can fix it..."
              className="input-base w-full resize-none"
            />
            <p className={`text-xs mt-1 ${reason.trim().length < 20 ? 'text-text-muted' : 'text-green-400'}`}>
              {reason.trim().length}/20 characters
            </p>
          </div>

          {/* Notification preview */}
          <div className="bg-bg-secondary rounded-card p-3">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Notification preview → {storeName}</p>
            <p className="text-text-primary text-sm font-body">Listing Needs Changes</p>
            <p className="text-text-muted text-sm">
              Your {type} &quot;{title}&quot; was not approved: {reason.trim() || '(your reason here)'}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" className="bg-red-primary border-transparent flex-1" loading={loading} onClick={reject} disabled={reason.trim().length < 20}>
              Confirm Rejection
            </Button>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
