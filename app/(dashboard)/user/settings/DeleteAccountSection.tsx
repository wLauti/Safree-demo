'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'

export function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm }),
    })
    if (res.ok) {
      const { message } = await res.json()
      notify.success(message ?? 'Account deleted')
      await createClient().auth.signOut()
      router.push('/')
    } else {
      setLoading(false)
      notify.error((await res.json()).error ?? 'Deletion failed')
    }
  }

  return (
    <div className="card-base p-5 border-red-primary/30">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-primary" />
        <h3 className="font-heading text-text-primary">Delete My Account</h3>
      </div>
      <p className="text-text-muted text-sm mb-4">
        Permanently delete your account and personal data. Orders and bookings are anonymized and retained
        for financial/legal records. This cannot be undone.
      </p>
      <Button variant="ghost" className="text-red-primary hover:text-red-dark border border-red-primary/40" onClick={() => setOpen(true)}>
        Delete My Account
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <p className="text-text-muted text-sm">
            This is permanent. Type <strong className="text-red-primary">DELETE</strong> to confirm.
          </p>
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="input-base w-full"
          />
          <p className="text-text-muted text-xs">
            Some data may take up to 30 days to fully purge from encrypted backups.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" className="bg-red-primary border-transparent" loading={loading} disabled={confirm !== 'DELETE'} onClick={handleDelete}>
              Permanently Delete
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
