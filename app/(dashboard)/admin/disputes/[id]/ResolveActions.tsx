'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { formatCurrency } from '@/lib/utils/formatters'

export function ResolveActions({ disputeId, total }: { disputeId: string; total: number }) {
  const router = useRouter()
  const [choice, setChoice] = useState<'full_refund' | 'partial_refund' | 'no_refund' | null>(null)
  const [partialAmount, setPartialAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const resolve = async () => {
    if (!choice) return
    if (choice === 'partial_refund') {
      const amt = parseFloat(partialAmount)
      if (!amt || amt <= 0 || amt > total) { notify.error('Enter a valid partial amount'); return }
    }
    setLoading(true)
    const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolution_type: choice,
        refund_amount: choice === 'partial_refund' ? parseFloat(partialAmount) : undefined,
        note: note.trim() || undefined,
      }),
    })
    setLoading(false)
    if (res.ok) {
      const { refundAmount } = await res.json()
      notify.success(refundAmount > 0 ? `Resolved — ${formatCurrency(refundAmount)} refunded` : 'Resolved with no refund')
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Resolution failed')
    }
  }

  const opt = (val: typeof choice, label: string, desc: string) => (
    <button
      onClick={() => setChoice(val)}
      className={`w-full text-left p-3 rounded-card border transition-colors ${choice === val ? 'border-accent-cream bg-accent-cream/5' : 'border-border hover:border-red-primary/40'}`}
    >
      <p className="text-text-primary text-sm font-body">{label}</p>
      <p className="text-text-muted text-xs">{desc}</p>
    </button>
  )

  return (
    <div className="card-base p-5 space-y-4">
      <h3 className="font-heading text-text-primary">Resolve Dispute</h3>
      <div className="space-y-2">
        {opt('full_refund', 'Full Refund', `Refund the full ${formatCurrency(total)} to the buyer`)}
        {opt('partial_refund', 'Partial Refund', 'Refund a specified amount to the buyer')}
        {opt('no_refund', 'No Refund', "Resolve in the seller's favor")}
      </div>

      {choice === 'partial_refund' && (
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Refund amount (max {formatCurrency(total)})</label>
          <input type="number" step="0.01" min="0" max={total} value={partialAmount} onChange={e => setPartialAmount(e.target.value)} className="input-base w-full" />
        </div>
      )}

      <div>
        <label className="block text-sm text-text-muted mb-1.5">Resolution note <span className="text-text-muted text-xs">(optional)</span></label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="input-base w-full resize-none" placeholder="Internal/shared note about the decision" />
      </div>

      <Button variant="primary" className="w-full" loading={loading} disabled={!choice} onClick={resolve}>
        Confirm Resolution
      </Button>
    </div>
  )
}
