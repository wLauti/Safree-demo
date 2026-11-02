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

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const b = await req.json()
  const service = createServiceClient()
  const { error } = await service.from('shipping_rates').insert({
    name: b.name,
    description: b.description ?? null,
    price: b.price,
    estimated_days_min: b.estimated_days_min ?? 5,
    estimated_days_max: b.estimated_days_max ?? 7,
    sort_order: b.sort_order ?? 0,
    is_active: b.is_active ?? true,
  } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAuditEvent({ actor_id: auth.user!.id, actor_role: 'admin', action: 'shipping_rate_created', target_type: 'shipping_rate' })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const service = createServiceClient()
  await service.from('shipping_rates').update(fields).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const service = createServiceClient()
  await service.from('shipping_rates').delete().eq('id', id)
  await logAuditEvent({ actor_id: auth.user!.id, actor_role: 'admin', action: 'shipping_rate_deleted', target_type: 'shipping_rate', target_id: id })
  return NextResponse.json({ success: true })
}
