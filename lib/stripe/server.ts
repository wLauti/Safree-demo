import Stripe from 'stripe'

// Server-only Stripe singleton — never import this in client components
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

/**
 * Read commission rate from integration_keys table.
 * Falls back to 5% if not configured.
 */
export async function getCommissionRate(): Promise<number> {
  try {
    // Dynamic import to avoid bundling server DB client into edge routes
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('integration_keys')
      .select('key_encrypted')
      .eq('service', 'stripe_commission_rate')
      .single()
    const rate = parseFloat((data as any)?.key_encrypted ?? '5')
    return isNaN(rate) ? 5 : Math.max(0, Math.min(rate, 100))
  } catch {
    return 5
  }
}
