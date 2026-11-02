export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Tabs } from '@/components/ui/Tabs'
import { ProductsGrid } from '@/components/products/ProductsGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExperienceCard } from '@/components/ui/Card'
import { SearchIcon } from 'lucide-react'
import type { Product } from '@/lib/types/product'
import type { Metadata } from 'next'

interface Props {
  searchParams: { q?: string }
}

export function generateMetadata({ searchParams }: Props): Metadata {
  return { title: searchParams.q ? `"${searchParams.q}" — Search` : 'Search — Safree' }
}

interface Experience {
  id: string
  title: string
  slug: string
  price_per_person: number
  images: string[]
  state_location: string
  type: string
  stores: { id: string; name: string; slug: string; logo_url: string | null; is_verified: boolean } | null
}

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q ?? '').trim()
  const supabase = createClient()

  let products: Product[] = []
  let experiences: Experience[] = []

  if (q) {
    const term = q.split(/\s+/).join(' & ')

    const [{ data: productsRaw }, { data: experiencesRaw }] = await Promise.all([
      supabase
        .from('products')
        .select('id, store_id, category_id, title, slug, price, compare_at_price, images, stock, condition, state_location, status, species_ids, created_at, updated_at, views, stores(id, name, slug, logo_url, is_verified), categories(id, name, slug)')
        .eq('status', 'active')
        .textSearch('search_vector', term, { config: 'english' })
        .limit(48),
      supabase
        .from('experiences')
        .select('id, title, slug, price_per_person, images, state_location, type, stores(id, name, slug, logo_url, is_verified)')
        .eq('status', 'active')
        .textSearch('search_vector', term, { config: 'english' })
        .limit(24),
    ])

    products = (productsRaw ?? []) as unknown as Product[]
    experiences = (experiencesRaw ?? []) as unknown as Experience[]
  }

  const noQuery = !q
  const noResults = q && products.length === 0 && experiences.length === 0

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">
          {noQuery ? 'Search' : `Results for "${q}"`}
        </h1>
        <p className="text-text-muted mb-6">
          {noQuery
            ? 'Use the search bar to find products, hunting grounds, and more.'
            : `${products.length} product${products.length !== 1 ? 's' : ''} · ${experiences.length} experience${experiences.length !== 1 ? 's' : ''}`}
        </p>
        <Divider />
        <div className="mt-6">
          {noQuery || noResults ? (
            <div className="py-16">
              <EmptyState
                icon={<SearchIcon />}
                title={noQuery ? 'Start your search' : 'No results found'}
                description={
                  noQuery
                    ? 'Search for gear, experiences, and hunting grounds across Texas.'
                    : `No results for "${q}". Try different keywords or browse the marketplace.`
                }
                action={noResults ? { label: 'Browse Products', href: '/products' } : undefined}
              />
            </div>
          ) : (
            <Tabs
              tabs={[
                {
                  id: 'products',
                  label: 'Products',
                  badge: products.length,
                  content: products.length > 0
                    ? <ProductsGrid products={products} mode="grid" />
                    : (
                      <div className="py-12">
                        <EmptyState
                          icon={<SearchIcon />}
                          title="No products found"
                          description="Try a different search term or browse all products."
                          action={{ label: 'Browse Products', href: '/products' }}
                        />
                      </div>
                    ),
                },
                {
                  id: 'experiences',
                  label: 'Experiences',
                  badge: experiences.length,
                  content: experiences.length > 0
                    ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {experiences.map(exp => (
                          <ExperienceCard
                            key={exp.id}
                            id={exp.id}
                            title={exp.title}
                            price_per_person={exp.price_per_person}
                            image_url={exp.images?.[0] ?? null}
                            location_state={exp.state_location}
                          />
                        ))}
                      </div>
                    )
                    : (
                      <div className="py-12">
                        <EmptyState
                          icon={<SearchIcon />}
                          title="No experiences found"
                          description="Try a different search term or explore the map."
                          action={{ label: 'Explore Map', href: '/map' }}
                        />
                      </div>
                    ),
                },
              ]}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
