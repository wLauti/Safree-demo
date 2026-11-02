export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductsGrid } from '@/components/products/ProductsGrid'
import { Heart } from 'lucide-react'
import type { Product } from '@/lib/types/product'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Saved Items — Safree' }

export default async function SavedItemsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: savedRaw } = await supabase
    .from('saved_items')
    .select('product_id, products(id, store_id, category_id, title, slug, price, compare_at_price, images, stock, condition, state_location, status, species_ids, created_at, updated_at, views, stores(id, name, slug, logo_url, is_verified), categories(id, name, slug))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const products = ((savedRaw ?? [])
    .map((row: any) => row.products)
    .filter((p: any) => p && p.status === 'active')) as unknown as Product[]

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Saved Items</h1>
        <p className="text-text-muted mb-6">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        <Divider />
        <div className="mt-6">
          {products.length > 0 ? (
            <ProductsGrid products={products} mode="grid" />
          ) : (
            <div className="py-16">
              <EmptyState
                icon={<Heart />}
                title="No saved items yet"
                description="Tap the heart icon on any product to save it for later."
                action={{ label: 'Browse Products', href: '/products' }}
              />
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
