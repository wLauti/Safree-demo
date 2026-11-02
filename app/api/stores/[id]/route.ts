import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()

  // Verify the store belongs to the current user
  const { data: store } = await supabase
    .from('stores')
    .select('id, owner_id')
    .eq('id', params.id)
    .single()

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  if (store.owner_id !== profile.id && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  // Whitelist updatable fields
  const allowed = [
    'name', 'description', 'subtype',
    'location_state', 'location_city',
    'logo_url', 'banner_url',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] ?? null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
