export const dynamic = 'force-dynamic'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StatCard } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import {
  ShoppingBag, MapPin, ShoppingCart, DollarSign,
  Store, Plus, List, Settings, Calendar, Mountain,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Store Dashboard - Safree' }

export default async function StoreDashboardPage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: storeRaw } = await supabase
    .from('stores')
    .select('id, name, subtype')
    .eq('owner_id', profile.id)
    .single()

  const store = storeRaw as { id: string; name: string; subtype: 'store' | 'coto' } | null

  if (!store) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <Store className="h-16 w-16 text-red-primary mx-auto mb-6" />
          <h1 className="text-h2 text-text-primary mb-3">Set Up Your Store</h1>
          <p className="text-text-muted mb-8 max-w-sm mx-auto">
            You haven&apos;t created a store yet. Set up your storefront to start selling gear or listing experiences.
          </p>
          <Link href="/store/new">
            <Button variant="primary" size="lg">Create My Store</Button>
          </Link>
        </div>
      </PageWrapper>
    )
  }

  const isCoto = store.subtype === 'coto'

  const [
    { count: productCount },
    { count: experienceCount },
    { count: orderCount },
    { count: bookingCount },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
  ])

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-1">
        {isCoto
          ? <Mountain className="h-7 w-7 text-red-primary" />
          : <Store className="h-7 w-7 text-red-primary" />
        }
        <h1 className="text-h2 text-text-primary">{store.name}</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted border border-border capitalize">
          {store.subtype}
        </span>
      </div>
      <p className="text-text-muted mb-8">Dashboard overview</p>
      <Divider />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isCoto ? (
          <>
            <StatCard label="Experiences"   value={experienceCount ?? 0} icon={<Mountain className="h-6 w-6" />} />
            <StatCard label="Total Bookings" value={bookingCount ?? 0}   icon={<Calendar className="h-6 w-6" />} />
            <StatCard label="Orders"         value={orderCount ?? 0}     icon={<ShoppingCart className="h-6 w-6" />} />
            <StatCard label="Revenue"        value="--"                  icon={<DollarSign className="h-6 w-6" />} />
          </>
        ) : (
          <>
            <StatCard label="Products"     value={productCount ?? 0}    icon={<ShoppingBag className="h-6 w-6" />} />
            <StatCard label="Experiences"  value={experienceCount ?? 0} icon={<MapPin className="h-6 w-6" />} />
            <StatCard label="Total Orders" value={orderCount ?? 0}      icon={<ShoppingCart className="h-6 w-6" />} />
            <StatCard label="Revenue"      value="--"                   icon={<DollarSign className="h-6 w-6" />} />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="font-heading text-lg text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCoto ? (
            <>
              <Link href="/store/settings/coto"
                className="card-base p-5 flex items-center gap-4 hover:border-red-primary transition-colors group">
                <div className="bg-red-primary/10 rounded-card p-3 group-hover:bg-red-primary/20 transition-colors">
                  <Settings className="h-6 w-6 text-red-primary" />
                </div>
                <div>
                  <p className="font-heading text-text-primary">Configure Coto</p>
                  <p className="text-xs text-text-muted">Location, images, description</p>
                </div>
              </Link>

              <Link href="/store/experiences/new"
                className="card-base p-5 flex items-center gap-4 hover:border-red-primary transition-colors group">
                <div className="bg-red-primary/10 rounded-card p-3 group-hover:bg-red-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-red-primary" />
                </div>
                <div>
                  <p className="font-heading text-text-primary">New Experience</p>
                  <p className="text-xs text-text-muted">Create a hunt or fishing trip</p>
                </div>
              </Link>

              <Link href="/store/experiences"
                className="card-base p-5 flex items-center gap-4 hover:border-accent-cream transition-colors group">
                <div className="bg-accent-cream/10 rounded-card p-3 group-hover:bg-accent-cream/20 transition-colors">
                  <Mountain className="h-6 w-6 text-accent-cream" />
                </div>
                <div>
                  <p className="font-heading text-text-primary">My Experiences</p>
                  <p className="text-xs text-text-muted">View and manage listings</p>
                </div>
              </Link>

              <Link href="/store/bookings"
                className="card-base p-5 flex items-center gap-4 hover:border-accent-cream transition-colors group">
                <div className="bg-accent-cream/10 rounded-card p-3 group-hover:bg-accent-cream/20 transition-colors">
                  <Calendar className="h-6 w-6 text-accent-cream" />
                </div>
                <div>
                  <p className="font-heading text-text-primary">Bookings</p>
                  <p className="text-xs text-text-muted">Manage reservations</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/store/listings/new"
                className="card-base p-5 flex items-center gap-4 hover:border-red-primary transition-colors group">
                <div className="bg-red-primary/10 rounded-card p-3 group-hover:bg-red-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-red-primary" />
                </div>
                <div>
                  <p className="font-heading text-text-primary">New Product</p>
                  <p className="text-xs text-text-muted">Create a new listing</p>
                </div>
              </Link>

              <Link href="/store/listings"
                className="card-base p-5 flex items-center gap-4 hover:border-accent-cream transition-colors group">
                <div className="bg-accent-cream/10 rounded-card p-3 group-hover:bg-accent-cream/20 transition-colors">
                  <List className="h-6 w-6 text-accent-cream" />
                </div>
                <div>
                  <p className="font-heading text-text-primary">My Listings</p>
                  <p className="text-xs text-text-muted">View and manage products</p>
                </div>
              </Link>

              <Link href="/store/orders"
                className="card-base p-5 flex items-center gap-4 hover:border-accent-cream transition-colors group">
                <div className="bg-accent-cream/10 rounded-card p-3 group-hover:bg-accent-cream/20 transition-colors">
                  <ShoppingCart className="h-6 w-6 text-accent-cream" />
                </div>
                <div>
                  <p className="font-heading text-text-primary">Orders</p>
                  <p className="text-xs text-text-muted">Manage customer orders</p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
