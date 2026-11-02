export const dynamic = 'force-dynamic'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatters'
import { ClipboardCheck, Flag, Store } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Moderator Dashboard - Safree' }

interface PendingListing {
  id: string
  title: string
  created_at: string
  stores: { name: string } | null
}

export default async function ModeratorPage() {
  await requireRole(['admin', 'moderator'])
  const supabase = createClient()

  const [{ data: prodData }, { data: expData }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, created_at, stores(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20),
    supabase
      .from('experiences')
      .select('id, title, created_at, stores(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20),
  ])

    const pendingProducts = (prodData ?? []) as any as PendingListing[]
    const pendingExperiences = (expData ?? []) as any as PendingListing[]

  return (
    <PageWrapper>
      <h1 className="text-h2 text-text-primary mb-2">Moderator Dashboard</h1>
      <p className="text-text-muted mb-8">Review listings, manage flags and stores</p>
      <Divider />

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <Link href="/moderator/queue" className="card-base p-5 flex items-center gap-4 hover:border-red-primary transition-colors group">
          <div className="bg-red-primary/10 rounded-card p-3 group-hover:bg-red-primary/20 transition-colors">
            <ClipboardCheck className="h-6 w-6 text-red-primary" />
          </div>
          <div>
            <p className="font-heading text-text-primary">Review Queue</p>
            <p className="text-xs text-text-muted">Approve or reject listings</p>
          </div>
        </Link>
        <Link href="/moderator/flagged" className="card-base p-5 flex items-center gap-4 hover:border-accent-cream transition-colors group">
          <div className="bg-accent-cream/10 rounded-card p-3 group-hover:bg-accent-cream/20 transition-colors">
            <Flag className="h-6 w-6 text-accent-cream" />
          </div>
          <div>
            <p className="font-heading text-text-primary">Flagged Content</p>
            <p className="text-xs text-text-muted">Review user reports</p>
          </div>
        </Link>
        <Link href="/moderator/stores" className="card-base p-5 flex items-center gap-4 hover:border-accent-cream transition-colors group">
          <div className="bg-accent-cream/10 rounded-card p-3 group-hover:bg-accent-cream/20 transition-colors">
            <Store className="h-6 w-6 text-accent-cream" />
          </div>
          <div>
            <p className="font-heading text-text-primary">Stores</p>
            <p className="text-xs text-text-muted">Promote users & view stores</p>
          </div>
        </Link>
      </div>

      <Divider />

      <section className="mb-10">
        <h2 className="text-h4 text-text-primary mb-4 flex items-center gap-2">
          Pending Products <Badge variant="pending">{pendingProducts.length}</Badge>
        </h2>
        {pendingProducts.length ? (
          <ul className="space-y-2">
            {pendingProducts.map(p => (
              <li key={p.id} className="card-base flex items-center justify-between p-4">
                <div>
                  <p className="text-text-primary font-body">{p.title}</p>
                  <p className="text-text-muted text-sm">{p.stores?.name} Â· {formatDate(p.created_at)}</p>
                </div>
                <Badge variant="pending">Pending Review</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="text-text-muted text-sm">No products pending review.</p>}
      </section>

      <section>
        <h2 className="text-h4 text-text-primary mb-4 flex items-center gap-2">
          Pending Experiences <Badge variant="pending">{pendingExperiences.length}</Badge>
        </h2>
        {pendingExperiences.length ? (
          <ul className="space-y-2">
            {pendingExperiences.map(e => (
              <li key={e.id} className="card-base flex items-center justify-between p-4">
                <div>
                  <p className="text-text-primary font-body">{e.title}</p>
                  <p className="text-text-muted text-sm">{e.stores?.name} Â· {formatDate(e.created_at)}</p>
                </div>
                <Badge variant="pending">Pending Review</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="text-text-muted text-sm">No experiences pending review.</p>}
      </section>
    </PageWrapper>
  )
}


