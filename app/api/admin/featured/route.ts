import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return { error: 'Forbidden', status: 403 as const }
  return { user }
}

// POST /api/admin/featured  body: { section, ref_type, ref_id, sale_price?, sort_order? }
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { section, ref_type, ref_id, sale_price, sort_order } = await req.json()
  const LIMITS: Record<string, number> = { most_notable: 6, featured_grounds: 6, featured_deals: 12 }
  if (!LIMITS[section]) return NextResponse.json({ error: 'Invalid section' }, { status: 400 })

  const service = createServiceClient()

  // Enforce section cap
  const { count } = await service
    .from('featured_content')
    .select('id', { count: 'exact', head: true })
    .eq('section', section)
  if ((count ?? 0) >= LIMITS[section]) {
    return NextResponse.json({ error: `Section limited to ${LIMITS[section]} items` }, { status: 400 })
  }

  const { error } = await service.from('featured_content').insert({
    section, ref_type, ref_id,
    sale_price: sale_price ?? null,
    sort_order: sort_order ?? 0,
  } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAuditEvent({
    actor_id: auth.user!.id, actor_role: 'admin',
    action: 'featured_added', target_type: 'featured_content', target_id: ref_id,
    metadata: { section, ref_type },
  })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/featured?id=...
export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const service = createServiceClient()
  await service.from('featured_content').delete().eq('id', id)

  await logAuditEvent({
    actor_id: auth.user!.id, actor_role: 'admin',
    action: 'featured_removed', target_type: 'featured_content', target_id: id,
  })
  return NextResponse.json({ success: true })
}
