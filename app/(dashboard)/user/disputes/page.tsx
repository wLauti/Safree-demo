export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { EmptyState } from '@/components/ui/EmptyState'
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge'
import { formatRelativeDate, formatCurrency } from '@/lib/utils/formatters'
import { Scale } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Disputes — Safree' }

export default async function UserDisputesPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: disputesRaw } = await supabase
    .from('disputes')
    .select('id, ref_number, ref_type, reason_category, status, description, store_response, resolution_type, refund_amount, created_at, stores(name)')
    .eq('opened_by_user_id', user.id)
    .order('created_at', { ascending: false })

  const disputes = (disputesRaw ?? []) as any[]

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">My Disputes</h1>
        <p className="text-text-muted mb-6">{disputes.length} dispute{disputes.length !== 1 ? 's' : ''}</p>
        <Divider />

        {disputes.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<Scale />} title="No disputes" description="You haven't opened any disputes. We hope it stays that way!" />
          </div>
        ) : (
          <div className="space-y-3 mt-6">
            {disputes.map(d => (
              <div key={d.id} className="card-base p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-text-muted text-sm">{d.ref_number}</span>
                    <DisputeStatusBadge status={d.status} />
                  </div>
                  <span className="text-text-muted text-xs">{formatRelativeDate(d.created_at)}</span>
                </div>
                <p className="text-text-primary text-sm">{d.reason_category} · {d.stores?.name}</p>
                <p className="text-text-muted text-sm mt-1 line-clamp-2">{d.description}</p>
                {d.store_response && (
                  <div className="mt-2 bg-bg-secondary rounded-card p-2">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Seller response</p>
                    <p className="text-text-muted text-sm line-clamp-2">{d.store_response}</p>
                  </div>
                )}
                {d.resolution_type && (
                  <p className="text-accent-cream text-sm mt-2">
                    Resolution: {d.resolution_type.replace('_', ' ')}
                    {d.refund_amount > 0 && ` · ${formatCurrency(d.refund_amount)} refunded`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
