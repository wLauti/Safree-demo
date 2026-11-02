// Server-only Web Push helper.
// VAPID keys come from integration_keys (vapid_public_key / vapid_private_key),
// falling back to env vars for local dev.
import webpush from 'web-push'

let configured = false

async function ensureConfigured(): Promise<boolean> {
  if (configured) return true

  let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
  let privateKey = process.env.VAPID_PRIVATE_KEY ?? ''

  // Prefer DB-stored keys
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('integration_keys')
      .select('service, key_encrypted')
      .in('service', ['vapid_public_key', 'vapid_private_key'])
    for (const row of (data ?? []) as any[]) {
      if (row.service === 'vapid_public_key' && row.key_encrypted) publicKey = row.key_encrypted
      if (row.service === 'vapid_private_key' && row.key_encrypted) {
        const { decryptSecret } = await import('@/lib/crypto/secrets')
        privateKey = decryptSecret(row.key_encrypted)
      }
    }
  } catch {
    // fall through to env vars
  }

  if (!publicKey || !privateKey) return false

  const subject = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'mailto:support@safree.com'

  webpush.setVapidDetails(`mailto:support@safree.com`, publicKey, privateKey)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  tag?: string
}

/**
 * Send a push notification to a stored subscription.
 * Silently no-ops if VAPID keys aren't configured.
 * Returns 'gone' if the subscription is expired (caller should delete it).
 */
export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<'ok' | 'gone' | 'skipped' | 'error'> {
  if (!(await ensureConfigured())) return 'skipped'
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return 'ok'
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.statusCode === 410) return 'gone'
    console.error('[push] send failed:', err?.message ?? err)
    return 'error'
  }
}
