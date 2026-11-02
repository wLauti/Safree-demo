import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { notify } from '@/lib/notifications/notify'
import { logAuditEvent } from '@/lib/audit'
import { sendDisputeResolvedEmail } from '@/lib/email/resend'

interface Props { params: { id: string } }

// POST /api/disputes/[id]/resolve  body: { resolution_type, refund_amount?, note? }
export async function POST(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile as any)?.role
  if (!['admin'].includes(role)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { resolution_type, refund_amount, note } = await req.json()
  if (!['full_refund', 'partial_refund', 'no_refund'].includes(resolution_type)) {
    return NextResponse.json({ error: 'Invalid resolution type' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: disputeRaw } = await service
    .from('disputes')
    .select('id, ref_number, ref_type, ref_id, store_id, opened_by_user_id, status')
    .eq('id', params.id)
    .single()
  const dispute = disputeRaw as any
  if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  if (['resolved_refund', 'resolved_no_refund', 'closed'].includes(dispute.status)) {
    return NextResponse.json({ error: 'Dispute already resolved' }, { status: 400 })
  }

  // Fetch the underlying transaction
  const table = dispute.ref_type === 'order' ? 'orders' : 'bookings'
  const { data: txnRaw } = await service
    .from(table)
    .select('id, total, service_fee, stripe_payment_intent_id, store_id')
    .eq('id', dispute.ref_id)
    .single()
  const txn = txnRaw as any
  if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })

  // ── Compute + process refund ──────────────────────────────
  let actualRefund = 0
  if (resolution_type === 'full_refund') actualRefund = txn.total
  else if (resolution_type === 'partial_refund') {
    actualRefund = Math.min(Math.max(0, Number(refund_amount) || 0), txn.total)
    if (actualRefund <= 0) return NextResponse.json({ error: 'Partial refund amount required' }, { status: 400 })
  }

  if (actualRefund > 0 && txn.stripe_payment_intent_id) {
    try {
      await stripe.refunds.create({
        payment_intent: txn.stripe_payment_intent_id,
        amount: Math.round(actualRefund * 100),
      })
    } catch (err: any) {
      return NextResponse.json({ error: `Refund failed: ${err.message}` }, { status: 500 })
    }
  }

  // ── Update dispute + transaction status ───────────────────
  const disputeStatus = resolution_type === 'no_refund' ? 'resolved_no_refund' : 'resolved_refund'
  await service.from('disputes').update({
    status: disputeStatus,
    resolution_type,
    refund_amount: actualRefund,
    resolution_note: note ?? null,
    resolved_by: user.id,
    resolved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', params.id)

  // Transaction final status
  if (dispute.ref_type === 'order') {
    const newStatus = resolution_type === 'no_refund' ? 'delivered' : 'refunded'
    await service.from('orders').update({ status: newStatus }).eq('id', dispute.ref_id)
  } else {
    // Booking: no_refund → mark completed (lets cron release funds); refund → cancelled/refunded
    if (resolution_type === 'no_refund') {
      // Re-mark completed so escrow can release on schedule
      await service.from('bookings').update({ status: 'completed' }).eq('id', dispute.ref_id)
    } else {
      await service.from('bookings').update({ status: 'refunded', funds_released: true }).eq('id', dispute.ref_id)
    }
  }

  // ── Notify both parties ───────────────────────────────────
  const decisionBody = resolution_type === 'full_refund'
    ? `Full refund of $${actualRefund.toFixed(2)} issued.`
    : resolution_type === 'partial_refund'
    ? `Partial refund of $${actualRefund.toFixed(2)} issued.`
    : 'Resolved with no refund.'

  await notify({
    userId: dispute.opened_by_user_id,
    type: 'dispute_resolved',
    title: 'Your dispute has been resolved',
    body: decisionBody,
    refType: 'dispute', refId: params.id, url: '/user/disputes',
  })

  const { data: store } = await service.from('stores').select('owner_id').eq('id', dispute.store_id).single()
  if ((store as any)?.owner_id) {
    await notify({
      userId: (store as any).owner_id,
      type: 'dispute_resolved',
      title: 'A dispute was resolved',
      body: decisionBody,
      refType: 'dispute', refId: params.id, url: '/store/disputes',
    })
  }

  // Emails
  try {
    const ids = [dispute.opened_by_user_id, (store as any)?.owner_id].filter(Boolean)
    const { data: profiles } = await service.from('profiles').select('id, email').in('id', ids)
    for (const p of (profiles ?? []) as any[]) {
      if (!p.email) continue
      await sendDisputeResolvedEmail(p.email, {
        recipient: p.id === dispute.opened_by_user_id ? 'user' : 'store',
        refNumber: dispute.ref_number,
        resolutionType: resolution_type,
        refundAmount: actualRefund,
      })
    }
  } catch {}

  await logAuditEvent({
    actor_id: user.id, actor_role: 'admin',
    action: 'dispute_resolved', target_type: 'dispute', target_id: params.id,
    metadata: { resolution_type, refund_amount: actualRefund, note },
  })

  return NextResponse.json({ success: true, refundAmount: actualRefund })
}
