export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils/formatters'
import { Flag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { FlagActions } from './FlagActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Flagged Content — Safree' }

export default async function FlaggedPage() {
  await requireRole(['admin', 'moderator'])
  const supabase = createServiceClient()

  const { data: flagsRaw } = await supabase
    .from('content_flags')
    .select('id, ref_type, ref_id, reason, details, status, created_at, profiles!content_flags_reported_by_fkey(full_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const flags = (flagsRaw ?? []) as any[]

  // Resolve referenced titles
  const enriched = await Promise.all(flags.map(async (flag) => {
    let title = '(content)'
    let url = '#'
    if (flag.ref_type === 'product') {
      const { data } = await supabase.from('products').select('title').eq('id', flag.ref_id).single()
      title = (data as any)?.title ?? title
      url = `/products/${flag.ref_id}`
    } else if (flag.ref_type === 'experience') {
      const { data } = await supabase.from('experiences').select('title, slug').eq('id', flag.ref_id).single()
      title = (data as any)?.title ?? title
      url = `/experiences/${(data as any)?.slug ?? flag.ref_id}`
    } else if (flag.ref_type === 'review') {
      const { data } = await supabase.from('reviews').select('body').eq('id', flag.ref_id).single()
      title = `Review: "${((data as any)?.body ?? '').slice(0, 60)}…"`
    }
    return { ...flag, _title: title, _url: url }
  }))

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Flagged Content</h1>
        <p className="text-text-muted mb-6">User-reported listings and reviews awaiting review</p>

        {enriched.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<Flag />} title="No open flags" description="Nothing has been reported. The community is behaving." />
          </div>
        ) : (
          <div className="space-y-3">
            {enriched.map(flag => (
              <div key={flag.id} className="card-base p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default">{flag.ref_type}</Badge>
                      <Badge variant="pending">{flag.reason}</Badge>
                    </div>
                    {flag._url !== '#' ? (
                      <Link href={flag._url} target="_blank" className="text-text-primary font-body hover:text-accent-cream flex items-center gap-1">
                        {flag._title} <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <p className="text-text-primary font-body">{flag._title}</p>
                    )}
                    {flag.details && <p className="text-text-muted text-sm mt-1">{flag.details}</p>}
                    <p className="text-text-muted text-xs mt-1">
                      Reported by {flag.profiles?.full_name ?? 'a user'} · {formatDate(flag.created_at)}
                    </p>
                  </div>
                  <FlagActions flagId={flag.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
