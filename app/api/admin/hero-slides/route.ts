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

  const body = await req.json()
  const service = createServiceClient()
  const { error } = await service.from('hero_slides').insert({
    image_url: body.image_url,
    headline: body.headline,
    subtext: body.subtext ?? null,
    cta_text: body.cta_text ?? null,
    cta_url: body.cta_url ?? null,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAuditEvent({ actor_id: auth.user!.id, actor_role: 'admin', action: 'hero_slide_created', target_type: 'hero_slide' })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const service = createServiceClient()
  await service.from('hero_slides').update(fields).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const service = createServiceClient()
  await service.from('hero_slides').delete().eq('id', id)
  await logAuditEvent({ actor_id: auth.user!.id, actor_role: 'admin', action: 'hero_slide_deleted', target_type: 'hero_slide', target_id: id })
  return NextResponse.json({ success: true })
}
