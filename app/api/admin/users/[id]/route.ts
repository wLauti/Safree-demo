import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

interface Props { params: { id: string } }

const VALID_ROLES = ['admin', 'moderator', 'store', 'user']

// PATCH /api/admin/users/[id]  body: { action, role? }
// actions: 'change_role' | 'suspend' | 'unsuspend' | 'ban'
export async function PATCH(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  if (params.id === user.id) {
    return NextResponse.json({ error: 'You cannot modify your own account' }, { status: 400 })
  }

  const { action, role } = await req.json()
  const service = createServiceClient()
  let update: Record<string, any> = {}
  let auditAction = ''

  switch (action) {
    case 'change_role':
      if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      update = { role }
      auditAction = 'user_role_changed'
      break
    case 'suspend':
      update = { status: 'suspended', suspended_at: new Date().toISOString() }
      auditAction = 'user_suspended'
      // Disable in Supabase Auth (ban for a long duration)
      try { await service.auth.admin.updateUserById(params.id, { ban_duration: '876000h' } as any) } catch {}
      break
    case 'unsuspend':
      update = { status: 'active', suspended_at: null }
      auditAction = 'user_unsuspended'
      try { await service.auth.admin.updateUserById(params.id, { ban_duration: 'none' } as any) } catch {}
      break
    case 'ban':
      update = { status: 'banned', suspended_at: new Date().toISOString() }
      auditAction = 'user_banned'
      try { await service.auth.admin.updateUserById(params.id, { ban_duration: '876000h' } as any) } catch {}
      break
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { error } = await service.from('profiles').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the affected user (if suspended/banned)
  if (action === 'suspend' || action === 'ban') {
    await service.from('notifications').insert({
      user_id: params.id,
      type: 'account_suspended',
      title: action === 'ban' ? 'Account Banned' : 'Account Suspended',
      body: 'Your account access has been restricted. Contact support@safree.com for details.',
    })
  }

  await logAuditEvent({
    actor_id: user.id,
    actor_role: 'admin',
    action: auditAction,
    target_type: 'user',
    target_id: params.id,
    metadata: { action, role },
  })

  return NextResponse.json({ success: true })
}
