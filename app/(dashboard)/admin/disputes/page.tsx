export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { EmptyState } from '@/components/ui/EmptyState'
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge'
import { formatRelativeDate } from '@/lib/utils/formatters'
import { Scale } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Disputes — Admin — Safree' }

interface Props { searchParams: { status?: string } }

export default async function AdminDisputesPage({ searchParams }: Props) {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  let query = supabase
    .from('disputes')
    .select('id, ref_number, ref_type, reason_category, status, created_at, stores(name), profiles!disputes_opened_by_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  const { data: disputesRaw } = await query
  const disputes = (disputesRaw ?? []) as any[]

  const STATUSES = ['', 'open', 'under_review', 'resolved_refund', 'resolved_no_refund']

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Disputes</h1>
        <p className="text-text-muted mb-6">{disputes.length} dispute{disputes.length !== 1 ? 's' : ''}</p>
        <Divider />

        <div className="flex gap-1 flex-wrap my-5">
          {STATUSES.map(st => (
            <a key={st} href={st ? `/admin/disputes?status=${st}` : '/admin/disputes'}
              className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${(searchParams.status ?? '') === st ? 'bg-red-primary text-accent-cream' : 'bg-bg-secondary text-text-muted hover:text-text-primary'}`}>
              {st ? st.replace(/_/g, ' ') : 'All'}
            </a>
          ))}
        </div>

        {disputes.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<Scale />} title="No disputes" description="No disputes match this filter." />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="text-left px-4 py-3 text-text-muted font-body">Ref</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body">Reason</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body hidden md:table-cell">Store</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                  <th className="text-right px-4 py-3 text-text-muted font-body">Opened</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/disputes/${d.id}`} className="font-mono text-accent-cream hover:underline">{d.ref_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted capitalize hidden sm:table-cell">{d.ref_type}</td>
                    <td className="px-4 py-3 text-text-primary">{d.reason_category}</td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">{d.stores?.name}</td>
                    <td className="px-4 py-3"><DisputeStatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-right text-text-muted text-xs">{formatRelativeDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
