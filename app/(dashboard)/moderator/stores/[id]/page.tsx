export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { Store, Mountain, MapPin, Mail, User, Star, ExternalLink, CreditCard } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Store Detail — Safree' }

interface Props { params: { id: string } }

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (s === 'active') return 'verified'
  if (s === 'pending') return 'pending'
  return 'default'
}

export default async function ModeratorStoreDetailPage({ params }: Props) {
  await requireRole(['admin', 'moderator'])
  const supabase = createServiceClient()

  const { data: storeRaw } = await supabase
    .from('stores')
    .select(`
      id, name, slug, description, subtype, logo_url, banner_url,
      location_state, location_city, is_verified, is_active, verification_status,
      rating_avg, review_count, stripe_onboarding_complete, stripe_charges_enabled,
      created_at, profiles(email, full_name, phone)
    `)
    .eq('id', params.id)
    .single()

  if (!storeRaw) notFound()
  const store = storeRaw as any

  const [{ data: productsRaw }, { data: experiencesRaw }] = await Promise.all([
    supabase
      .from('products')
      .select('id, slug, title, price, stock, status, images, condition, views, created_at')
      .eq('store_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('experiences')
      .select('id, slug, title, type, price_per_person, status, images, location_state, created_at')
      .eq('store_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  const products = (productsRaw ?? []) as any[]
  const experiences = (experiencesRaw ?? []) as any[]
  const isCoto = store.subtype === 'coto'

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb crumbs={[
          { label: 'Stores', href: '/moderator/stores' },
          { label: store.name },
        ]} />

        {/* Banner */}
        {store.banner_url && (
          <div className="relative h-40 w-full rounded-card overflow-hidden bg-bg-secondary mt-4">
            <Image src={store.banner_url} alt="" fill className="object-cover" sizes="100vw" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mt-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
            {store.logo_url
              ? <Image src={store.logo_url} alt={store.name} fill className="object-cover" sizes="64px" />
              : <div className="w-full h-full flex items-center justify-center font-heading text-2xl text-text-muted">{store.name[0]}</div>}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-h2 text-text-primary">{store.name}</h1>
              {isCoto
                ? <Badge variant="new"><Mountain className="h-3 w-3 mr-1 inline" />Coto</Badge>
                : <Badge variant="default"><Store className="h-3 w-3 mr-1 inline" />Gear Store</Badge>}
              {store.is_verified
                ? <Badge variant="verified">Verified</Badge>
                : <Badge variant="pending">Unverified</Badge>}
              {!store.is_active && <Badge variant="default">Inactive</Badge>}
            </div>
            {store.slug && (
              <Link href={`/stores/${store.slug}`} target="_blank" className="text-xs text-text-muted hover:text-accent-cream flex items-center gap-1 mt-1">
                View public page <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="card-base p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Owner</p>
            <p className="text-text-primary flex items-center gap-2"><User className="h-4 w-4 text-text-muted" />{store.profiles?.full_name ?? '—'}</p>
            <p className="text-text-muted text-sm flex items-center gap-2 mt-1 font-mono"><Mail className="h-4 w-4" />{store.profiles?.email ?? '—'}</p>
            {store.profiles?.phone && <p className="text-text-muted text-sm mt-1">{store.profiles.phone}</p>}
          </div>
          <div className="card-base p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Location</p>
            <p className="text-text-primary flex items-center gap-2">
              <MapPin className="h-4 w-4 text-text-muted" />
              {[store.location_city, store.location_state].filter(Boolean).join(', ') || '—'}
            </p>
            <p className="text-text-muted text-xs mt-2">Joined {formatDate(store.created_at)}</p>
          </div>
          <div className="card-base p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Rating & Payments</p>
            <p className="text-text-primary flex items-center gap-2">
              <Star className="h-4 w-4 text-accent-cream" />
              {store.rating_avg ? `${store.rating_avg.toFixed(1)} (${store.review_count})` : 'No reviews'}
            </p>
            <p className="text-text-muted text-sm flex items-center gap-2 mt-1">
              <CreditCard className="h-4 w-4" />
              Stripe: {store.stripe_charges_enabled ? 'Active' : store.stripe_onboarding_complete ? 'Onboarded' : 'Not set up'}
            </p>
          </div>
        </div>

        {/* Description */}
        {store.description && (
          <div className="mt-4 card-base p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Description</p>
            <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">{store.description}</p>
          </div>
        )}

        <Divider className="my-8" />

        {/* Products */}
        {!isCoto && (
          <section className="mb-10">
            <h2 className="font-heading text-lg text-text-primary mb-4">Products ({products.length})</h2>
            {products.length === 0 ? (
              <p className="text-text-muted text-sm">No products yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-card border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-secondary">
                      <th className="text-left px-4 py-3 text-text-muted font-body">Product</th>
                      <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                      <th className="text-right px-4 py-3 text-text-muted font-body hidden sm:table-cell">Stock</th>
                      <th className="text-right px-4 py-3 text-text-muted font-body">Price</th>
                      <th className="text-right px-4 py-3 text-text-muted font-body hidden md:table-cell">Views</th>
                      <th className="text-right px-4 py-3 text-text-muted font-body">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded overflow-hidden bg-bg-secondary flex-shrink-0">
                              {p.images?.[0] && <Image src={p.images[0]} alt="" fill className="object-cover" sizes="40px" />}
                            </div>
                            <span className="text-text-primary line-clamp-1 max-w-[200px]">{p.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell text-text-muted">{p.stock}</td>
                        <td className="px-4 py-3 text-right text-accent-cream font-heading">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3 text-right text-text-muted hidden md:table-cell">{p.views ?? 0}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/products/${p.slug ?? p.id}`} target="_blank" className="text-accent-cream hover:underline text-xs inline-flex items-center gap-1">
                            Open <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Experiences */}
        <section>
          <h2 className="font-heading text-lg text-text-primary mb-4">Experiences ({experiences.length})</h2>
          {experiences.length === 0 ? (
            <p className="text-text-muted text-sm">No experiences yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="text-left px-4 py-3 text-text-muted font-body">Experience</th>
                    <th className="text-left px-4 py-3 text-text-muted font-body">Type</th>
                    <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                    <th className="text-left px-4 py-3 text-text-muted font-body hidden lg:table-cell">Location</th>
                    <th className="text-right px-4 py-3 text-text-muted font-body">Price</th>
                    <th className="text-right px-4 py-3 text-text-muted font-body">View</th>
                  </tr>
                </thead>
                <tbody>
                  {experiences.map(e => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-10 rounded overflow-hidden bg-bg-secondary flex-shrink-0">
                            {e.images?.[0] && <Image src={e.images[0]} alt="" fill className="object-cover" sizes="40px" />}
                          </div>
                          <span className="text-text-primary line-clamp-1 max-w-[200px]">{e.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted capitalize">{e.type ?? '—'}</td>
                      <td className="px-4 py-3"><Badge variant={statusVariant(e.status)}>{e.status}</Badge></td>
                      <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{e.location_state ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-accent-cream font-heading">{formatCurrency(e.price_per_person)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/experiences/${e.slug ?? e.id}`} target="_blank" className="text-accent-cream hover:underline text-xs inline-flex items-center gap-1">
                          Open <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  )
}
