export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { Tabs } from '@/components/ui/Tabs'
import { Avatar } from '@/components/ui/Avatar'
import { ProductGallery } from '@/components/products/ProductGallery'
import { ProductQASection } from '@/components/products/ProductQASection'
import { ReviewsSection } from '@/components/products/ReviewsSection'
import { AddToCartSection } from './AddToCartSection'
import { AgeDisclaimer } from '@/components/legal/AgeDisclaimer'
import { RelatedProducts } from './RelatedProducts'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { MapPin, Star, Share2, Flag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Product, ProductQA, ProductReview, ProductSpec, StoreInfo } from '@/lib/types/product'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const base = supabase
    .from('products')
    .select('title, description')
    .eq('status', 'active')
  const { data } = isUuid
    ? await base.eq('id', params.slug).single()
    : await base.eq('slug', params.slug).single()
  if (!data) return { title: 'Product Not Found' }
  return {
    title: (data as { title: string }).title,
    description: (data as { description: string | null }).description?.slice(0, 160) ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = createClient()

  // Fetch product — slug or bare UUID both work
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const productQuery = supabase
    .from('products')
    .select(`
      id, store_id, category_id, title, slug, description, price, compare_at_price,
      images, stock, condition, state_location, video_url, shipping_notes, views,
      status, species_ids, created_at, updated_at, rejection_reason,
      stores(id, name, slug, logo_url, banner_url, is_verified, location_state, location_city, description, created_at, subtype),
      categories(id, name, slug)
    `)
    .eq('status', 'active')

  const { data: productRaw } = isUuid
    ? await productQuery.eq('id', params.slug).single()
    : await productQuery.eq('slug', params.slug).single()

  if (!productRaw) notFound()

  const product = productRaw as unknown as Product
  const store = product.stores as unknown as StoreInfo

  const [{ data: specsRaw }, { data: qaRaw }, { data: reviewsRaw }] = await Promise.all([
    supabase.from('product_specs').select('*').eq('product_id', product.id).order('sort_order'),
    supabase.from('product_qa')
      .select('id, product_id, asked_by, question, answer, answered_at, created_at, asker:profiles!asked_by(full_name, avatar_url)')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false }),
    supabase.from('reviews')
      .select('id, ref_type, ref_id, user_id, rating, body, created_at, reviewer:profiles!user_id(full_name, avatar_url)')
      .eq('ref_type', 'order')
      .limit(50),
  ])

  const specs = (specsRaw ?? []) as unknown as ProductSpec[]
  const qa = (qaRaw ?? []) as unknown as ProductQA[]
  const reviews = (reviewsRaw ?? []) as unknown as ProductReview[]

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const isOnSale = product.compare_at_price && product.compare_at_price > product.price
  const stockLabel =
    product.stock === 0
      ? 'Out of Stock'
      : product.stock <= 3
      ? `Last ${product.stock} unit${product.stock > 1 ? 's' : ''}!`
      : `In Stock (${product.stock} available)`

  const category = product.categories as unknown as { name: string; slug: string } | null

  return (
    <>
      <PageWrapper>
        {/* Breadcrumb */}
        <Breadcrumb
          className="mb-6"
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Marketplace', href: '/products' },
            ...(category ? [{ label: category.name, href: `/products?category=${category.slug}` }] : []),
            { label: product.title },
          ]}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Gallery */}
          <ProductGallery images={product.images ?? []} title={product.title} />

          {/* Info panel */}
          <div className="flex flex-col gap-4">
            {/* Title & condition */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={product.condition === 'new' ? 'new' : 'default'}>
                  {product.condition === 'new' ? 'New' : 'Used'}
                </Badge>
                {isOnSale && <Badge variant="sale">Sale</Badge>}
              </div>
              <h1 className="text-h2 text-text-primary leading-tight">{product.title}</h1>
            </div>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <Rating value={Math.round(avgRating)} readonly size="sm" />
                <span className="text-sm text-text-muted">
                  {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-4xl text-accent-cream">{formatCurrency(product.price)}</span>
              {isOnSale && (
                <span className="text-text-muted text-xl line-through">{formatCurrency(product.compare_at_price!)}</span>
              )}
            </div>

            {/* Location */}
            {product.state_location && (
              <div className="flex items-center gap-1.5 text-sm text-text-muted">
                <MapPin className="h-4 w-4 text-red-primary" />
                <span>{product.state_location}</span>
              </div>
            )}

            {/* Stock */}
            <p className={`text-sm font-medium ${product.stock === 0 ? 'text-red-primary' : product.stock <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
              {stockLabel}
            </p>

            <Divider className="my-1" />

            {/* Add to cart — client component for interactivity */}
            <AddToCartSection product={product} />

            <AgeDisclaimer />

            <Divider className="my-1" />

            {/* Store card */}
            <div className="card-base p-4 flex items-center gap-4">
              <Avatar src={store.logo_url} name={store.name} size="md" verified={store.is_verified} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-text-primary">{store.name}</p>
                  {store.is_verified && <Badge variant="verified">Verified</Badge>}
                </div>
                {store.location_state && (
                  <p className="text-xs text-text-muted">{store.location_city ?? store.location_state}</p>
                )}
                <p className="text-xs text-text-muted">Member since {formatDate(store.created_at)}</p>
              </div>
              <Link
                href={`/stores/${store.slug}`}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-red-primary hover:text-accent-cream transition-colors"
              >
                View Store <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Share + Report */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-primary transition-colors">
                <Flag className="h-3.5 w-3.5" /> Report Listing
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              id: 'description',
              label: 'Description',
              content: (
                <div className="prose prose-invert max-w-none text-text-muted leading-relaxed text-sm whitespace-pre-wrap">
                  {product.description ?? 'No description provided.'}
                  {product.shipping_notes && (
                    <div className="mt-6 card-base p-4">
                      <p className="text-label text-text-muted mb-2">Shipping Details</p>
                      <p className="text-sm text-text-primary">{product.shipping_notes}</p>
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: 'specs',
              label: 'Specifications',
              content: specs.length ? (
                <div className="rounded-card overflow-hidden border border-border">
                  <table className="w-full text-sm">
                    <tbody>
                      {specs.map((spec, i) => (
                        <tr key={spec.id} className={i % 2 === 0 ? 'bg-bg-secondary' : 'bg-bg-primary'}>
                          <td className="px-4 py-3 text-text-muted font-medium w-1/3">{spec.key}</td>
                          <td className="px-4 py-3 text-text-primary">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-muted text-sm">No specifications listed.</p>
              ),
            },
            {
              id: 'qa',
              label: 'Q&A',
              badge: qa.length,
              content: <ProductQASection productId={product.id} initialQA={qa} />,
            },
            {
              id: 'reviews',
              label: 'Reviews',
              badge: reviews.length,
              content: <ReviewsSection reviews={reviews} avgRating={avgRating} total={reviews.length} />,
            },
          ]}
        />
      </PageWrapper>

      {/* Related products */}
      <div className="border-t border-border mt-12">
        <PageWrapper>
          <RelatedProducts
            categoryId={product.category_id}
            storeId={product.store_id}
            currentId={product.id}
          />
        </PageWrapper>
      </div>
    </>
  )
}
