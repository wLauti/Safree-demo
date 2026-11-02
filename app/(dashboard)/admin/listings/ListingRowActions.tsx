'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notify } from '@/components/ui/Notification'
import { Star, Archive, CheckCircle } from 'lucide-react'

interface Props {
  type: 'product' | 'experience'
  id: string
  featured: boolean
  status: string
}

export function ListingRowActions({ type, id, featured, status }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const update = async (action: string, body: Record<string, any>) => {
    setBusy(true)
    const res = await fetch(`/api/admin/listings/${type}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (res.ok) { notify.success('Updated'); router.refresh() }
    else notify.error((await res.json()).error ?? 'Failed')
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        title={featured ? 'Unfeature' : 'Feature on homepage'}
        disabled={busy}
        onClick={() => update('feature', { featured: !featured })}
        className={`p-1.5 rounded transition-colors ${featured ? 'text-accent-cream' : 'text-text-muted hover:text-accent-cream'}`}
      >
        <Star className="h-4 w-4" fill={featured ? 'currentColor' : 'none'} />
      </button>
      {status !== 'active' && (
        <button title="Override → approve" disabled={busy} onClick={() => update('override', { status: 'active' })}
          className="p-1.5 rounded text-text-muted hover:text-green-400 transition-colors">
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
      {status !== 'archived' && (
        <button title="Remove (archive)" disabled={busy} onClick={() => update('remove', { status: 'archived' })}
          className="p-1.5 rounded text-text-muted hover:text-red-primary transition-colors">
          <Archive className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
