'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { Store } from 'lucide-react'

export function PromoteStoreForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/moderator/promote-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      notify.error(json.error ?? 'Failed to promote account')
      return
    }
    notify.success(`${json.email} is now a store account`)
    setEmail('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card-base p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-red-primary" />
        <h2 className="font-heading text-lg text-text-primary">Promote a user to Store</h2>
      </div>
      <p className="text-text-muted text-sm">
        Enter the email of an existing user account to grant it store access.
      </p>
      {error && (
        <div className="p-3 rounded-card bg-red-primary/10 border border-red-primary text-red-primary text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="input-base flex-1"
        />
        <Button type="submit" variant="primary" loading={loading}>
          Make Store
        </Button>
      </div>
    </form>
  )
}
