export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { CheckCircle, ShoppingBag, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Order Confirmed — Safree' }

interface Props { searchParams: { payment_intent?: string; redirect_status?: string } }

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { payment_intent: piId, redirect_status } = searchParams

  // Handle failed payments
  if (redirect_status === 'failed' || !piId) {
    return (
      <PageWrapper>
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-8 w-8 text-red-primary" />
          </div>
          <h1 className="text-h2 text-text-primary mb-4">Payment Failed</h1>
          <p className="text-text-muted mb-8">
            Your payment could not be processed. No charges were made. Please try again.
          </p>
          <Link href="/checkout">
            <Button variant="primary" size="lg">Try Again</Button>
          </Link>
        </div>
      </PageWrapper>
    )
  }

  // Retrieve PaymentIntent to confirm status
  let orders: any[] = []
  let profile: any = null

  try {
    const pi = await stripe.paymentIntents.retrieve(piId)
    if (pi.status !== 'succeeded') {
      throw new Error('Payment not confirmed')
    }

    const orderIds = (pi.metadata.order_ids ?? '').split(',').filter(Boolean)
    const supabase = createClient()

    const { data: ordersRaw } = await supabase
      .from('orders')
      .select('id, total, subtotal, discount, shipping_total, shipping_method, shipping_address, items, status, created_at')
      .in('id', orderIds)
    orders = (ordersRaw ?? []) as any[]

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profileRaw } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      profile = profileRaw
    }
  } catch {
    // Fallback — show generic success without order details
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const allItems: any[] = orders.flatMap(o => o.items ?? [])
  const totalPaid = orders.reduce((s: number, o: any) => s + o.total, 0)
  const firstOrder = orders[0]
  const addr = firstOrder?.shipping_address

  const estimatedDelivery = (() => {
    const today = new Date()
    const min = new Date(today); min.setDate(today.getDate() + 5)
    const max = new Date(today); max.setDate(today.getDate() + 7)
    return `${min.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${max.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`
  })()

  return (
    <PageWrapper>
      <div className="py-12 max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="font-heading text-4xl text-accent-cream mb-2">
            Thank you, {firstName}!
          </h1>
          <p className="text-text-muted">
            Your order has been confirmed. A confirmation email has been sent to you.
          </p>
        </div>

        {orders.length > 0 && (
          <>
            {/* Order numbers */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {orders.map(o => (
                <div key={o.id} className="bg-bg-secondary rounded-card px-5 py-3 text-center">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Order</p>
                  <p className="font-heading text-xl text-accent-cream">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              ))}
            </div>

            <Divider />

            {/* Items recap */}
            {allItems.length > 0 && (
              <div className="my-8 space-y-3">
                <h2 className="font-heading text-lg text-text-primary mb-4">Items Ordered</h2>
                {allItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="relative w-14 h-14 rounded-card overflow-hidden bg-bg-secondary flex-shrink-0">
                      {item.image_url
                        ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="56px" />
                        : <Package className="h-6 w-6 text-text-muted m-auto" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary text-sm font-body line-clamp-1">{item.title}</p>
                      <p className="text-text-muted text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-heading text-accent-cream text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Divider />

            {/* Totals + shipping */}
            <div className="my-8 grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-text-muted text-xs uppercase tracking-wider mb-2">Order Total</h3>
                <p className="font-heading text-3xl text-accent-cream">{formatCurrency(totalPaid)}</p>
                {firstOrder?.discount > 0 && (
                  <p className="text-green-400 text-sm mt-1">Saved {formatCurrency(firstOrder.discount)}</p>
                )}
              </div>
              {addr && (
                <div>
                  <h3 className="text-text-muted text-xs uppercase tracking-wider mb-2">Shipping To</h3>
                  <p className="text-text-primary text-sm leading-relaxed">
                    {addr.full_name}<br />
                    {addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}<br />
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>
              )}
            </div>

            {/* Estimated delivery */}
            <div className="bg-bg-secondary rounded-card p-4 flex items-center gap-3 mb-8">
              <Package className="h-5 w-5 text-accent-cream flex-shrink-0" />
              <div>
                <p className="text-text-muted text-sm">Estimated delivery</p>
                <p className="text-text-primary font-heading text-lg">{estimatedDelivery}</p>
              </div>
            </div>
          </>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/user/orders">
            <Button variant="primary" size="lg">View My Orders</Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary" size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}
