'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'

export function FlagActions({ flagId }: { flagId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'dismiss' | 'remove' | null>(null)

  const act = async (action: 'dismiss' | 'remove') => {
    setLoading(action)
    const res = await fetch(`/api/moderation/flags/${flagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setLoading(null)
    if (res.ok) {
      const { status } = await res.json()
      notify.success(status === 'escalated' ? 'Escalated to Admin for removal' : `Flag ${status}`)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Action failed')
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" loading={loading === 'dismiss'} onClick={() => act('dismiss')}>
        Dismiss
      </Button>
      <Button variant="primary" size="sm" className="bg-red-primary border-transparent" loading={loading === 'remove'} onClick={() => act('remove')}>
        Remove Content
      </Button>
    </div>
  )
}
