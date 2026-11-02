import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['store', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, subtype, location_state, location_city } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
  }

  const baseSlug = slugify(name)
  const supabase = createClient()

  // Make slug unique by appending a short random suffix if needed
  let slug = baseSlug
  const { data: existing } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const { data: store, error } = await supabase
    .from('stores')
    .insert({
      owner_id: profile.id,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      subtype: subtype || 'store',
      location_state: location_state?.trim() || null,
      location_city: location_city?.trim() || null,
    })
    .select('id, slug')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ store })
}
