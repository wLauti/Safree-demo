import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface Props { params: { id: string } }

export async function POST(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller is the store owner
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const { data: bookingRaw } = await supabase
    .from('bookings')
    .select('id, user_id, status, end_date, experience_id, total, service_fee')
    .eq('id', params.id)
    .eq('store_id', (store as any).id)
    .single()
  const booking = bookingRaw as any

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Only confirmed bookings can be marked complete' }, { status: 400 })
  }

  const releaseAt = new Date(booking.end_date + 'T00:00')
  releaseAt.setDate(releaseAt.getDate() + 7)

  const service = createServiceClient()
  await service
    .from('bookings')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      release_at: releaseAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  // Notify user to leave a review
  await service.from('notifications').insert({
    user_id: booking.user_id,
    type: 'booking_completed',
    title: 'How was your experience?',
    body: 'Your experience has been completed. Leave a review and help other hunters!',
    ref_type: 'booking',
    ref_id: params.id,
  })

  return NextResponse.json({ success: true, releaseAt: releaseAt.toISOString() })
}
