import type { ProductFilters, Product } from '@/lib/types/product'
import { PRODUCTS_PER_PAGE } from '@/lib/utils/constants'

export function buildProductQuery(
  supabase: ReturnType<typeof import('./server')['createClient']>,
  filters: ProductFilters
) {
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

  if (filters.category_slug) {
    // Join through category slug
    query = query.eq('categories.slug', filters.category_slug)
  }

  if (filters.price_min !== undefined) {
    query = query.gte('price', filters.price_min)
  }
  if (filters.price_max !== undefined && filters.price_max < 5000) {
    query = query.lte('price', filters.price_max)
  }

  if (filters.condition && filters.condition !== 'all') {
    query = query.eq('condition', filters.condition)
  }

  if (filters.state) {
    query = query.eq('state_location', filters.state)
  }

  if (filters.on_sale) {
    query = query.not('compare_at_price', 'is', null)
    query = query.lt('price', 'compare_at_price')
  }

  // Sort
  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'top_rated':
      query = query.order('views', { ascending: false }) // proxy until avg_rating is computed
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Pagination
  const page = Math.max(1, filters.page ?? 1)
  const from = (page - 1) * PRODUCTS_PER_PAGE
  query = query.range(from, from + PRODUCTS_PER_PAGE - 1)

  return query
}
