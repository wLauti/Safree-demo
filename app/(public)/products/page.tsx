export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PhotoBanner } from '@/components/layout/PhotoBanner'
import { IMG } from '@/lib/utils/images'
import { ProductsPageClient } from './ProductsPageClient'
import type { Category, Product, ProductFilters } from '@/lib/types/product'
import { PRODUCTS_PER_PAGE } from '@/lib/utils/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Outdoor Marketplace' }

interface Props {
  searchParams: Record<string, string | undefined>
}

export default async function ProductsPage({ searchParams }: Props) {
  const supabase = createClient()

  const filters: ProductFilters = {
    q: searchParams.q,
    category_slug: searchParams.category,
    price_min: searchParams.price_min ? Number(searchParams.price_min) : undefined,
    price_max: searchParams.price_max ? Number(searchParams.price_max) : undefined,
    condition: (searchParams.condition as ProductFilters['condition']) ?? 'all',
    state: searchParams.state,
    min_rating: searchParams.min_rating ? Number(searchParams.min_rating) : 0,
    on_sale: searchParams.on_sale === '1',
    sort: (searchParams.sort as ProductFilters['sort']) ?? 'newest',
    page: searchParams.page ? Number(searchParams.page) : 1,
  }

  const page = Math.max(1, filters.page ?? 1)
  const from = (page - 1) * PRODUCTS_PER_PAGE
  const to = from + PRODUCTS_PER_PAGE - 1

  // Base query
  let query = supabase
    .from('products')
    .select(
      'id, store_id, category_id, title, slug, description, price, compare_at_price, images, stock, condition, state_location, status, views, species_ids, created_at, updated_at, stores(id, name, slug, logo_url, is_verified), categories(id, name, slug)',
      { count: 'exact' }
    )
    .eq('status', 'active')

  if (filters.q) {
    const term = filters.q.trim().split(/\s+/).join(' & ')
    query = query.textSearch('search_vector', term, { config: 'english' })
  }
  if (filters.price_min !== undefined) query = query.gte('price', filters.price_min)
  if (filters.price_max !== undefined && filters.price_max < 5000) query = query.lte('price', filters.price_max)
  if (filters.condition && filters.condition !== 'all') query = query.eq('condition', filters.condition)
  if (filters.state) query = query.eq('state_location', filters.state)
  if (filters.on_sale) query = (query as typeof query).not('compare_at_price', 'is', null)

  switch (filters.sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'newest': query = query.order('created_at', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  query = query.range(from, to)

  const [{ data: productsRaw, count }, { data: categoriesRaw }] = await Promise.all([
    query,
    supabase
      .from('categories')
      .select('id, name, slug, type, sort_order, icon_url')
      .eq('type', 'product')
      .order('sort_order'),
  ])

  const products = (productsRaw ?? []) as unknown as Product[]
  const categories = (categoriesRaw ?? []) as unknown as Category[]

  // Filter by category slug client-side (since join filter on embedded table is tricky)
  const filtered = filters.category_slug
    ? products.filter(p => (p.categories as unknown as Category | null)?.slug === filters.category_slug)
    : products

  return (
    <>
      <PhotoBanner
        image={IMG.marketplace}
        eyebrow="Outdoor Marketplace"
        title="Gear Up for the Hunt"
        subtitle={
          <>
            Premium hunting and fishing gear from verified Texas sellers.
            {filters.q && <> Showing results for <strong className="text-accent-cream">&quot;{filters.q}&quot;</strong></>}
          </>
        }
      />
      <PageWrapper>
        <div className="py-2">
          <ProductsPageClient
            products={filtered}
            total={count ?? 0}
            page={page}
            categories={categories}
          />
        </div>
      </PageWrapper>
    </>
  )
}
