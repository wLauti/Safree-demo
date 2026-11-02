import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, getCommissionRate } from '@/lib/stripe/server'
import { calculateCommission } from '@/lib/utils/pricing'
import { generateBookingRef } from '@/lib/bookings/ref'
import { IS_DEMO } from '@/lib/demo'

export const dynamic = 'force-dynamic'

const ADDON_TYPES: Record<string, 'per_day' | 'flat'> = {
  guide: 'per_day',
  accommodation: 'per_day',
  meals: 'per_day',
  transport: 'flat',
  equipment: 'flat',
}

const ADDON_LABELS: Record<string, string> = {
  guide: 'Professional Guide',
  accommodation: 'Accommodation',
  meals: 'Meals',
  transport: 'Airport Transport',
  equipment: 'Equipment Package',
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { experience_id, start_date, end_date, guests, selected_addons = [] } = await req.json()

  if (!experience_id || !start_date || !end_date || !guests) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch experience
  const { data: expRaw } = await supabase
    .from('experiences')
    .select('id, title, price_per_person, max_guests, addon_prices, cancellation_policy, status, store_id, stores(id, name, owner_id, stripe_account_id, stripe_onboarding_complete)')
    .eq('id', experience_id)
    .eq('status', 'active')
    .single()
  const exp = expRaw as any

  if (!exp) return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
  if (guests > exp.max_guests) {
    return NextResponse.json({ error: `Max ${exp.max_guests} guests allowed` }, { status: 400 })
  }
  if (!exp.stores?.stripe_onboarding_complete) {
    return NextResponse.json({ error: 'Provider payment setup incomplete' }, { status: 409 })
  }

  // Check availability for each day in range
  const startD = new Date(start_date + 'T00:00')
  const endD = new Date(end_date + 'T00:00')
  const nights = Math.round((endD.getTime() - startD.getTime()) / 86400000)
  if (nights < 1) return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })

  const { data: availRows } = await supabase
    .from('availability')
    .select('date, slots, slots_booked, is_blocked')
    .eq('experience_id', experience_id)
    .gte('date', start_date)
    .lt('date', end_date)

  const availMap = new Map((availRows ?? []).map((a: any) => [a.date, a]))
  const d = new Date(startD)
  while (d < endD) {
    const iso = d.toISOString().split('T')[0]
    const row = availMap.get(iso) as any
    if (row) {
      if (row.is_blocked) return NextResponse.json({ error: `Date ${iso} is blocked` }, { status: 409 })
      if (row.slots > 0 && row.slots_booked + guests > row.slots) {
        return NextResponse.json({ error: `Not enough slots on ${iso}` }, { status: 409 })
      }
    }
    d.setDate(d.getDate() + 1)
  }

  // Calculate pricing
  const addonPrices = (exp.addon_prices ?? {}) as Record<string, number>
  const addonDetails: { key: string; label: string; price: number }[] = []

  for (const key of selected_addons) {
    const unitPrice = addonPrices[key]
    if (unitPrice == null) continue
    const type = ADDON_TYPES[key] ?? 'flat'
    const price = type === 'per_day' ? unitPrice * nights : unitPrice
    addonDetails.push({ key, label: ADDON_LABELS[key] ?? key, price })
  }

  const subtotal = exp.price_per_person * guests * nights
  const addonsTotal = addonDetails.reduce((s, a) => s + a.price, 0)
  const commissionRate = await getCommissionRate()
  const serviceFee = calculateCommission(subtotal + addonsTotal, commissionRate)
  const total = subtotal + addonsTotal + serviceFee

  const service = createServiceClient()

  // Create booking record
  const refNumber = generateBookingRef()
  const { data: booking, error: bookingErr } = await service
    .from('bookings')
    .insert({
      user_id: user.id,
      experience_id,
      store_id: exp.store_id,
      guests,
      start_date,
      end_date,
      ref_number: refNumber,
      subtotal,
      addons: addonDetails,
      addons_total: addonsTotal,
      service_fee: serviceFee,
      total,
      cancellation_policy: exp.cancellation_policy,
      status: 'pending',
    })
    .select('id')
    .single()

  if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 })
  const bookingId = (booking as any).id

  // ── DEMO MODE: confirm the booking instantly (no Stripe) ──
  if (IS_DEMO) {
    const demoRelease = new Date(end_date + 'T00:00')
    demoRelease.setDate(demoRelease.getDate() + 7)
    await service
      .from('bookings')
      .update({ status: 'confirmed', paid_at: new Date().toISOString(), release_at: demoRelease.toISOString() })
      .eq('id', bookingId)
    await service.rpc('reserve_availability_slots', {
      p_experience_id: experience_id,
      p_start_date: start_date,
      p_end_date: end_date,
      p_quantity: guests,
    })
    await service.from('notifications').insert({
      user_id: user.id,
      type: 'new_booking',
      title: 'Booking Confirmed!',
      body: `Your booking is confirmed. Ref: ${refNumber}`,
      ref_type: 'booking',
      ref_id: bookingId,
    })
    const { data: st } = await service.from('stores').select('owner_id').eq('id', exp.store_id).single()
    if ((st as any)?.owner_id) {
      await service.from('notifications').insert({
        user_id: (st as any).owner_id,
        type: 'new_booking',
        title: 'New Booking Received!',
        body: `New booking ${start_date} – ${end_date}, ${guests} guest(s).`,
        ref_type: 'booking',
        ref_id: bookingId,
      })
    }
    return NextResponse.json({ demo: true, bookingId, refNumber, total, subtotal, addonsTotal, serviceFee, nights })
  }

  // Create PaymentIntent
  const totalCents = Math.round(total * 100)
  const releaseDate = new Date(end_date + 'T00:00')
  releaseDate.setDate(releaseDate.getDate() + 7)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      type: 'booking',
      booking_id: bookingId,
      experience_id,
      user_id: user.id,
      store_id: exp.store_id,
      commission_rate: String(commissionRate),
      release_at: releaseDate.toISOString(),
    },
  })

  await service
    .from('bookings')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq('id', bookingId)

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    bookingId,
    refNumber,
    total,
    subtotal,
    addonsTotal,
    serviceFee,
    nights,
  })
}
