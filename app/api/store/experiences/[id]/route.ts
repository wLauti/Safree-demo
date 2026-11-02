import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

async function getStoreAndVerifyOwnership(userId: string, experienceId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('experiences')
    .select('id, store_id, stores(owner_id)')
    .eq('id', experienceId)
    .single()
  const e = data as any
  if (!e || e.stores?.owner_id !== userId) return null
  return e
}

export async function PUT(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exp = await getStoreAndVerifyOwnership(user.id, params.id)
  if (!exp) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    title, type, description, price_per_person, max_guests, images,
    location_state, location_city, location_coords, species_ids, amenities,
    terrain_description, video_url, duration_days, min_booking_days,
  } = body

  const service = createServiceClient()
  const { data, error } = await service
    .from('experiences')
    .update({
      title, type, description, price_per_person, max_guests, images,
      location_state, location_city, location_coords, species_ids, amenities,
      terrain_description, video_url, duration_days, min_booking_days,
      status: 'pending', // re-submit for review on edit
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ experience: data })
}

export async function DELETE(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exp = await getStoreAndVerifyOwnership(user.id, params.id)
  if (!exp) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })

  const service = createServiceClient()
  // Soft-delete by archiving
  const { error } = await service
    .from('experiences')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
