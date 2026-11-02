import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '@/lib/email/resend'

interface Props { params: { storeId: string } }

export async function PATCH(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const { action, reason } = await req.json()
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (action === 'reject' && (!reason || reason.trim().length < 10)) {
    return NextResponse.json({ error: 'Rejection reason required (min 10 chars)' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: store } = await service
    .from('stores')
    .select('id, name, owner_id')
    .eq('id', params.storeId)
    .single()
  const s = store as any
  if (!s) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  if (action === 'approve') {
    await service.from('stores').update({
      is_verified: true,
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      verification_rejection: null,
      updated_at: new Date().toISOString(),
    }).eq('id', params.storeId)

    await service.from('notifications').insert({
      user_id: s.owner_id,
      type: 'verification_approved',
      title: 'Store Verified!',
      body: `${s.name} is now a verified provider. Your badge is live.`,
      ref_type: 'store',
      ref_id: s.id,
    })

    try {
      const { data: p } = await service.from('profiles').select('email').eq('id', s.owner_id).single()
      if ((p as any)?.email) await sendVerificationApprovedEmail((p as any).email, s.name)
    } catch {}
  } else {
    await service.from('stores').update({
      is_verified: false,
      verification_status: 'rejected',
      verification_rejection: reason.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', params.storeId)

    await service.from('notifications').insert({
      user_id: s.owner_id,
      type: 'verification_approved', // closest existing type
      title: 'Verification Update',
      body: `Verification for ${s.name} was not approved: ${reason.trim().slice(0, 100)}`,
      ref_type: 'store',
      ref_id: s.id,
    })

    try {
      const { data: p } = await service.from('profiles').select('email').eq('id', s.owner_id).single()
      if ((p as any)?.email) await sendVerificationRejectedEmail((p as any).email, s.name, reason.trim())
    } catch {}
  }

  await logAuditEvent({
    actor_id: user.id,
    actor_role: 'admin',
    action: action === 'approve' ? 'store_verified' : 'store_verification_rejected',
    target_type: 'store',
    target_id: params.storeId,
    metadata: { store_name: s.name, reason },
  })

  return NextResponse.json({ success: true })
}
