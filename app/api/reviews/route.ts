import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { handleRoute, requireUser, parseBody, ApiError } from '@/lib/api/guard'
import { reviewSchema } from '@/lib/validation/schemas'
import { sanitizeText } from '@/lib/sanitize'
import { notify } from '@/lib/notifications/notify'
import { sendReviewReceivedEmail } from '@/lib/email/resend'

// POST /api/reviews
export async function POST(req: Request) {
  return handleRoute(async () => {
    const { userId } = await requireUser()
    const { ref_type, ref_id, rating, body, anonymous } = await parseBody(req, reviewSchema)

    const cleanBody = body ? sanitizeText(body, 1000) : null

    // ── Eligibility: transaction must be completed and owned by user ──
    const supabase = createServiceClient()
    const table = ref_type === 'order' ? 'orders' : 'bookings'
    const requiredStatus = ref_type === 'order' ? 'delivered' : 'completed'

    const { data: txnRaw } = await supabase
      .from(table)
      .select('id, user_id, store_id, status')
      .eq('id', ref_id)
      .eq('user_id', userId)
      .single()
    const txn = txnRaw as any
    if (!txn) throw new ApiError(404, 'Transaction not found')
    if (txn.status !== requiredStatus) {
      throw new ApiError(403, `You can only review a ${requiredStatus} ${ref_type}`)
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('ref_type', ref_type).eq('ref_id', ref_id).eq('user_id', userId)
      .maybeSingle()
    if (existing) throw new ApiError(409, 'You already reviewed this')

    const { error } = await supabase.from('reviews').insert({
      ref_type, ref_id, user_id: userId, store_id: txn.store_id,
      rating, body: cleanBody,
      is_verified_purchase: true, is_anonymous: !!anonymous, status: 'active',
    } as any)
    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'You already reviewed this')
      throw new ApiError(500, error.message)
    }

    // Notify store owner
    const { data: store } = await supabase.from('stores').select('owner_id, name').eq('id', txn.store_id).single()
    const s = store as any
    if (s?.owner_id) {
      await notify({
        userId: s.owner_id, type: 'review_received', title: 'New review received',
        body: `You received a ${rating}-star review.`, refType: 'store', refId: txn.store_id, url: '/store',
      })
      try {
        const { data: p } = await supabase.from('profiles').select('email').eq('id', s.owner_id).single()
        if ((p as any)?.email) await sendReviewReceivedEmail((p as any).email, s.name, rating, ref_type)
      } catch {}
    }

    return NextResponse.json({ success: true })
  })
}
