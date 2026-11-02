'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { notify } from '@/components/ui/Notification'
import { Eye, EyeOff, Lock, Pencil, ShieldAlert } from 'lucide-react'

interface Field {
  service: string
  label: string
  encrypted: boolean
  type: 'text' | 'number'
  hint: string | null
  masked: string
  isSet: boolean
  updatedAt: string | null
}
interface Group { name: string; fields: Field[] }

const REVEAL_SECONDS = 30

export function CredentialsPanel({ groups }: { groups: Group[] }) {
  // ── Re-auth gate ──────────────────────────────────────────
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const sessionPassword = useRef<string>('')

  const reauth = async () => {
    setAuthLoading(true)
    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reauth', password }),
    })
    setAuthLoading(false)
    if (res.ok) {
      sessionPassword.current = password
      setUnlocked(true)
      setPassword('')
    } else {
      notify.error('Password incorrect')
    }
  }

  // ── Reveal state ──────────────────────────────────────────
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const t = timers.current
    return () => { Object.values(t).forEach(clearTimeout) }
  }, [])

  const reveal = async (service: string) => {
    if (revealed[service] !== undefined) {
      // hide
      setRevealed(prev => { const n = { ...prev }; delete n[service]; return n })
      clearTimeout(timers.current[service])
      return
    }
    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reveal', password: sessionPassword.current, service }),
    })
    if (!res.ok) { notify.error('Could not reveal — re-authenticate'); setUnlocked(false); return }
    const { value } = await res.json()
    setRevealed(prev => ({ ...prev, [service]: value }))
    timers.current[service] = setTimeout(() => {
      setRevealed(prev => { const n = { ...prev }; delete n[service]; return n })
    }, REVEAL_SECONDS * 1000)
  }

  // ── Edit state ────────────────────────────────────────────
  const [editing, setEditing] = useState<Field | null>(null)
  const [editValue, setEditValue] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEdit = (field: Field) => {
    setEditing(field)
    setEditValue(revealed[field.service] ?? '')
    setConfirmOpen(true)
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', password: sessionPassword.current, service: editing.service, value: editValue }),
    })
    setSaving(false)
    if (res.ok) {
      notify.success(`${editing.label} updated`)
      setConfirmOpen(false)
      setEditing(null)
      window.location.reload()
    } else {
      notify.error((await res.json()).error ?? 'Update failed')
    }
  }

  // ── Re-auth screen ────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="card-base p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-red-primary" />
          </div>
          <h2 className="font-heading text-xl text-text-primary mb-2">Confirm Your Identity</h2>
          <p className="text-text-muted text-sm mb-6">
            This page contains sensitive credentials. Re-enter your password to continue.
          </p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && reauth()}
            placeholder="Your password"
            className="input-base w-full mb-4"
            autoFocus
          />
          <Button variant="primary" className="w-full" loading={authLoading} onClick={reauth} disabled={!password}>
            Unlock Credentials
          </Button>
        </div>
      </div>
    )
  }

  // ── Unlocked view ─────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2 bg-red-primary/10 border border-red-primary/30 rounded-card p-3">
        <ShieldAlert className="h-4 w-4 text-red-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">
          All changes are logged to the audit trail. Revealed values auto-hide after {REVEAL_SECONDS} seconds.
          Secrets are never stored unencrypted and are decrypted only on the server at runtime.
        </p>
      </div>

      {groups.map(group => (
        <section key={group.name}>
          <h2 className="font-heading text-lg text-text-primary mb-3">{group.name}</h2>
          <div className="space-y-2">
            {group.fields.map(field => {
              const isRevealed = revealed[field.service] !== undefined
              return (
                <div key={field.service} className="card-base p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary text-sm font-body">{field.label}</p>
                    {field.hint && <p className="text-text-muted text-xs">{field.hint}</p>}
                    <p className="font-mono text-sm mt-1 text-accent-cream break-all">
                      {isRevealed ? revealed[field.service] || '(empty)' : field.masked}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {field.encrypted && (
                      <button onClick={() => reveal(field.service)} title={isRevealed ? 'Hide' : 'Reveal'}
                        className="p-2 text-text-muted hover:text-accent-cream transition-colors">
                        {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                    <button onClick={() => startEdit(field)} title="Edit"
                      className="p-2 text-text-muted hover:text-accent-cream transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* Edit confirmation modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={`Edit ${editing?.label ?? ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">New value</label>
            <input
              type={editing?.encrypted ? 'password' : (editing?.type ?? 'text')}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              placeholder={editing?.hint ?? ''}
              className="input-base w-full font-mono"
              autoFocus
            />
          </div>
          <div className="bg-bg-secondary rounded-card p-3 text-xs text-text-muted">
            This change will be recorded in the audit log with your admin ID and a timestamp.
            {editing?.service === 'allowed_origins' && ' CORS changes apply on the next request.'}
          </div>
          <div className="flex gap-3">
            <Button variant="primary" loading={saving} onClick={saveEdit}>Confirm &amp; Save</Button>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
