import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { sendListingApprovedEmail } from '@/lib/email/resend'

interface Props { params: { type: string; id: string } }

export async function POST(req: Request, { params }: Props) {
  const { type, id } = params
  if (!['product', 'experience'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile as any)?.role
  if (!['admin', 'moderator'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const table = type === 'product' ? 'products' : 'experiences'
  const service = createServiceClient()

  const { data: listing } = await service
    .from(table)
    .select('id, title, status, store_id, stores(owner_id, name)')
    .eq('id', id)
    .single()
  const l = listing as any
  if (!l) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  await service
    .from(table)
    .update({
      status: 'active',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
      rejection_category: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // Notify store owner
  const ownerId = l.stores?.owner_id
  if (ownerId) {
    await service.from('notifications').insert({
      user_id: ownerId,
      type: 'listing_approved',
      title: 'Listing Approved!',
      body: `Your ${type} "${l.title}" is now live on Safree.`,
      ref_type: type,
      ref_id: id,
    })

    // Email
    try {
      const { data: ownerProfile } = await service.from('profiles').select('email').eq('id', ownerId).single()
      const email = (ownerProfile as any)?.email
      if (email) await sendListingApprovedEmail(email, l.title, type as 'product' | 'experience')
    } catch (e) { console.error('approval email failed', e) }
  }

  await logAuditEvent({
    actor_id: user.id,
    actor_role: role,
    action: 'listing_approved',
    target_type: type,
    target_id: id,
    metadata: { title: l.title },
  })

  return NextResponse.json({ success: true })
}
