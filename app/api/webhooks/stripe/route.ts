import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, getCommissionRate } from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email/resend'
import { logAuditEvent } from '@/lib/audit'

export const runtime = 'nodejs'

// Next.js must not parse the body — Stripe needs the raw bytes for signature verification
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent

        // ── Booking payment ───────────────────────────────────
        if (pi.metadata.type === 'booking') {
          await handleBookingPaymentSucceeded(pi, supabase)
          break
        }

        // ── Order payment ─────────────────────────────────────
        const orderIds = (pi.metadata.order_ids ?? '').split(',').filter(Boolean)
        const commissionRate = parseFloat(pi.metadata.commission_rate ?? '5')
        const estimatedDelivery = pi.metadata.estimated_delivery ?? ''
        if (!orderIds.length) break

        // Fetch all orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id, user_id, store_id, items, total, subtotal, discount, shipping_total, shipping_address, shipping_method')
          .in('id', orderIds)

        for (const order of (orders ?? []) as any[]) {
          // Update order status
          await supabase
            .from('orders')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', order.id)

          // Decrement stock for each item
          for (const item of (order.items ?? []) as any[]) {
            await supabase.rpc('decrement_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            })
          }

          // Transfer to store (minus commission)
          const { data: storeData } = await supabase
            .from('stores')
            .select('owner_id, name, stripe_account_id')
            .eq('id', order.store_id)
            .single()
          const store = storeData as any

          if (store?.stripe_account_id) {
            const storeAmountCents = Math.round(order.total * 100 * (1 - commissionRate / 100))
            if (storeAmountCents > 0) {
              await stripe.transfers.create({
                amount: storeAmountCents,
                currency: 'usd',
                destination: store.stripe_account_id,
                transfer_group: pi.id,
                metadata: { order_id: order.id },
              })
            }
          }

          // Notify user
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            type: 'order_paid',
            title: 'Order Confirmed!',
            body: `Your order #${order.id.slice(0, 8).toUpperCase()} has been confirmed.`,
            ref_type: 'order',
            ref_id: order.id,
          })

          // Notify store owner
          if (store?.owner_id) {
            await supabase.from('notifications').insert({
              user_id: store.owner_id,
              type: 'new_order',
              title: 'New Order Received',
              body: `You have a new order #${order.id.slice(0, 8).toUpperCase()} — ${order.items?.length ?? 0} item(s).`,
              ref_type: 'order',
              ref_id: order.id,
            })
          }

          // Send confirmation email
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', order.user_id)
              .single()
            const p = profile as any

            if (p?.email) {
              await sendOrderConfirmationEmail({
                to: p.email,
                userName: p.full_name ?? 'Customer',
                orderId: order.id,
                items: order.items ?? [],
                subtotal: order.subtotal,
                shippingTotal: order.shipping_total,
                discount: order.discount,
                total: order.total,
                shippingAddress: order.shipping_address,
                shippingMethod: order.shipping_method ?? 'Standard Shipping',
                estimatedDelivery,
              })
            }
          } catch (emailErr) {
            console.error('Failed to send confirmation email:', emailErr)
          }

          // Audit log
          await logAuditEvent({
            actor_id: order.user_id,
            actor_role: 'user',
            action: 'order_paid',
            target_type: 'order',
            target_id: order.id,
            metadata: { payment_intent_id: pi.id, total: order.total },
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent

        // Booking payment failed
        if (pi.metadata.type === 'booking' && pi.metadata.booking_id) {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', pi.metadata.booking_id)
          break
        }

        const orderIds = (pi.metadata.order_ids ?? '').split(',').filter(Boolean)
        if (!orderIds.length) break

        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .in('id', orderIds)

        // Notify user
        const { data: firstOrder } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', orderIds[0])
          .single()
        const first = firstOrder as any

        if (first?.user_id) {
          await supabase.from('notifications').insert({
            user_id: first.user_id,
            type: 'payment_failed',
            title: 'Payment Failed',
            body: 'Your payment could not be processed. Please try again.',
            ref_type: 'order',
            ref_id: orderIds[0],
          })

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', first.user_id)
              .single()
            const p = profile as any
            if (p?.email) await sendPaymentFailedEmail(p.email, p.full_name ?? 'Customer')
          } catch {}
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await supabase
          .from('stores')
          .update({
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
            stripe_onboarding_complete: account.charges_enabled && account.payouts_enabled,
          })
          .eq('stripe_account_id', account.id)
        break
      }
    }
  } catch (err: any) {
    console.error(`Webhook handler error [${event.type}]:`, err)
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Booking payment succeeded handler ─────────────────────────
async function handleBookingPaymentSucceeded(
  pi: import('stripe').Stripe.PaymentIntent,
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>
) {
  const bookingId = pi.metadata.booking_id
  if (!bookingId) return

  const releaseAt = pi.metadata.release_at ?? null

  await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      paid_at: new Date().toISOString(),
      release_at: releaseAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  // Fetch booking + experience details
  const { data: bRaw } = await supabase
    .from('bookings')
    .select('id, user_id, store_id, ref_number, start_date, end_date, guests, experience_id, experiences(title)')
    .eq('id', bookingId)
    .single()
  const b = bRaw as any

  if (!b) return

  // Reserve availability slots
  await supabase.rpc('reserve_availability_slots', {
    p_experience_id: b.experience_id,
    p_start_date: b.start_date,
    p_end_date: b.end_date,
    p_quantity: b.guests ?? 1,
  })

  // Notify user
  await supabase.from('notifications').insert({
    user_id: b.user_id,
    type: 'new_booking',
    title: 'Booking Confirmed!',
    body: `Your booking for ${b.experiences?.title ?? 'your experience'} is confirmed. Ref: ${b.ref_number ?? bookingId.slice(0, 8).toUpperCase()}`,
    ref_type: 'booking',
    ref_id: bookingId,
  })

  // Notify Coto
  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', b.store_id)
    .single()
  if (store) {
    await supabase.from('notifications').insert({
      user_id: (store as any).owner_id,
      type: 'new_booking',
      title: 'New Booking Received!',
      body: `A new booking has been confirmed for ${b.experiences?.title ?? 'your experience'}: ${b.start_date} – ${b.end_date}, ${b.guests} hunter(s).`,
      ref_type: 'booking',
      ref_id: bookingId,
    })
  }

  // Booking confirmation emails (user + coto)
  try {
    const { sendBookingConfirmationEmail } = await import('@/lib/email/resend')
    const emailOpts = {
      refNumber: b.ref_number ?? bookingId.slice(0, 8).toUpperCase(),
      experienceTitle: b.experiences?.title ?? 'your experience',
      startDate: b.start_date,
      endDate: b.end_date,
      guests: b.guests ?? 1,
    }
    const ids = [b.user_id, (store as any)?.owner_id].filter(Boolean)
    const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', ids)
    for (const p of (profiles ?? []) as any[]) {
      if (!p.email) continue
      await sendBookingConfirmationEmail(p.email, {
        ...emailOpts,
        recipient: p.id === b.user_id ? 'user' : 'coto',
      })
    }
  } catch (e) { console.error('booking confirmation email failed', e) }

  await import('@/lib/audit').then(({ logAuditEvent }) =>
    logAuditEvent({
      actor_id: b.user_id,
      actor_role: 'user',
      action: 'booking_confirmed',
      target_type: 'booking',
      target_id: bookingId,
      metadata: { payment_intent_id: pi.id },
    })
  )
}
