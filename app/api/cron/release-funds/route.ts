export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe, getCommissionRate } from '@/lib/stripe/server'
import { logAuditEvent } from '@/lib/audit'

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const commissionRate = await getCommissionRate()

  // Find all bookings ready for fund release
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, total, service_fee, stripe_payment_intent_id, store_id, user_id, ref_number,
      stores(owner_id, stripe_account_id, name)
    `)
    .eq('status', 'completed')
    .eq('funds_released', false)
    .lte('release_at', new Date().toISOString())

  if (error) {
    console.error('Cron: failed to fetch bookings', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: { bookingId: string; status: 'released' | 'skipped' | 'error'; reason?: string }[] = []

  for (const booking of (bookings ?? []) as any[]) {
    const store = booking.stores
    if (!store?.stripe_account_id) {
      results.push({ bookingId: booking.id, status: 'skipped', reason: 'No stripe account' })
      continue
    }

    // Check no open dispute
    const { data: dispute } = await supabase
      .from('disputes')
      .select('id, status')
      .eq('ref_type', 'booking')
      .eq('ref_id', booking.id)
      .in('status', ['open', 'under_review'])
      .maybeSingle()

    if (dispute) {
      results.push({ bookingId: booking.id, status: 'skipped', reason: 'Open dispute' })
      continue
    }

    try {
      // Net amount: total minus service fee (Safree keeps the fee)
      const netAmount = booking.total - booking.service_fee
      const netCents = Math.round(netAmount * 100)

      await stripe.transfers.create({
        amount: netCents,
        currency: 'usd',
        destination: store.stripe_account_id,
        transfer_group: booking.id,
        metadata: { booking_id: booking.id, ref_number: booking.ref_number ?? '' },
      })

      await supabase
        .from('bookings')
        .update({ funds_released: true, updated_at: new Date().toISOString() })
        .eq('id', booking.id)

      // Notify Coto
      await supabase.from('notifications').insert({
        user_id: store.owner_id,
        type: 'funds_released',
        title: 'Payment Released!',
        body: `$${netAmount.toFixed(2)} has been transferred to your Stripe account for booking ${booking.ref_number ?? booking.id.slice(0, 8).toUpperCase()}.`,
        ref_type: 'booking',
        ref_id: booking.id,
      })

      await logAuditEvent({
        actor_id: store.owner_id,
        actor_role: 'store',
        action: 'funds_released',
        target_type: 'booking',
        target_id: booking.id,
        metadata: { net_amount: netAmount, stripe_account: store.stripe_account_id },
      })

      results.push({ bookingId: booking.id, status: 'released' })
    } catch (err: any) {
      console.error(`Cron: failed to release booking ${booking.id}:`, err)
      results.push({ bookingId: booking.id, status: 'error', reason: err.message })
    }
  }

  console.log(`Cron release-funds: processed ${results.length} bookings`, results)
  return NextResponse.json({ processed: results.length, results })
}
