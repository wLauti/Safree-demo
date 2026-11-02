export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleRoute, requireUser } from '@/lib/api/guard'
import { logAuditEvent } from '@/lib/audit'

// GET /api/account/export
// CCPA Right to Know — returns a JSON download of the user's data.
export async function GET() {
  return handleRoute(async () => {
    const { userId, role } = await requireUser()
    const supabase = createClient()

    const [profile, orders, bookings, reviews, saved] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, phone, bio, avatar_url, role, created_at').eq('id', userId).single(),
      supabase.from('orders').select('id, items, subtotal, total, status, shipping_address, created_at').eq('user_id', userId),
      supabase.from('bookings').select('id, ref_number, start_date, end_date, guests, total, status, created_at').eq('user_id', userId),
      supabase.from('reviews').select('id, ref_type, rating, body, created_at').eq('user_id', userId),
      supabase.from('saved_items').select('id, ref_type, ref_id, created_at').eq('user_id', userId).then(r => r, () => ({ data: [] })),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      notice: 'This export contains the personal data Safree holds about you (CCPA Right to Know).',
      profile: (profile as any).data ?? null,
      orders: (orders as any).data ?? [],
      bookings: (bookings as any).data ?? [],
      reviews: (reviews as any).data ?? [],
      saved_items: (saved as any).data ?? [],
    }

    await logAuditEvent({
      actor_id: userId, actor_role: role,
      action: 'data_exported', target_type: 'user', target_id: userId,
    })

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="safree-my-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  })
}
