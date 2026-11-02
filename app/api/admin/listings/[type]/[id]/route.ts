import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

interface Props { params: { type: string; id: string } }

export async function PATCH(req: Request, { params }: Props) {
  const { type, id } = params
  if (!['product', 'experience'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const table = type === 'product' ? 'products' : 'experiences'
  const service = createServiceClient()
  const update: Record<string, any> = { updated_at: new Date().toISOString() }
  let action = 'listing_updated'

  if ('featured' in body) { update.featured = body.featured; action = body.featured ? 'listing_featured' : 'listing_unfeatured' }
  if ('status' in body) {
    update.status = body.status
    if (body.status === 'active') { update.reviewed_by = user.id; update.reviewed_at = new Date().toISOString() }
    action = body.status === 'archived' ? 'listing_removed' : 'listing_override_approved'
  }

  const { error } = await service.from(table).update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAuditEvent({
    actor_id: user.id, actor_role: 'admin',
    action, target_type: type, target_id: id, metadata: body,
  })
  return NextResponse.json({ success: true })
}
