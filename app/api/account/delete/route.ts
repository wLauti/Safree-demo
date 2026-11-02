export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { handleRoute, requireUser, parseBody } from '@/lib/api/guard'
import { accountDeleteSchema } from '@/lib/validation/schemas'
import { logAuditEvent } from '@/lib/audit'
import { sendAccountDeletedEmail } from '@/lib/email/resend'

// POST /api/account/delete  body: { confirm: 'DELETE' }
// CCPA Right to Deletion. Anonymizes financial/store records, hard-deletes the rest.
export async function POST(req: Request) {
  return handleRoute(async () => {
    const { userId, email } = await requireUser()
    await parseBody(req, accountDeleteSchema) // enforces confirm === 'DELETE'

    const service = createServiceClient()

    // 1. Anonymize records kept for financial / store integrity
    await service.from('orders').update({ user_id: null } as any).eq('user_id', userId)
    await service.from('bookings').update({ user_id: null } as any).eq('user_id', userId)
    await service.from('reviews').update({ user_id: null, is_anonymous: true } as any).eq('user_id', userId)
    await service.from('disputes').update({ opened_by_user_id: null } as any).eq('opened_by_user_id', userId)

    // 2. Hard-delete personal data
    await service.from('cart_items').delete().eq('user_id', userId)
    await service.from('notifications').delete().eq('user_id', userId)
    await service.from('shipping_addresses').delete().eq('user_id', userId)

    // 3. Audit BEFORE removing the profile (actor row still resolvable)
    await logAuditEvent({
      actor_id: userId, actor_role: 'user',
      action: 'account_deleted', target_type: 'user', target_id: userId,
      metadata: { ccpa: true },
    })

    // 4. Hard-delete profile
    await service.from('profiles').delete().eq('id', userId)

    // 5. Delete the auth user
    try { await service.auth.admin.deleteUser(userId) } catch (e) { console.error('auth delete failed', e) }

    // 6. Confirmation email (best effort)
    try { if (email) await sendAccountDeletedEmail(email) } catch {}

    return NextResponse.json({
      success: true,
      message: 'Your account has been deleted. Some data may take up to 30 days to fully purge from backups.',
    })
  })
}
