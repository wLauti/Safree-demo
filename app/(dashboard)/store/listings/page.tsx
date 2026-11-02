export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { Plus, ShoppingBag, Eye, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Listings — Safree' }

interface Listing {
  id: string
  title: string
  slug: string | null
  price: number
  compare_at_price: number | null
  stock: number
  status: 'pending' | 'active' | 'rejected' | 'archived'
  rejection_reason: string | null
  views: number
  images: string[]
  created_at: string
  categories: { name: string } | null
}

function statusVariant(s: string): 'verified' | 'pending' | 'new' | 'default' {
  if (s === 'active') return 'verified'
  if (s === 'pending') return 'pending'
  if (s === 'rejected') return 'pending'
  return 'default'
}

export default async function StoreListingsPage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: storeData } = await supabase
    .from('stores')
    .select('id, name, subtype')
    .eq('owner_id', profile.id)
    .single()

  const store = storeData as any as { id: string; name: string; subtype: string } | null

  // Cotos use experiences, not product listings
  if (store?.subtype === 'coto') redirect('/store/experiences')

  if (!store) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h1 className="text-h2 text-text-primary mb-4">No Store Found</h1>
          <p className="text-text-muted">You need to set up your store first.</p>
        </div>
      </PageWrapper>
    )
  }

  const { data: listingsRaw } = await supabase
    .from('products')
    .select('id, title, slug, price, compare_at_price, stock, status, rejection_reason, views, images, created_at, categories(name)')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  const listings = (listingsRaw ?? []) as unknown as Listing[]

  return (
    <PageWrapper>
      <div className="py-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-h1 text-text-primary">My Listings</h1>
          <Link href="/store/listings/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Create New Listing
            </Button>
          </Link>
        </div>
        <p className="text-text-muted mb-6">{listings.length} listing{listings.length !== 1 ? 's' : ''} for {store.name}</p>
        <Divider />

        <div className="mt-6">
          {listings.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<ShoppingBag />}
                title="No listings yet"
                description="Create your first product listing to start selling on Safree."
                action={{ label: 'Create Listing', href: '/store/listings/new' }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="text-left px-4 py-3 text-text-muted font-body font-medium">Product</th>
                    <th className="text-left px-4 py-3 text-text-muted font-body font-medium hidden sm:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-text-muted font-body font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-text-muted font-body font-medium hidden md:table-cell">Stock</th>
                    <th className="text-right px-4 py-3 text-text-muted font-body font-medium">Price</th>
                    <th className="text-right px-4 py-3 text-text-muted font-body font-medium hidden lg:table-cell">Views</th>
                    <th className="text-right px-4 py-3 text-text-muted font-body font-medium hidden lg:table-cell">Date</th>
                    <th className="text-right px-4 py-3 text-text-muted font-body font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, idx) => {
                    const imageUrl = listing.images?.[0] ?? null
                    const href = listing.slug ? `/products/${listing.slug}` : `/products/${listing.id}`
                    return (
                      <>
                        <tr
                          key={listing.id}
                          className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors"
                        >
                          {/* Product */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded bg-bg-primary overflow-hidden flex-shrink-0">
                                {imageUrl
                                  ? <Image src={imageUrl} alt={listing.title} fill className="object-cover" sizes="40px" />
                                  : <div className="w-full h-full bg-bg-primary" />
                                }
                              </div>
                              <Link href={href} className="text-text-primary hover:text-accent-cream transition-colors font-body line-clamp-2 max-w-[200px]">
                                {listing.title}
                              </Link>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                            {listing.categories?.name ?? '—'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(listing.status)}>
                              {listing.status}
                            </Badge>
                          </td>

                          {/* Stock */}
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span className={listing.stock === 0 ? 'text-red-primary' : 'text-text-primary'}>
                              {listing.stock}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-3 text-right font-heading text-accent-cream">
                            {formatCurrency(listing.price)}
                            {listing.compare_at_price && (
                              <span className="block text-xs text-text-muted line-through font-body">
                                {formatCurrency(listing.compare_at_price)}
                              </span>
                            )}
                          </td>

                          {/* Views */}
                          <td className="px-4 py-3 text-right text-text-muted hidden lg:table-cell">
                            <span className="flex items-center justify-end gap-1">
                              <Eye className="h-3.5 w-3.5" />{listing.views}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-right text-text-muted text-xs hidden lg:table-cell">
                            {formatDate(listing.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <Link href={`/store/listings/${listing.id}/edit`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                          </td>
                        </tr>

                        {/* Rejection reason inline row */}
                        {listing.status === 'rejected' && listing.rejection_reason && (
                          <tr key={`${listing.id}-rejection`} className="bg-red-primary/5 border-b border-border last:border-0">
                            <td colSpan={8} className="px-4 py-2">
                              <div className="flex items-start gap-2 text-xs text-red-primary">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                <span><strong>Rejected:</strong> {listing.rejection_reason}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
