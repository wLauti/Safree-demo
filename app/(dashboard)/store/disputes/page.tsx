export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { EmptyState } from '@/components/ui/EmptyState'
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge'
import { RespondButton } from './RespondButton'
import { formatRelativeDate } from '@/lib/utils/formatters'
import { Scale } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Disputes — Safree' }

export default async function StoreDisputesPage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: store } = await supabase.from('stores').select('id, name').eq('owner_id', profile.id).single()
  const s = store as any
  if (!s) return <PageWrapper><div className="py-20 text-center text-text-muted">Store not found.</div></PageWrapper>

  const { data: disputesRaw } = await supabase
    .from('disputes')
    .select('id, ref_number, ref_type, reason_category, status, description, evidence_urls, store_response, resolution_type, created_at')
    .eq('store_id', s.id)
    .order('created_at', { ascending: false })

  const disputes = (disputesRaw ?? []) as any[]

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Disputes</h1>
        <p className="text-text-muted mb-6">{s.name}</p>
        <Divider />

        {disputes.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<Scale />} title="No disputes" description="No disputes have been opened against your store." />
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
                <p className="text-text-primary text-sm font-body">{d.reason_category}</p>
                <p className="text-text-muted text-sm mt-1">{d.description}</p>

                {d.evidence_urls?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {d.evidence_urls.map((url: string, i: number) => (
                      <Link key={i} href={url} target="_blank" className="text-xs text-accent-cream hover:underline">Evidence {i + 1}</Link>
                    ))}
                  </div>
                )}

                {d.store_response ? (
                  <div className="mt-3 bg-bg-secondary rounded-card p-2">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Your response</p>
                    <p className="text-text-muted text-sm">{d.store_response}</p>
                  </div>
                ) : d.status === 'open' ? (
                  <div className="mt-3">
                    <RespondButton disputeId={d.id} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
