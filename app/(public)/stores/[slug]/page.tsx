export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { ReviewsSection } from '@/components/products/ReviewsSection'
import { ProductsGrid } from '@/components/products/ProductsGrid'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils/formatters'
import { IMG } from '@/lib/utils/images'
import { MapPin, ShieldCheck, Calendar } from 'lucide-react'
import Image from 'next/image'
import type { Product, ProductReview, StoreInfo } from '@/lib/types/product'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const base = supabase.from('stores').select('name')
  const { data } = isUuid
    ? await base.eq('id', params.slug).single()
    : await base.eq('slug', params.slug).single()
  return { title: (data as { name: string } | null)?.name ?? 'Store' }
}

export default async function StoreProfilePage({ params }: Props) {
  const supabase = createClient()

  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const storeQuery = supabase
    .from('stores')
    .select('id, name, slug, logo_url, banner_url, is_verified, location_state, location_city, description, created_at, subtype')
    .eq('is_active', true)

  const { data: storeRaw } = isUuid
    ? await storeQuery.eq('id', params.slug).single()
    : await storeQuery.eq('slug', params.slug).single()

  if (!storeRaw) notFound()
  const store = storeRaw as unknown as StoreInfo

  const [{ data: productsRaw }, { count: salesCount }, { data: reviewsRaw }] = await Promise.all([
    supabase
      .from('products')
      .select('id, store_id, category_id, title, slug, price, compare_at_price, images, stock, condition, state_location, status, species_ids, created_at, updated_at, views, stores(id, name, slug, logo_url, is_verified), categories(id, name, slug)')
      .eq('store_id', store.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)
      .in('status', ['paid', 'shipped', 'delivered']),
    supabase
      .from('reviews')
      .select('id, ref_type, ref_id, user_id, rating, body, created_at, reviewer:profiles!user_id(full_name, avatar_url)')
      .eq('ref_type', 'order')
      .limit(50),
  ])

  const products = (productsRaw ?? []) as unknown as Product[]
  const reviews = (reviewsRaw ?? []) as unknown as ProductReview[]
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <>
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-bg-secondary overflow-hidden">
        {store.banner_url ? (
          <Image src={store.banner_url} alt={`${store.name} banner`} fill className="object-cover" />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${IMG.storeFallback}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 to-transparent" />
      </div>

      <PageWrapper>
        {/* Store header */}
        <div className="flex flex-col sm:flex-row gap-5 -mt-12 mb-8">
          <Avatar
            src={store.logo_url}
            name={store.name}
            size="xl"
            verified={store.is_verified}
            className="ring-4 ring-bg-primary"
          />
          <div className="flex-1 pt-4 sm:pt-14">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-heading text-3xl text-text-primary">{store.name}</h1>
              {store.is_verified && <Badge variant="verified"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>}
              <Badge variant="default">{store.subtype === 'coto' ? 'Hunting Ground' : 'Store'}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              {(store.location_city || store.location_state) && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{store.location_city ? `${store.location_city}, ${store.location_state}` : store.location_state}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Member since {formatDate(store.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sales', value: salesCount ?? 0 },
            { label: 'Avg Rating', value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—' },
            { label: 'Reviews', value: reviews.length },
            { label: 'Listings', value: products.length },
          ].map(stat => (
            <div key={stat.label} className="card-base p-4 text-center">
              <p className="font-heading text-2xl text-accent-cream">{stat.value}</p>
              <p className="text-label text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <Divider />

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              id: 'listings',
              label: 'All Listings',
              badge: products.length,
              content: products.length
                ? <ProductsGrid products={products} mode="grid" />
                : <p className="text-text-muted text-sm">No active listings.</p>,
            },
            {
              id: 'reviews',
              label: 'Reviews',
              badge: reviews.length,
              content: <ReviewsSection reviews={reviews} avgRating={avgRating} total={reviews.length} />,
            },
            {
              id: 'about',
              label: 'About',
              content: (
                <div className="max-w-2xl">
                  <p className="text-text-muted leading-relaxed text-sm">
                    {store.description ?? 'This store has not provided a description yet.'}
                  </p>
                </div>
              ),
            },
          ]}
        />
      </PageWrapper>
    </>
  )
}
