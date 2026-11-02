import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface Props { params: { id: string } }

export async function PATCH(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: storeRaw } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  const store = storeRaw as any

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, user_id')
    .eq('id', params.id)
    .eq('store_id', store.id)
    .single()

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const ord = order as any
  if (ord.status !== 'shipped') {
    return NextResponse.json({ error: 'Order must be shipped before marking delivered' }, { status: 400 })
  }

  const service = createServiceClient()
  await service
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  await service.from('notifications').insert({
    user_id: ord.user_id,
    type: 'order_paid',
    title: 'Order Delivered',
    body: 'Your order has been marked as delivered. Enjoy!',
    ref_type: 'order',
    ref_id: params.id,
  })

  return NextResponse.json({ success: true })
}
