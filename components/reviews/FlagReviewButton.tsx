'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'

const REASONS = ['Spam or fake', 'Offensive language', 'Off-topic', 'Personal information', 'Other']

export function FlagReviewButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    const res = await fetch('/api/content/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref_type: 'review', ref_id: reviewId, reason, details: details.trim() || null }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success('Reported — thank you. Our team will review it.')
      setOpen(false)
    } else {
      notify.error((await res.json()).error ?? 'Could not report')
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[11px] text-text-muted hover:text-red-primary transition-colors">
        Flag this review
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Report Review" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="input-base w-full">
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            placeholder="Additional details (optional)"
            className="input-base w-full resize-none"
          />
          <div className="flex gap-3">
            <Button variant="primary" className="bg-red-primary border-transparent" loading={loading} onClick={submit}>Submit Report</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
