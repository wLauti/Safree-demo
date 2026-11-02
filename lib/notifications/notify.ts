// Server-only unified notification dispatcher.
// Inserts a DB notification row AND pushes a Web Push message (best effort).
import { createServiceClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push/web-push'

const ICON_MAP: Record<string, string> = {
  new_order: 'order', order_paid: 'order', payment_failed: 'order',
  new_booking: 'booking', booking_cancelled: 'booking', booking_completed: 'booking',
  funds_released: 'funds', dispute_opened: 'dispute', dispute_resolved: 'dispute',
  dispute_response: 'dispute', booking_dispute: 'dispute',
  review_received: 'review', listing_approved: 'listing', listing_rejected: 'listing',
  verification_approved: 'verification', account_suspended: 'account',
}

export interface NotifyParams {
  userId: string
  type: string
  title: string
  body?: string
  refType?: string
  refId?: string
  url?: string
}

/**
 * Create an in-app notification and fire a push message.
 * The DB insert is authoritative; push is best-effort.
 */
export async function notify(params: NotifyParams): Promise<void> {
  const supabase = createServiceClient()

  // 1. Insert DB notification (powers the bell + realtime)
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    ref_type: params.refType ?? null,
    ref_id: params.refId ?? null,
  } as any)

  // 2. Best-effort push
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_subscription')
      .eq('id', params.userId)
      .single()

    const sub = (profile as any)?.push_subscription
    if (sub) {
      const result = await sendPush(sub, {
        title: params.title,
        body: params.body ?? '',
        url: params.url ?? '/user/notifications',
        tag: ICON_MAP[params.type] ?? 'safree',
      })
      // Clean up expired subscriptions
      if (result === 'gone') {
        await supabase.from('profiles').update({ push_subscription: null } as any).eq('id', params.userId)
      }
    }
  } catch (err) {
    console.error('[notify] push dispatch failed:', err)
  }
}

/** Notify multiple users with the same payload. */
export async function notifyMany(userIds: string[], params: Omit<NotifyParams, 'userId'>): Promise<void> {
  await Promise.all(userIds.map(userId => notify({ ...params, userId })))
}
