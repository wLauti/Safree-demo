import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export async function GET(req: Request, { params }: Props) {
  const supabase = createClient()

  // Slug may be an ID (UUID) or a slug string
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const query = supabase
    .from('experiences')
    .select(`
      id, slug, title, description, type, price_per_person, max_guests,
      images, video_url, location_name, location_state, location_city,
      location_coords, species_ids, amenities, terrain_description,
      avg_rating, review_count, min_booking_days, duration_days, status,
      created_at,
      stores(
        id, name, slug, logo_url, is_verified,
        location_state, location_city
      )
    `)
    .eq('status', 'active')

  const { data, error } = isUuid
    ? await query.eq('id', params.slug).single()
    : await query.eq('slug', params.slug).single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Fetch species details
  const exp = data as any
  let speciesDetails: any[] = []
  if (exp.species_ids?.length > 0) {
    const { data: sp } = await supabase
      .from('species')
      .select('id, name, slug, type')
      .in('id', exp.species_ids)
    speciesDetails = sp ?? []
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, created_at, profiles(full_name, avatar_url)')
    .eq('ref_type', 'order')
    .eq('ref_id', exp.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Count total experiences by this store
  const { count: storeExpCount } = await supabase
    .from('experiences')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', exp.stores?.id)
    .eq('status', 'active')

  return NextResponse.json({
    experience: exp,
    species: speciesDetails,
    reviews: reviews ?? [],
    storeExpCount: storeExpCount ?? 0,
  })
}
