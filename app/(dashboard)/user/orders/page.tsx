export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Orders — Safree' }

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (['paid', 'shipped', 'delivered'].includes(s)) return 'verified'
  if (['cancelled', 'disputed', 'refunded'].includes(s)) return 'pending'
  return 'default'
}

export default async function UserOrdersPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('id, total, status, items, created_at, shipping_method, tracking_number, stores(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (ordersRaw ?? []) as any[]

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">My Orders</h1>
        <p className="text-text-muted mb-6">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        <Divider />

        <div className="mt-6">
          {orders.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<ShoppingBag />}
                title="No orders yet"
                description="Start shopping to place your first order."
                action={{ label: 'Browse Products', href: '/products' }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const items = (order.items ?? []) as any[]
                const firstItem = items[0]
                return (
                  <Link
                    key={order.id}
                    href={`/user/orders/${order.id}`}
                    className="card-base block p-4 hover:border-red-primary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-text-muted text-sm">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                        </div>
                        <p className="text-text-primary text-sm font-body line-clamp-1">
                          {firstItem
                            ? `${firstItem.title}${items.length > 1 ? ` +${items.length - 1} more` : ''}`
                            : 'Order items'}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {order.stores?.name ?? ''} · {formatDate(order.created_at)}
                        </p>
                        {order.tracking_number && (
                          <p className="text-xs text-accent-cream mt-0.5">
                            Tracking: {order.tracking_number}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-heading text-lg text-accent-cream">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
