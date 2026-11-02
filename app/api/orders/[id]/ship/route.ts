import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface Props { params: { id: string } }

export async function PATCH(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tracking_number, tracking_url } = await req.json()

  // Verify the order belongs to this store owner
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
  if (ord.status !== 'paid') {
    return NextResponse.json({ error: 'Order must be in paid status to mark as shipped' }, { status: 400 })
  }

  const service = createServiceClient()
  await service
    .from('orders')
    .update({
      status: 'shipped',
      tracking_number: tracking_number || null,
      tracking_url: tracking_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  // Notify buyer
  await service.from('notifications').insert({
    user_id: ord.user_id,
    type: 'new_order', // reuse closest type
    title: 'Your Order Has Shipped!',
    body: tracking_number ? `Tracking: ${tracking_number}` : 'Your order is on its way.',
    ref_type: 'order',
    ref_id: params.id,
  })

  return NextResponse.json({ success: true })
}
