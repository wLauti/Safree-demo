'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { notify } from '@/components/ui/Notification'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'

const ORDER_REASONS = ['Item not received', 'Item not as described', 'Item damaged', 'Wrong item sent', 'Other']
const BOOKING_REASONS = ['Experience not as described', 'Species not present as advertised', 'Unsafe conditions', 'Guide no-show', 'Accommodation not as described', 'Other']

interface Props {
  refType: 'order' | 'booking'
  refId: string
}

export function OpenDisputeButton({ refType, refId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState((refType === 'order' ? ORDER_REASONS : BOOKING_REASONS)[0])
  const [description, setDescription] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const reasons = refType === 'order' ? ORDER_REASONS : BOOKING_REASONS

  const handleFiles = async (files: File[]) => {
    if (evidence.length + files.length > 5) { notify.error('Max 5 files'); return }
    setUploading(true)
    const supabase = createClient()
    const urls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `disputes/${refId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('disputes').upload(path, file)
      if (error) { notify.error(`Upload failed: ${file.name}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('disputes').getPublicUrl(path)
      urls.push(publicUrl)
    }
    setEvidence(prev => [...prev, ...urls])
    setUploading(false)
  }

  const submit = async () => {
    if (description.trim().length < 50) { notify.error('Description must be at least 50 characters'); return }
    setLoading(true)
    const res = await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref_type: refType, ref_id: refId, reason_category: category, description: description.trim(), evidence_urls: evidence }),
    })
    setLoading(false)
    if (res.ok) {
      const { refNumber } = await res.json()
      notify.success(`Dispute opened — ${refNumber}`)
      setOpen(false)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Could not open dispute')
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-red-primary hover:underline">
        Open Dispute
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Open a Dispute" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-bg-secondary rounded-card p-3">
            <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted">
              Disputes are reviewed by Safree. The provider has 3 business days to respond before we step in.
            </p>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">Reason</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-base w-full">
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              What happened? <span className="text-text-muted text-xs">(min 50 chars)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="Describe the issue in detail..."
              className="input-base w-full resize-none"
            />
            <p className={`text-xs mt-1 text-right ${description.trim().length < 50 ? 'text-text-muted' : 'text-green-400'}`}>
              {description.trim().length}/50 min · {description.length}/2000
            </p>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Evidence <span className="text-text-muted text-xs">(optional, max 5 files)</span>
            </label>
            {evidence.length > 0 && (
              <p className="text-xs text-green-400 mb-2">{evidence.length} file(s) attached</p>
            )}
            {evidence.length < 5 && (
              <FileUpload
                onFilesChange={handleFiles}
                accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] }}
                multiple
                maxFiles={5 - evidence.length}
                maxSize={10 * 1024 * 1024}
                label={uploading ? 'Uploading...' : undefined}
              />
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" className="bg-red-primary border-transparent" loading={loading} onClick={submit} disabled={description.trim().length < 50}>
              Submit Dispute
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
