export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { StoreOrderActions } from './StoreOrderActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Store Orders — Safree' }

interface Props { searchParams: { status?: string } }

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (['paid', 'shipped', 'delivered'].includes(s)) return 'verified'
  if (['cancelled', 'disputed', 'refunded'].includes(s)) return 'pending'
  return 'default'
}

const STATUS_FILTERS = ['all', 'paid', 'shipped', 'delivered', 'cancelled', 'disputed']

export default async function StoreOrdersPage({ searchParams }: Props) {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: storeRaw } = await supabase
    .from('stores')
    .select('id, name')
    .eq('owner_id', profile.id)
    .single()
  const store = storeRaw as any

  if (!store) {
    return (
      <PageWrapper>
        <div className="text-center py-20"><p className="text-text-muted">Store not found.</p></div>
      </PageWrapper>
    )
  }

  const statusFilter = searchParams.status ?? 'all'

  let query = supabase
    .from('orders')
    .select('id, total, subtotal, status, items, shipping_address, tracking_number, created_at, paid_at')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: ordersRaw } = await query
  const orders = (ordersRaw ?? []) as any[]

  // Revenue totals (all time + this month)
  const { data: revenueRaw } = await supabase
    .from('orders')
    .select('total, paid_at')
    .eq('store_id', store.id)
    .in('status', ['paid', 'shipped', 'delivered'])

  const revenue = revenueRaw as any[] ?? []
  const totalRevenue = revenue.reduce((s: number, o: any) => s + o.total, 0)
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)
  const monthRevenue = revenue
    .filter((o: any) => o.paid_at && new Date(o.paid_at) >= thisMonth)
    .reduce((s: number, o: any) => s + o.total, 0)

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Orders</h1>
        <p className="text-text-muted mb-6">{store.name}</p>

        {/* Revenue summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-base p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">This Month</p>
            <p className="font-heading text-2xl text-accent-cream">{formatCurrency(monthRevenue)}</p>
            <p className="text-text-muted text-xs mt-1">after commission</p>
          </div>
          <div className="card-base p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">All Time</p>
            <p className="font-heading text-2xl text-accent-cream">{formatCurrency(totalRevenue)}</p>
            <p className="text-text-muted text-xs mt-1">after commission</p>
          </div>
        </div>

        <Divider />

        {/* Status filter tabs */}
        <div className="flex gap-1 flex-wrap mt-6 mb-4">
          {STATUS_FILTERS.map(s => (
            <Link
              key={s}
              href={s === 'all' ? '/store/orders' : `/store/orders?status=${s}`}
              className={`px-3 py-1 rounded-full text-xs font-body capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-red-primary text-accent-cream'
                  : 'bg-bg-secondary text-text-muted hover:text-text-primary'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<ShoppingBag />}
              title="No orders yet"
              description={statusFilter === 'all' ? "Orders will appear here once customers start purchasing." : `No ${statusFilter} orders.`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="text-left px-4 py-3 text-text-muted font-body">Order</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body hidden sm:table-cell">Buyer</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                  <th className="text-right px-4 py-3 text-text-muted font-body">Total</th>
                  <th className="text-right px-4 py-3 text-text-muted font-body hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-text-muted font-body">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => {
                  const addr = order.shipping_address
                  const buyerName = addr?.full_name
                    ? `${addr.full_name.split(' ')[0]} ${addr.full_name.split(' ').slice(-1)[0]?.[0] ?? ''}.`
                    : 'Customer'
                  const items = (order.items ?? []) as any[]
                  const itemsSummary = items.map((i: any) => `${i.title} ×${i.quantity}`).join(', ')

                  return (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/store/orders/${order.id}`} className="font-mono text-text-muted hover:text-accent-cream transition-colors">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-primary hidden sm:table-cell">{buyerName}</td>
                      <td className="px-4 py-3 text-text-muted hidden md:table-cell max-w-[200px]">
                        <p className="line-clamp-1 text-xs">{itemsSummary}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-accent-cream">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted text-xs hidden lg:table-cell">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StoreOrderActions orderId={order.id} status={order.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
