export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { runListingChecks, type ModerationFlag } from '@/lib/moderation/checks'
import { ModerationActions } from './ModerationActions'
import { CheckCircle, AlertTriangle, ClipboardCheck, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Moderation Queue — Safree' }

interface Props { searchParams: { tab?: string } }

export default async function ModerationQueuePage({ searchParams }: Props) {
  await requireRole(['admin', 'moderator'])
  const tab = searchParams.tab === 'experiences' ? 'experiences' : 'products'
  const supabase = createServiceClient()

  const table = tab === 'products' ? 'products' : 'experiences'
  const priceCol = tab === 'products' ? 'price' : 'price_per_person'

  const { data: itemsRaw } = await supabase
    .from(table)
    .select(`
      id, title, description, images, status, category_id, moderation_flags, created_at, ${priceCol},
      stores(id, name, slug, is_verified, verification_status)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const items = (itemsRaw ?? []) as any[]

  // Compute flags for items that don't have them yet, and persist
  const itemsWithFlags = await Promise.all(items.map(async (item) => {
    let flags = (item.moderation_flags ?? []) as ModerationFlag[]
    if (!flags || flags.length === 0) {
      flags = await runListingChecks({
        title: item.title,
        description: item.description,
        price: item[priceCol],
        category_id: item.category_id,
        images: item.images ?? [],
      })
      await supabase.from(table).update({ moderation_flags: flags }).eq('id', item.id)
    }
    return { ...item, _flags: flags }
  }))

  // Counts for both tabs
  const [{ count: productCount }, { count: expCount }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const singular = tab === 'products' ? 'product' : 'experience'

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Moderation Queue</h1>
        <p className="text-text-muted mb-6">Review pending listings before they go live</p>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border mb-6">
          <Link href="/moderator/queue?tab=products"
            className={`px-5 py-3 text-sm font-body font-medium border-b-2 -mb-px transition-colors ${tab === 'products' ? 'text-accent-cream border-red-primary' : 'text-text-muted border-transparent hover:text-text-primary'}`}>
            Products
            {(productCount ?? 0) > 0 && <span className="ml-2 text-[10px] bg-red-primary text-accent-cream rounded-full px-1.5 py-0.5">{productCount}</span>}
          </Link>
          <Link href="/moderator/queue?tab=experiences"
            className={`px-5 py-3 text-sm font-body font-medium border-b-2 -mb-px transition-colors ${tab === 'experiences' ? 'text-accent-cream border-red-primary' : 'text-text-muted border-transparent hover:text-text-primary'}`}>
            Experiences
            {(expCount ?? 0) > 0 && <span className="ml-2 text-[10px] bg-red-primary text-accent-cream rounded-full px-1.5 py-0.5">{expCount}</span>}
          </Link>
        </div>

        {itemsWithFlags.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<ClipboardCheck />} title="Queue is clear" description={`No ${singular}s pending review. Great work!`} />
          </div>
        ) : (
          <div className="space-y-6">
            {itemsWithFlags.map(item => (
              <ModerationCard key={item.id} item={item} type={singular as 'product' | 'experience'} priceCol={priceCol} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

function ModerationCard({ item, type, priceCol }: { item: any; type: 'product' | 'experience'; priceCol: string }) {
  const flags = (item._flags ?? []) as ModerationFlag[]
  const store = item.stores
  const detailUrl = type === 'product' ? `/products/${item.id}` : `/experiences/${item.slug ?? item.id}`

  return (
    <div className="card-base p-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Image gallery */}
        <div className="lg:col-span-1">
          <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-bg-secondary mb-2">
            {item.images?.[0]
              ? <Image src={item.images[0]} alt={item.title} fill className="object-cover" sizes="320px" />
              : <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">No image</div>
            }
          </div>
          {item.images?.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {item.images.slice(1, 5).map((img: string, i: number) => (
                <div key={i} className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-bg-secondary">
                  <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg text-text-primary">{item.title}</h3>
              <p className="text-accent-cream font-heading">{formatCurrency(item[priceCol])}{type === 'experience' && <span className="text-text-muted text-xs"> / person</span>}</p>
            </div>
            <Link href={detailUrl} target="_blank" className="text-xs text-text-muted hover:text-accent-cream flex items-center gap-1 flex-shrink-0">
              Preview <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Store info */}
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/stores/${store?.slug ?? store?.id}`} target="_blank" className="text-accent-cream hover:underline">
              {store?.name}
            </Link>
            {store?.is_verified
              ? <Badge variant="verified">Verified</Badge>
              : <Badge variant="pending">Unverified</Badge>}
            <span className="text-text-muted text-xs">· Submitted {formatDate(item.created_at)}</span>
          </div>

          {/* Description */}
          {item.description && (
            <details className="text-sm">
              <summary className="text-text-muted cursor-pointer hover:text-text-primary">Description</summary>
              <p className="text-text-muted mt-2 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </details>
          )}

          {/* Red flag section */}
          <div className="bg-bg-secondary rounded-card p-3 space-y-1.5">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Automated Checks</p>
            {flags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {f.status === 'pass'
                  ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />}
                <span className={f.status === 'pass' ? 'text-text-muted' : 'text-yellow-300'}>{f.message}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <ModerationActions type={type} id={item.id} title={item.title} storeName={store?.name ?? 'the seller'} />
        </div>
      </div>
    </div>
  )
}
