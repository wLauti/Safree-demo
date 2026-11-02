import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { calculateRefund, daysUntil } from '@/lib/bookings/cancellation'
import type { CancellationPolicy } from '@/lib/bookings/cancellation'

interface Props { params: { id: string } }

export async function POST(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: bookingRaw } = await supabase
    .from('bookings')
    .select('id, user_id, status, total, service_fee, start_date, end_date, experience_id, store_id, stripe_payment_intent_id, cancellation_policy, guests')
    .eq('id', params.id)
    .eq('user_id', user.id) // only own bookings
    .single()
  const booking = bookingRaw as any

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 })
  }

  const refundAmount = calculateRefund(
    booking.total,
    booking.service_fee,
    (booking.cancellation_policy ?? 'moderate') as CancellationPolicy,
    booking.start_date
  )
  const refundCents = Math.round(refundAmount * 100)

  // Process Stripe refund
  let refunded = false
  if (booking.stripe_payment_intent_id && refundCents > 0) {
    try {
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundCents,
      })
      refunded = true
    } catch (stripeErr: any) {
      return NextResponse.json({ error: `Refund failed: ${stripeErr.message}` }, { status: 500 })
    }
  }

  const service = createServiceClient()

  // Update booking status
  await service
    .from('bookings')
    .update({
      status: 'cancelled',
      refund_amount: refundAmount,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  // Release availability slots
  if (booking.experience_id && booking.start_date && booking.end_date) {
    await service.rpc('release_availability_slots', {
      p_experience_id: booking.experience_id,
      p_start_date: booking.start_date,
      p_end_date: booking.end_date,
      p_quantity: booking.guests ?? 1,
    })
  }

  // Notify user
  await service.from('notifications').insert({
    user_id: booking.user_id,
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    body: refunded
      ? `Your booking has been cancelled. Refund of $${refundAmount.toFixed(2)} is on its way.`
      : 'Your booking has been cancelled. No refund is due per the cancellation policy.',
    ref_type: 'booking',
    ref_id: params.id,
  })

  // Notify Coto
  const { data: store } = await service
    .from('stores')
    .select('owner_id')
    .eq('id', booking.store_id)
    .single()
  if (store) {
    await service.from('notifications').insert({
      user_id: (store as any).owner_id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      body: `A booking has been cancelled. Dates ${booking.start_date} – ${booking.end_date} are now available.`,
      ref_type: 'booking',
      ref_id: params.id,
    })
  }

  return NextResponse.json({ success: true, refundAmount, refunded })
}
