import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { normalizeGeoPoint } from '@/lib/utils/geo'

export const dynamic = 'force-dynamic'

function normalizeExperiences(rows: any[]): any[] {
  return rows.map(e => ({
    ...e,
    location_coords: normalizeGeoPoint(e.location_coords),
  }))
}

/**
 * GET /api/experiences
 * Query params:
 *   type          - 'hunt' | 'fishing'
 *   species       - comma-separated species IDs
 *   price_min     - number
 *   price_max     - number
 *   rating        - minimum avg_rating
 *   state         - US state name
 *   lat_min, lat_max, lng_min, lng_max  - map bounds
 *   limit, offset - pagination
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const speciesParam = searchParams.get('species')
  const priceMin = parseFloat(searchParams.get('price_min') ?? '0')
  const priceMax = parseFloat(searchParams.get('price_max') ?? '99999')
  const rating = parseFloat(searchParams.get('rating') ?? '0')
  const state = searchParams.get('state')
  const latMin = searchParams.get('lat_min')
  const latMax = searchParams.get('lat_max')
  const lngMin = searchParams.get('lng_min')
  const lngMax = searchParams.get('lng_max')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = createClient()

  // Use PostGIS RPC when bounds are provided
  if (latMin && latMax && lngMin && lngMax) {
    const { data, error } = await supabase.rpc('experiences_in_bounds', {
      p_lat_min: parseFloat(latMin),
      p_lat_max: parseFloat(latMax),
      p_lng_min: parseFloat(lngMin),
      p_lng_max: parseFloat(lngMax),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ experiences: normalizeExperiences(data ?? []) })
  }

  // Standard filtered query
  let query = supabase
    .from('experiences')
    .select(`
      id, slug, title, type, price_per_person, images, location_state, location_city,
      species_ids, amenities, avg_rating, review_count, max_guests, duration_days,
      status, location_coords,
      stores(id, name, slug, is_verified, logo_url)
    `)
    .eq('status', 'active')
    .gte('price_per_person', priceMin)
    .lte('price_per_person', priceMax)
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('type', type)
  if (state) query = query.eq('location_state', state)
  if (rating > 0) query = query.gte('avg_rating', rating)
  if (speciesParam) {
    const ids = speciesParam.split(',').filter(Boolean)
    if (ids.length > 0) query = query.overlaps('species_ids', ids)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ experiences: normalizeExperiences(data ?? []) })
}
