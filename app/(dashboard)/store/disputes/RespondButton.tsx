'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { notify } from '@/components/ui/Notification'
import { createClient } from '@/lib/supabase/client'

export function RespondButton({ disputeId }: { disputeId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [response, setResponse] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFiles = async (files: File[]) => {
    if (evidence.length + files.length > 5) { notify.error('Max 5 files'); return }
    setUploading(true)
    const supabase = createClient()
    const urls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `disputes/${disputeId}/store-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('disputes').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('disputes').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    setEvidence(prev => [...prev, ...urls])
    setUploading(false)
  }

  const submit = async () => {
    if (response.trim().length < 50) { notify.error('Response must be at least 50 characters'); return }
    setLoading(true)
    const res = await fetch(`/api/disputes/${disputeId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: response.trim(), evidence_urls: evidence }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success('Response submitted')
      setOpen(false)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Failed to submit')
    }
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>Respond to Dispute</Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Respond to Dispute" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Your response <span className="text-text-muted text-xs">(min 50 chars)</span></label>
            <textarea value={response} onChange={e => setResponse(e.target.value)} rows={5} placeholder="Explain your side and provide context..." className="input-base w-full resize-none" />
            <p className={`text-xs mt-1 text-right ${response.trim().length < 50 ? 'text-text-muted' : 'text-green-400'}`}>{response.trim().length}/50</p>
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Evidence <span className="text-text-muted text-xs">(optional, max 5)</span></label>
            {evidence.length > 0 && <p className="text-xs text-green-400 mb-2">{evidence.length} file(s) attached</p>}
            {evidence.length < 5 && (
              <FileUpload onFilesChange={handleFiles} accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] }} multiple maxFiles={5 - evidence.length} maxSize={10 * 1024 * 1024} label={uploading ? 'Uploading...' : undefined} />
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="primary" loading={loading} onClick={submit} disabled={response.trim().length < 50}>Submit Response</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
