import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/species - list all approved + user's custom species
 * POST /api/species - create a custom species (store owners only)
 */

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('species')
    .select('id, name, slug, type, is_custom, is_approved')
    .order('name')

  if (!user) {
    query = query.eq('is_approved', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ species: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, type } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const service = createServiceClient()
  const { data, error } = await service
    .from('species')
    .insert({
      name: name.trim(),
      slug,
      type: type ?? 'game',
      is_custom: true,
      is_approved: false, // pending admin approval
      created_by_store_id: (store as any).id,
    })
    .select('id, name, slug, type, is_custom, is_approved')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ species: data }, { status: 201 })
}
