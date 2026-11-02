import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/notify'
import { logAuditEvent } from '@/lib/audit'
import { sendDisputeResponseEmail } from '@/lib/email/resend'

interface Props { params: { id: string } }

// POST /api/disputes/[id]/respond  body: { response, evidence_urls? }
export async function POST(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { response, evidence_urls } = await req.json()
  if (!response || response.trim().length < 50) {
    return NextResponse.json({ error: 'Response must be at least 50 characters' }, { status: 400 })
  }
  if (Array.isArray(evidence_urls) && evidence_urls.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 evidence files' }, { status: 400 })
  }

  // Verify the store owns this dispute
  const { data: storeRow } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!storeRow) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const { data: disputeRaw } = await supabase
    .from('disputes')
    .select('id, ref_number, status, store_id, opened_by_user_id')
    .eq('id', params.id)
    .eq('store_id', (storeRow as any).id)
    .single()
  const dispute = disputeRaw as any
  if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  if (dispute.status !== 'open') {
    return NextResponse.json({ error: 'This dispute is not awaiting a response' }, { status: 400 })
  }

  const service = createServiceClient()
  await service
    .from('disputes')
    .update({
      store_response: (await import('@/lib/sanitize')).sanitizeText(response, 2000),
      store_evidence_urls: evidence_urls ?? [],
      status: 'under_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  // Notify the buyer
  await notify({
    userId: dispute.opened_by_user_id,
    type: 'dispute_response',
    title: 'The seller responded to your dispute',
    body: `Dispute ${dispute.ref_number} is now under Safree review.`,
    refType: 'dispute',
    refId: params.id,
    url: '/user/disputes',
  })
  try {
    const { data: p } = await service.from('profiles').select('email').eq('id', dispute.opened_by_user_id).single()
    if ((p as any)?.email) await sendDisputeResponseEmail((p as any).email, dispute.ref_number)
  } catch {}

  await logAuditEvent({
    actor_id: user.id, actor_role: 'store',
    action: 'dispute_response_submitted', target_type: 'dispute', target_id: params.id,
  })

  return NextResponse.json({ success: true })
}
