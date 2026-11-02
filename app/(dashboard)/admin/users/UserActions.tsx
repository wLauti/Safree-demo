'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const ROLES = ['user', 'store', 'moderator', 'admin']

interface Props {
  userId: string
  currentRole: string
  status: string
}

export function UserActions({ userId, currentRole, status }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [roleModal, setRoleModal] = useState(false)
  const [newRole, setNewRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const call = async (action: string, extra?: Record<string, any>) => {
    setLoading(true)
    setMenuOpen(false)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success('User updated')
      setRoleModal(false)
      router.refresh()
    } else {
      notify.error((await res.json()).error ?? 'Action failed')
    }
  }

  const menuItem = 'w-full text-left px-4 py-2 text-sm hover:bg-bg-primary transition-colors'

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setMenuOpen(v => !v)} className="p-1.5 text-text-muted hover:text-text-primary rounded">
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-30 mt-1 w-40 bg-bg-secondary border border-border rounded-card shadow-card overflow-hidden py-1">
          <button className={cn(menuItem, 'text-text-primary')} onClick={() => { setMenuOpen(false); setRoleModal(true) }}>
            Change Role
          </button>
          {status === 'active' ? (
            <>
              <button className={cn(menuItem, 'text-yellow-300')} onClick={() => call('suspend')}>Suspend</button>
              <button className={cn(menuItem, 'text-red-primary')} onClick={() => call('ban')}>Ban</button>
            </>
          ) : (
            <button className={cn(menuItem, 'text-green-400')} onClick={() => call('unsuspend')}>Reactivate</button>
          )}
        </div>
      )}

      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Change Role" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">New role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-base w-full capitalize">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" loading={loading} onClick={() => call('change_role', { role: newRole })} disabled={newRole === currentRole}>
              Update Role
            </Button>
            <Button variant="ghost" onClick={() => setRoleModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
