import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/notify'
import { logAuditEvent } from '@/lib/audit'
import { sendDisputeOpenedEmail } from '@/lib/email/resend'
import { sanitizeText } from '@/lib/sanitize'

function genRef(): string {
  return `DIS-${Math.random().toString(36).slice(2, 7).toUpperCase()}${(Date.now() % 10000).toString().padStart(4, '0')}`
}

// POST /api/disputes  body: { ref_type, ref_id, reason_category, description, evidence_urls? }
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ref_type, ref_id, reason_category, description, evidence_urls } = await req.json()

  if (!['order', 'booking'].includes(ref_type)) {
    return NextResponse.json({ error: 'Invalid ref_type' }, { status: 400 })
  }
  if (!reason_category || !description || description.trim().length < 50) {
    return NextResponse.json({ error: 'Description must be at least 50 characters' }, { status: 400 })
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: 'Description too long (max 2000)' }, { status: 400 })
  }
  if (Array.isArray(evidence_urls) && evidence_urls.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 evidence files' }, { status: 400 })
  }

  const table = ref_type === 'order' ? 'orders' : 'bookings'
  const eligibleStatus = ref_type === 'order' ? 'delivered' : 'completed'

  const { data: txnRaw } = await supabase
    .from(table)
    .select('id, user_id, store_id, status, ' + (ref_type === 'order' ? 'delivered_at' : 'completed_at'))
    .eq('id', ref_id)
    .eq('user_id', user.id)
    .single()
  const txn = txnRaw as any
  if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })

  // Allow disputes only within 7 days of delivery/completion
  const completedAt = ref_type === 'order' ? txn.delivered_at : txn.completed_at
  if (txn.status !== eligibleStatus && txn.status !== 'disputed') {
    return NextResponse.json({ error: `Disputes can only be opened on ${eligibleStatus} ${ref_type}s` }, { status: 403 })
  }
  if (completedAt) {
    const daysSince = (Date.now() - new Date(completedAt).getTime()) / 86400000
    if (daysSince > 7) {
      return NextResponse.json({ error: 'The 7-day dispute window has passed' }, { status: 403 })
    }
  }

  // No duplicate open dispute
  const { data: existing } = await supabase
    .from('disputes')
    .select('id')
    .eq('ref_type', ref_type)
    .eq('ref_id', ref_id)
    .not('status', 'in', '(resolved_refund,resolved_no_refund,closed)')
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'A dispute is already open for this' }, { status: 409 })

  const service = createServiceClient()
  const refNumber = genRef()

  const { data: dispute, error } = await service
    .from('disputes')
    .insert({
      ref_type,
      ref_id,
      opened_by_user_id: user.id,
      store_id: txn.store_id,
      ref_number: refNumber,
      reason: reason_category,
      reason_category: sanitizeText(reason_category, 100),
      description: sanitizeText(description, 2000),
      evidence_urls: evidence_urls ?? [],
      status: 'open',
    } as any)
    .select('id, ref_number')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark the transaction as disputed (this halts cron auto-release for bookings)
  await service.from(table).update({ status: 'disputed' }).eq('id', ref_id)

  const shortRef = ref_id.slice(0, 8).toUpperCase()

  // Notify store
  const { data: store } = await service.from('stores').select('owner_id').eq('id', txn.store_id).single()
  if ((store as any)?.owner_id) {
    await notify({
      userId: (store as any).owner_id,
      type: 'dispute_opened',
      title: 'A buyer opened a dispute',
      body: `Dispute on ${ref_type} #${shortRef}: ${reason_category}`,
      refType: 'dispute',
      refId: (dispute as any).id,
      url: '/store/disputes',
    })
    try {
      const { data: p } = await service.from('profiles').select('email').eq('id', (store as any).owner_id).single()
      if ((p as any)?.email) await sendDisputeOpenedEmail((p as any).email, { recipient: 'store', refNumber, orderRef: shortRef, reasonCategory: reason_category })
    } catch {}
  }

  // Notify user (confirmation)
  await notify({
    userId: user.id,
    type: 'dispute_opened',
    title: 'Your dispute has been opened',
    body: `Reference: ${refNumber}`,
    refType: 'dispute',
    refId: (dispute as any).id,
    url: '/user/disputes',
  })
  try {
    const { data: p } = await service.from('profiles').select('email').eq('id', user.id).single()
    if ((p as any)?.email) await sendDisputeOpenedEmail((p as any).email, { recipient: 'user', refNumber, orderRef: shortRef, reasonCategory: reason_category })
  } catch {}

  await logAuditEvent({
    actor_id: user.id, actor_role: 'user',
    action: 'dispute_opened', target_type: 'dispute', target_id: (dispute as any).id,
    metadata: { ref_type, ref_id, reason_category },
  })

  return NextResponse.json({ success: true, refNumber, disputeId: (dispute as any).id })
}
