import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ products: [], experiences: [] })

  const supabase = createClient()
  const searchTerm = q.split(/\s+/).join(' & ')

  const [{ data: products }, { data: experiences }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, slug, images, price, stores(name)')
      .eq('status', 'active')
      .textSearch('search_vector', searchTerm, { config: 'english' })
      .limit(6),
    supabase
      .from('experiences')
      .select('id, title, images, price_per_person, location_state')
      .eq('status', 'active')
      .textSearch('search_vector', searchTerm, { config: 'english' })
      .limit(4),
  ])

  return NextResponse.json({ products: products ?? [], experiences: experiences ?? [] })
}
