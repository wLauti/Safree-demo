export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ListingForm } from '../ListingForm'
import type { Category } from '@/lib/types/product'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Listing — Safree' }

export default async function NewListingPage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const [{ data: storeData }, { data: categoriesRaw }] = await Promise.all([
    supabase.from('stores').select('id, name').eq('owner_id', profile.id).single(),
    supabase.from('categories').select('id, name, slug, type, sort_order, icon_url').eq('type', 'product').order('sort_order'),
  ])

  const store = storeData as any as { id: string; name: string } | null
  const categories = (categoriesRaw ?? []) as unknown as Category[]

  if (!store) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-text-muted">Store not found. Please set up your store first.</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb
          crumbs={[
            { label: 'Dashboard', href: '/store' },
            { label: 'Listings', href: '/store/listings' },
            { label: 'New Listing' },
          ]}
        />
        <h1 className="text-h1 text-text-primary mt-4 mb-8">Create New Listing</h1>
        <ListingForm storeId={store.id} categories={categories} />
      </div>
    </PageWrapper>
  )
}
