export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatters'
import { PromoteStoreForm } from './PromoteStoreForm'
import { Store, Mountain } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Stores — Safree' }

interface StoreRow {
  id: string
  name: string
  subtype: 'store' | 'coto'
  location_state: string | null
  location_city: string | null
  is_verified: boolean
  is_active: boolean
  created_at: string
  profiles: { email: string; full_name: string | null } | null
}

export default async function ModeratorStoresPage() {
  await requireRole(['admin', 'moderator'])
  const supabase = createServiceClient()

  const { data: storesRaw } = await supabase
    .from('stores')
    .select('id, name, subtype, location_state, location_city, is_verified, is_active, created_at, profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(300)

  const stores = (storesRaw ?? []) as unknown as StoreRow[]

  const cotoCount = stores.filter(s => s.subtype === 'coto').length
  const shopCount = stores.length - cotoCount

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Stores</h1>
        <p className="text-text-muted mb-6">
          {stores.length} total · {shopCount} gear store{shopCount !== 1 ? 's' : ''} · {cotoCount} coto{cotoCount !== 1 ? 's' : ''}
        </p>
        <Divider />

        {/* Promote form */}
        <div className="my-6 max-w-2xl">
          <PromoteStoreForm />
        </div>

        <Divider />

        {/* Stores table */}
        <div className="overflow-x-auto rounded-card border border-border mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="text-left px-4 py-3 text-text-muted font-body">Store</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Type</th>
                <th className="text-left px-4 py-3 text-text-muted font-body hidden md:table-cell">Owner</th>
                <th className="text-left px-4 py-3 text-text-muted font-body hidden lg:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                <th className="text-right px-4 py-3 text-text-muted font-body hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted">No stores yet.</td></tr>
              ) : stores.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/moderator/stores/${s.id}`} className="text-accent-cream hover:underline font-body">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {s.subtype === 'coto' ? (
                      <Badge variant="new"><Mountain className="h-3 w-3 mr-1 inline" />Coto</Badge>
                    ) : (
                      <Badge variant="default"><Store className="h-3 w-3 mr-1 inline" />Gear Store</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    <div className="flex flex-col">
                      <span>{s.profiles?.full_name ?? '—'}</span>
                      <span className="text-xs font-mono">{s.profiles?.email ?? ''}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden lg:table-cell">
                    {[s.location_city, s.location_state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.is_verified
                      ? <Badge variant="verified">Verified</Badge>
                      : <Badge variant="pending">Unverified</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted text-xs hidden lg:table-cell">
                    {formatDate(s.created_at)}
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
