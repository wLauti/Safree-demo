import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import { Divider } from '@/components/ui/Divider'
import type { Product } from '@/lib/types/product'

interface RelatedProductsProps {
  categoryId: string | null
  storeId: string
  currentId: string
}

export async function RelatedProducts({ categoryId, storeId, currentId }: RelatedProductsProps) {
  const supabase = createClient()

  const { data } = await supabase
    .from('products')
    .select('id, store_id, category_id, title, slug, price, compare_at_price, images, stock, condition, state_location, status, species_ids, created_at, updated_at, views, stores(id, name, slug, logo_url, is_verified), categories(id, name, slug)')
    .eq('status', 'active')
    .neq('id', currentId)
    .or(categoryId ? `category_id.eq.${categoryId},store_id.eq.${storeId}` : `store_id.eq.${storeId}`)
    .limit(6)

  const products = (data ?? []) as unknown as Product[]
  if (!products.length) return null

  return (
    <div className="py-10">
      <Divider />
      <h2 className="font-heading text-2xl text-text-primary mt-8 mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.map(p => (
          <ProductCard key={p.id} product={p} mode="grid" />
        ))}
      </div>
    </div>
  )
}
