export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { FeaturedManager } from './FeaturedManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Featured Content — Safree' }

export default async function FeaturedPage() {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const [{ data: slides }, { data: featuredRaw }, { data: products }, { data: experiences }] = await Promise.all([
    supabase.from('hero_slides').select('*').order('sort_order'),
    supabase.from('featured_content').select('id, section, ref_type, ref_id, sale_price, sort_order').order('sort_order'),
    supabase.from('products').select('id, title').eq('status', 'active').limit(200),
    supabase.from('experiences').select('id, title').eq('status', 'active').limit(200),
  ])

  const options = [
    ...((products ?? []) as any[]).map(p => ({ id: p.id, title: p.title, type: 'product' as const })),
    ...((experiences ?? []) as any[]).map(e => ({ id: e.id, title: e.title, type: 'experience' as const })),
  ]
  const titleMap = new Map(options.map(o => [o.id, o.title]))

  const featured = ((featuredRaw ?? []) as any[]).map(f => ({
    ...f,
    _title: titleMap.get(f.ref_id) ?? '(removed listing)',
  }))

  return (
    <PageWrapper>
      <div className="py-6 max-w-3xl">
        <h1 className="text-h1 text-text-primary mb-1">Featured Content</h1>
        <p className="text-text-muted mb-6">Curate the homepage carousel and featured sections.</p>
        <Divider />
        <div className="mt-6">
          <FeaturedManager slides={(slides ?? []) as any[]} featured={featured} options={options} />
        </div>
      </div>
    </PageWrapper>
  )
}
