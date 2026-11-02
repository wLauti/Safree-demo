import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  // Fetch store
  const { data: storeRaw } = await supabase
    .from('stores')
    .select('id, stripe_account_id')
    .eq('owner_id', user.id)
    .single()
  const store = storeRaw as any

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  // Get or create Stripe Connect account
  let accountId: string = store.stripe_account_id

  if (!accountId) {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()
    const profile = profileRaw as any

    const account = await stripe.accounts.create({
      type: 'standard',
      email: profile?.email,
    })
    accountId = account.id

    const service = createServiceClient()
    await service
      .from('stores')
      .update({ stripe_account_id: accountId })
      .eq('id', store.id)
  }

  // Generate onboarding link
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/store/settings/payments/refresh`,
    return_url: `${origin}/store/settings/payments/complete`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: link.url })
}
