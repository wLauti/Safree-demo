export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { Package, MapPin, Truck, CheckCircle, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { OpenDisputeButton } from '@/components/disputes/OpenDisputeButton'
import type { Metadata } from 'next'

interface Props { params: { id: string } }

export const metadata: Metadata = { title: 'Order Details — Safree' }

const STATUS_STEPS = ['pending', 'paid', 'shipped', 'delivered']

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (['paid', 'shipped', 'delivered'].includes(s)) return 'verified'
  if (['cancelled', 'disputed', 'refunded'].includes(s)) return 'pending'
  return 'default'
}

export default async function OrderDetailPage({ params }: Props) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: orderRaw, error } = await supabase
    .from('orders')
    .select('id, total, subtotal, discount, shipping_total, shipping_method, shipping_address, items, status, tracking_number, tracking_url, created_at, paid_at, delivered_at, stores(id, name, slug)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !orderRaw) notFound()
  const order = orderRaw as any
  const items = (order.items ?? []) as any[]
  const addr = order.shipping_address

  // Can open dispute within 7 days of delivery
  const canDispute = order.status === 'delivered' && order.delivered_at
    ? (Date.now() - new Date(order.delivered_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

  const currentStatusIdx = STATUS_STEPS.indexOf(order.status)

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb
          crumbs={[
            { label: 'My Orders', href: '/user/orders' },
            { label: `#${order.id.slice(0, 8).toUpperCase()}` },
          ]}
        />

        <div className="flex items-center gap-4 mt-4 mb-6 flex-wrap">
          <h1 className="text-h2 text-text-primary">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
        </div>

        <Divider />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status timeline */}
            <div className="card-base p-5">
              <h2 className="font-heading text-text-primary mb-4">Order Status</h2>
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((s, idx) => {
                  const done = idx <= currentStatusIdx && !['cancelled', 'disputed', 'refunded'].includes(order.status)
                  const active = idx === currentStatusIdx
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                          done ? 'bg-red-primary text-accent-cream' : 'bg-bg-secondary text-text-muted border border-border'
                        }`}>
                          {done ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span className={`mt-1 text-[10px] capitalize ${active ? 'text-accent-cream' : 'text-text-muted'}`}>
                          {s}
                        </span>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-1 mb-4 ${idx < currentStatusIdx && done ? 'bg-red-primary' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>

              {order.tracking_number && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-text-muted text-sm">Tracking number</p>
                  {order.tracking_url ? (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                       className="text-accent-cream font-mono text-sm hover:underline">
                      {order.tracking_number}
                    </a>
                  ) : (
                    <p className="text-text-primary font-mono text-sm">{order.tracking_number}</p>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="card-base p-5">
              <h2 className="font-heading text-text-primary mb-4">Items</h2>
              <div className="space-y-4">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-card overflow-hidden bg-bg-secondary flex-shrink-0">
                      {item.image_url
                        ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="64px" />
                        : <Package className="h-6 w-6 text-text-muted m-auto" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary text-sm font-body">{item.title}</p>
                      <p className="text-text-muted text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-heading text-accent-cream">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {order.status === 'delivered' && (
              <div className="card-base p-4 flex items-center gap-5">
                <ReviewForm refType="order" refId={order.id} triggerLabel="Leave a Review" />
                {canDispute && <OpenDisputeButton refType="order" refId={order.id} />}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price breakdown */}
            <div className="card-base p-4">
              <h3 className="font-heading text-text-primary mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span className="text-text-primary">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>−{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-muted">
                  <span>Shipping</span>
                  <span className="text-text-primary">{formatCurrency(order.shipping_total)}</span>
                </div>
                <Divider />
                <div className="flex justify-between font-heading text-lg">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent-cream">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            {addr && (
              <div className="card-base p-4 text-sm">
                <p className="text-text-muted flex items-center gap-1 mb-2">
                  <MapPin className="h-3.5 w-3.5" /> Shipping to
                </p>
                <p className="text-text-primary leading-relaxed">
                  {addr.full_name}<br />
                  {addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}<br />
                  {addr.city}, {addr.state} {addr.zip}
                </p>
                {order.shipping_method && (
                  <p className="text-text-muted text-xs mt-2 flex items-center gap-1">
                    <Truck className="h-3 w-3" /> {order.shipping_method}
                  </p>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="card-base p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Ordered</span>
                <span className="text-text-primary">{formatDate(order.created_at)}</span>
              </div>
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Paid</span>
                  <span className="text-text-primary">{formatDate(order.paid_at)}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Delivered</span>
                  <span className="text-text-primary">{formatDate(order.delivered_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
