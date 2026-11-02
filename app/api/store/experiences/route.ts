import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function makeSlug(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('experiences')
    .select('id, slug, title, type, status, price_per_person, images, location_state, location_city, avg_rating, review_count, created_at')
    .eq('store_id', (store as any).id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ experiences: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: store } = await supabase
    .from('stores')
    .select('id, stripe_onboarding_complete')
    .eq('owner_id', user.id)
    .single()
  const s = store as any
  if (!s) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const body = await req.json()
  const {
    title, type, description, price_per_person, max_guests, images,
    location_state, location_city, location_coords, species_ids, amenities,
    terrain_description, video_url, duration_days, min_booking_days,
  } = body

  // Validate required fields
  if (!title || !type || !price_per_person || !images?.length || !location_state) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (images.length < 3) {
    return NextResponse.json({ error: 'Minimum 3 photos required' }, { status: 400 })
  }

  // Generate unique slug
  const baseSlug = makeSlug(title)
  const service = createServiceClient()
  const { count } = await service
    .from('experiences')
    .select('id', { count: 'exact', head: true })
    .like('slug', `${baseSlug}%`)
  const slug = count ? `${baseSlug}-${count + 1}` : baseSlug

  // Run automated moderation checks at submission
  const { runListingChecks } = await import('@/lib/moderation/checks')
  const moderationFlags = await runListingChecks({
    title, description, price: price_per_person, category_id: null, images,
  })

  const { data, error } = await service
    .from('experiences')
    .insert({
      store_id: s.id,
      title,
      slug,
      type,
      description: description ?? null,
      price_per_person,
      max_guests: max_guests ?? 1,
      images,
      location_state,
      location_city: location_city ?? null,
      location_coords: location_coords ?? null,
      species_ids: species_ids ?? [],
      amenities: amenities ?? [],
      terrain_description: terrain_description ?? null,
      video_url: video_url ?? null,
      duration_days: duration_days ?? null,
      min_booking_days: min_booking_days ?? 1,
      moderation_flags: moderationFlags,
      status: 'pending',
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ experience: data }, { status: 201 })
}
