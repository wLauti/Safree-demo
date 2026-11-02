import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

interface Props { params: { id: string } }

// PATCH /api/moderation/flags/[id]  body: { action: 'dismiss' | 'remove' }
export async function PATCH(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile as any)?.role
  if (!['admin', 'moderator'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action } = await req.json()
  if (!['dismiss', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: flag } = await service
    .from('content_flags')
    .select('id, ref_type, ref_id')
    .eq('id', params.id)
    .single()
  const f = flag as any
  if (!f) return NextResponse.json({ error: 'Flag not found' }, { status: 404 })

  // Moderators can dismiss directly; "remove" escalates to admin in MVP unless admin acts
  const newStatus = action === 'dismiss'
    ? 'dismissed'
    : role === 'admin' ? 'removed' : 'escalated'

  await service
    .from('content_flags')
    .update({
      status: newStatus,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  // If admin chose remove, archive the underlying content
  if (newStatus === 'removed' && f.ref_type !== 'review') {
    const table = f.ref_type === 'product' ? 'products' : 'experiences'
    await service.from(table).update({ status: 'archived' }).eq('id', f.ref_id)
  }

  await logAuditEvent({
    actor_id: user.id,
    actor_role: role,
    action: `flag_${newStatus}`,
    target_type: 'content_flag',
    target_id: params.id,
    metadata: { ref_type: f.ref_type, ref_id: f.ref_id, action },
  })

  return NextResponse.json({ success: true, status: newStatus })
}
