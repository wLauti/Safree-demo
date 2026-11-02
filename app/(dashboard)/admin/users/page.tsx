export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils/formatters'
import { UserActions } from './UserActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'User Management — Safree' }

interface Props { searchParams: { role?: string; status?: string; q?: string } }

function roleBadge(role: string): 'verified' | 'pending' | 'new' | 'default' {
  if (role === 'admin') return 'new'
  if (role === 'moderator') return 'verified'
  if (role === 'store') return 'pending'
  return 'default'
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return email
  const visible = name.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(2, name.length - 2))}@${domain}`
}

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, status, created_at, last_active_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (searchParams.role) query = query.eq('role', searchParams.role)
  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.q) query = query.or(`full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`)

  const { data: usersRaw } = await query
  const users = (usersRaw ?? []) as any[]

  const ROLES = ['', 'user', 'store', 'moderator', 'admin']
  const STATUSES = ['', 'active', 'suspended', 'banned']

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">User Management</h1>
        <p className="text-text-muted mb-6">{users.length} users</p>
        <Divider />

        {/* Filters */}
        <form className="flex flex-wrap gap-3 my-6 items-end" method="GET">
          <div>
            <label className="block text-xs text-text-muted mb-1">Search</label>
            <input name="q" defaultValue={searchParams.q ?? ''} placeholder="Name or email" className="input-base text-sm" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Role</label>
            <select name="role" defaultValue={searchParams.role ?? ''} className="input-base text-sm capitalize">
              {ROLES.map(r => <option key={r} value={r}>{r || 'All roles'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Status</label>
            <select name="status" defaultValue={searchParams.status ?? ''} className="input-base text-sm capitalize">
              {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary text-sm h-[42px]">Filter</button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="text-left px-4 py-3 text-text-muted font-body">User</th>
                <th className="text-left px-4 py-3 text-text-muted font-body hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Role</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-body hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-text-muted font-body">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted">No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.avatar_url} name={u.full_name ?? u.email} size="sm" />
                      <span className="text-text-primary">{u.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell font-mono text-xs">{maskEmail(u.email)}</td>
                  <td className="px-4 py-3"><Badge variant={roleBadge(u.role)}>{u.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === 'active' ? 'verified' : 'pending'}>{u.status ?? 'active'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <UserActions userId={u.id} currentRole={u.role} status={u.status ?? 'active'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
