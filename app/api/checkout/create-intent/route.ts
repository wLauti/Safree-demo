import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, getCommissionRate } from '@/lib/stripe/server'
import { IS_DEMO } from '@/lib/demo'

interface CartPayload {
  items: { product_id: string; quantity: number }[]
  shippingAddress: {
    full_name: string; line1: string; line2?: string
    city: string; state: string; zip: string; country: string
    save?: boolean
  }
  shippingRateId: string
  promoCode?: string
}

const PROMO_CODES: Record<string, number> = {
  SAFREE10: 0.1, OUTDOOR20: 0.2, TEXAS15: 0.15,
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: CartPayload
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { items, shippingAddress, shippingRateId, promoCode } = body
  if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

  // Fetch products to validate prices and stock
  const productIds = items.map(i => i.product_id)
  const { data: productsRaw } = await supabase
    .from('products')
    .select('id, store_id, title, price, stock, images, status, stores(id, name, stripe_account_id, stripe_onboarding_complete)')
    .in('id', productIds)
    .eq('status', 'active')

  const products = (productsRaw ?? []) as any[]

  // Validate stock and onboarding
  const outOfStock: string[] = []
  const storeNotReady: string[] = []

  for (const item of items) {
    const product = products.find(p => p.id === item.product_id)
    if (!product || product.stock < item.quantity) outOfStock.push(item.product_id)
    if (product && !product.stores?.stripe_onboarding_complete) storeNotReady.push(item.product_id)
  }

  if (outOfStock.length > 0) {
    return NextResponse.json({ error: 'out_of_stock', items: outOfStock }, { status: 409 })
  }
  if (storeNotReady.length > 0) {
    return NextResponse.json({ error: 'store_not_ready', items: storeNotReady }, { status: 409 })
  }

  // Fetch shipping rate
  const { data: rateRaw } = await supabase
    .from('shipping_rates')
    .select('id, name, price, estimated_days_min, estimated_days_max')
    .eq('id', shippingRateId)
    .eq('is_active', true)
    .single()
  const rate = rateRaw as any

  // Calculate totals
  const discountRate = promoCode ? (PROMO_CODES[promoCode.toUpperCase()] ?? 0) : 0
  let subtotal = 0
  const storeGroups: Record<string, { storeId: string; items: any[]; subtotal: number }> = {}

  for (const cartItem of items) {
    const product = products.find(p => p.id === cartItem.product_id)!
    const lineTotal = product.price * cartItem.quantity
    subtotal += lineTotal
    const sid = product.store_id
    if (!storeGroups[sid]) storeGroups[sid] = { storeId: sid, items: [], subtotal: 0 }
    storeGroups[sid].subtotal += lineTotal
    storeGroups[sid].items.push({
      product_id: product.id,
      store_id: sid,
      title: product.title,
      price: product.price,
      quantity: cartItem.quantity,
      image_url: product.images?.[0] ?? null,
    })
  }

  const discount = Math.round(subtotal * discountRate * 100) / 100
  const shippingTotal = rate?.price ?? 0
  const total = subtotal - discount + shippingTotal

  const commissionRate = await getCommissionRate()
  const serviceSupabase = createServiceClient()
  const orderIds: string[] = []

  // Save address if requested
  if (shippingAddress.save) {
    await serviceSupabase.from('shipping_addresses').insert({
      user_id: user.id,
      full_name: shippingAddress.full_name,
      line1: shippingAddress.line1,
      line2: shippingAddress.line2 || null,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.zip,
      country: shippingAddress.country || 'US',
      is_default: false,
    })
  }

  // Estimate delivery window
  const today = new Date()
  const minDate = new Date(today); minDate.setDate(today.getDate() + (rate?.estimated_days_min ?? 5))
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + (rate?.estimated_days_max ?? 7))
  const estimatedDelivery = `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  // Create one order per store group
  for (const group of Object.values(storeGroups)) {
    const storeFraction = group.subtotal / subtotal
    const storeDiscount = Math.round(discount * storeFraction * 100) / 100
    const storeShipping = Math.round(shippingTotal * storeFraction * 100) / 100
    const storeTotal = group.subtotal - storeDiscount + storeShipping

    const { data: order, error } = await serviceSupabase
      .from('orders')
      .insert({
        user_id: user.id,
        store_id: group.storeId,
        items: group.items,
        subtotal: group.subtotal,
        tax: 0,
        total: storeTotal,
        discount: storeDiscount,
        promo_code: promoCode || null,
        shipping_address: shippingAddress,
        shipping_method: rate?.name ?? 'Standard Shipping',
        shipping_total: storeShipping,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    orderIds.push((order as any).id)
  }

  // ── DEMO MODE: simulate an instant successful payment (no Stripe) ──
  if (IS_DEMO) {
    const { data: createdOrders } = await serviceSupabase
      .from('orders')
      .select('id, user_id, store_id, items')
      .in('id', orderIds)

    for (const order of (createdOrders ?? []) as any[]) {
      await serviceSupabase
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id)

      for (const item of (order.items ?? []) as any[]) {
        await serviceSupabase.rpc('decrement_product_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })
      }

      await serviceSupabase.from('notifications').insert({
        user_id: order.user_id,
        type: 'order_paid',
        title: 'Order Confirmed!',
        body: `Your order #${order.id.slice(0, 8).toUpperCase()} has been confirmed.`,
        ref_type: 'order',
        ref_id: order.id,
      })

      const { data: st } = await serviceSupabase
        .from('stores').select('owner_id').eq('id', order.store_id).single()
      if ((st as any)?.owner_id) {
        await serviceSupabase.from('notifications').insert({
          user_id: (st as any).owner_id,
          type: 'new_order',
          title: 'New Order Received',
          body: `You have a new order #${order.id.slice(0, 8).toUpperCase()}.`,
          ref_type: 'order',
          ref_id: order.id,
        })
      }
    }

    return NextResponse.json({ demo: true, orderIds, total, estimatedDelivery })
  }

  // Create single PaymentIntent for the full cart total
  const totalCents = Math.round(total * 100)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      order_ids: orderIds.join(','),
      user_id: user.id,
      commission_rate: String(commissionRate),
      estimated_delivery: estimatedDelivery,
    },
  })

  // Save PI id on all orders
  await serviceSupabase
    .from('orders')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .in('id', orderIds)

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderIds,
    total,
    estimatedDelivery,
  })
}
