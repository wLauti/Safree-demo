export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ListingForm } from '../../ListingForm'
import type { Category, Product } from '@/lib/types/product'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Listing — Safree' }

interface Props { params: { id: string } }

export default async function EditListingPage({ params }: Props) {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const [{ data: storeData }, { data: productRaw }, { data: categoriesRaw }] = await Promise.all([
    supabase.from('stores').select('id, name').eq('owner_id', profile.id).single(),
    supabase
      .from('products')
      .select('id, store_id, category_id, title, slug, description, price, compare_at_price, images, stock, condition, state_location, video_url, shipping_notes, status, rejection_reason, species_ids')
      .eq('id', params.id)
      .single(),
    supabase.from('categories').select('id, name, slug, type, sort_order, icon_url').eq('type', 'product').order('sort_order'),
  ])

  const store = storeData as any as { id: string; name: string } | null
  const product = productRaw as any as Product | null
  const categories = (categoriesRaw ?? []) as unknown as Category[]

  // Ensure listing belongs to this store owner
  if (!store || !product || product.store_id !== store.id) notFound()

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb
          crumbs={[
            { label: 'Dashboard', href: '/store' },
            { label: 'Listings', href: '/store/listings' },
            { label: 'Edit Listing' },
          ]}
        />
        <h1 className="text-h1 text-text-primary mt-4 mb-8">Edit Listing</h1>
        <ListingForm storeId={store.id} categories={categories} product={product} />
      </div>
    </PageWrapper>
  )
}
