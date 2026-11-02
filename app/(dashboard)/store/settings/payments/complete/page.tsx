export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function PaymentsCompletePage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: storeRaw } = await supabase
    .from('stores')
    .select('id, stripe_account_id')
    .eq('owner_id', profile.id)
    .single()
  const store = storeRaw as any

  let chargesEnabled = false
  let payoutsEnabled = false

  if (store?.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(store.stripe_account_id)
      chargesEnabled = account.charges_enabled
      payoutsEnabled = account.payouts_enabled

      const service = createServiceClient()
      await service
        .from('stores')
        .update({
          stripe_charges_enabled: chargesEnabled,
          stripe_payouts_enabled: payoutsEnabled,
          stripe_onboarding_complete: chargesEnabled && payoutsEnabled,
        })
        .eq('id', store.id)
    } catch {}
  }

  const complete = chargesEnabled && payoutsEnabled

  return (
    <PageWrapper>
      <div className="text-center py-20 max-w-md mx-auto">
        {complete ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-h2 text-text-primary mb-4">Payments Enabled!</h1>
            <p className="text-text-muted mb-8">
              Your store is fully set up to accept payments. Your listings will go live as soon as they are approved.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
            <h1 className="text-h2 text-text-primary mb-4">Setup Incomplete</h1>
            <p className="text-text-muted mb-8">
              Your Stripe account setup is not fully complete yet. Please finish onboarding to start receiving payments.
            </p>
          </>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/store/settings/payments">
            <Button variant="primary" className="w-full">
              {complete ? 'View Payment Settings' : 'Retry Setup'}
            </Button>
          </Link>
          <Link href="/store">
            <Button variant="ghost" className="w-full">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}
