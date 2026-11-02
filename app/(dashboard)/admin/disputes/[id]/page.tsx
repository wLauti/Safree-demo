export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge'
import { ResolveActions } from './ResolveActions'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props { params: { id: string } }
export const metadata: Metadata = { title: 'Dispute Detail — Safree' }

export default async function AdminDisputeDetailPage({ params }: Props) {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const { data: disputeRaw } = await supabase
    .from('disputes')
    .select(`
      id, ref_number, ref_type, ref_id, reason_category, description, evidence_urls,
      store_response, store_evidence_urls, status, resolution_type, refund_amount,
      resolution_note, created_at,
      stores(id, name), profiles!disputes_opened_by_user_id_fkey(full_name, email)
    `)
    .eq('id', params.id)
    .single()
  const d = disputeRaw as any
  if (!d) notFound()

  // Underlying transaction
  const table = d.ref_type === 'order' ? 'orders' : 'bookings'
  const { data: txnRaw } = await supabase
    .from(table)
    .select('id, total, status, created_at')
    .eq('id', d.ref_id)
    .single()
  const txn = txnRaw as any

  const resolved = ['resolved_refund', 'resolved_no_refund', 'closed'].includes(d.status)

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb crumbs={[{ label: 'Disputes', href: '/admin/disputes' }, { label: d.ref_number }]} />

        <div className="flex items-center gap-3 mt-4 mb-6 flex-wrap">
          <h1 className="text-h2 text-text-primary">{d.ref_number}</h1>
          <DisputeStatusBadge status={d.status} />
          <span className="text-text-muted text-sm capitalize">· {d.ref_type} dispute</span>
        </div>
        <Divider />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Buyer's claim */}
            <div className="card-base p-5">
              <h3 className="font-heading text-text-primary mb-1">Buyer&apos;s Claim</h3>
              <p className="text-text-muted text-xs mb-3">
                {d.profiles?.full_name} ({d.profiles?.email}) · {formatDate(d.created_at)}
              </p>
              <p className="text-accent-cream text-sm font-body mb-2">{d.reason_category}</p>
              <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">{d.description}</p>
              {d.evidence_urls?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {d.evidence_urls.map((url: string, i: number) => (
                    <Link key={i} href={url} target="_blank" className="flex items-center gap-1 text-xs text-accent-cream hover:underline bg-bg-secondary px-2 py-1 rounded">
                      <FileText className="h-3 w-3" /> Evidence {i + 1}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Store response */}
            <div className="card-base p-5">
              <h3 className="font-heading text-text-primary mb-1">Seller&apos;s Response</h3>
              <p className="text-text-muted text-xs mb-3">{d.stores?.name}</p>
              {d.store_response ? (
                <>
                  <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">{d.store_response}</p>
                  {d.store_evidence_urls?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {d.store_evidence_urls.map((url: string, i: number) => (
                        <Link key={i} href={url} target="_blank" className="flex items-center gap-1 text-xs text-accent-cream hover:underline bg-bg-secondary px-2 py-1 rounded">
                          <FileText className="h-3 w-3" /> Evidence {i + 1}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-text-muted text-sm italic">No response submitted yet.</p>
              )}
            </div>

            {resolved && (
              <div className="card-base p-5 border-accent-cream/30">
                <h3 className="font-heading text-text-primary mb-2">Resolution</h3>
                <p className="text-accent-cream text-sm capitalize">{d.resolution_type?.replace(/_/g, ' ')}</p>
                {d.refund_amount > 0 && <p className="text-text-muted text-sm">Refunded: {formatCurrency(d.refund_amount)}</p>}
                {d.resolution_note && <p className="text-text-muted text-sm mt-2">{d.resolution_note}</p>}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card-base p-4 text-sm space-y-2">
              <h3 className="font-heading text-text-primary mb-1">Transaction</h3>
              <div className="flex justify-between"><span className="text-text-muted">Type</span><span className="text-text-primary capitalize">{d.ref_type}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Amount</span><span className="text-accent-cream font-heading">{formatCurrency(txn?.total ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Status</span><span className="text-text-primary capitalize">{txn?.status}</span></div>
            </div>

            {!resolved && <ResolveActions disputeId={d.id} total={txn?.total ?? 0} />}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
