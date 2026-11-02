export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils/formatters'
import { BadgeCheck, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { VerificationActions } from './VerificationActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Provider Verification — Safree' }

export default async function VerificationPage() {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const { data: storesRaw } = await supabase
    .from('stores')
    .select('id, name, slug, subtype, verification_docs, verification_status, created_at, profiles!stores_owner_id_fkey(full_name, email)')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  const stores = (storesRaw ?? []) as any[]

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Provider Verification</h1>
        <p className="text-text-muted mb-6">{stores.length} pending verification{stores.length !== 1 ? 's' : ''}</p>

        {stores.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<BadgeCheck />} title="No pending verifications" description="All caught up. New verification requests will appear here." />
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map(store => (
              <div key={store.id} className="card-base p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/stores/${store.slug ?? store.id}`} target="_blank" className="font-heading text-lg text-text-primary hover:text-accent-cream flex items-center gap-1">
                        {store.name} <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Badge variant={store.subtype === 'coto' ? 'new' : 'default'}>{store.subtype === 'coto' ? 'Hunting Ground' : 'Store'}</Badge>
                    </div>
                    <p className="text-text-muted text-sm">
                      {store.profiles?.full_name} · {store.profiles?.email}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">Submitted {formatDate(store.created_at)}</p>

                    {/* Documents */}
                    <div className="mt-3">
                      <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Documents ({store.verification_docs?.length ?? 0})</p>
                      {store.verification_docs?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {store.verification_docs.map((doc: string, i: number) => (
                            <a key={i} href={doc} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-bg-secondary border border-border rounded-card px-3 py-1.5 text-xs text-accent-cream hover:border-red-primary transition-colors">
                              <FileText className="h-3.5 w-3.5" /> Document {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-muted text-xs italic">No documents uploaded</p>
                      )}
                    </div>
                  </div>

                  <VerificationActions storeId={store.id} storeName={store.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
