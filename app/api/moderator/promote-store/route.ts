import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

// POST /api/moderator/promote-store  body: { email }
// Moderators & admins can promote a user account to the 'store' role.
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const actorRole = (actor as any)?.role
  if (actorRole !== 'admin' && actorRole !== 'moderator') {
    return NextResponse.json({ error: 'Forbidden — moderators only' }, { status: 403 })
  }

  const body = await req.json()
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const service = createServiceClient()

  // Find the target profile by email (case-insensitive)
  const { data: target } = await service
    .from('profiles')
    .select('id, email, role')
    .ilike('email', email)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
  }

  const t = target as { id: string; email: string; role: string }

  if (t.role === 'admin' || t.role === 'moderator') {
    return NextResponse.json(
      { error: `That account is a ${t.role} and cannot be changed here.` },
      { status: 400 }
    )
  }

  if (t.role === 'store') {
    return NextResponse.json({ error: 'That account is already a store.' }, { status: 400 })
  }

  const { error } = await service.from('profiles').update({ role: 'store' }).eq('id', t.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAuditEvent({
    actor_id: user.id,
    actor_role: actorRole,
    action: 'user_promoted_to_store',
    target_type: 'user',
    target_id: t.id,
    metadata: { email: t.email, from_role: t.role },
  })

  return NextResponse.json({ success: true, email: t.email })
}
