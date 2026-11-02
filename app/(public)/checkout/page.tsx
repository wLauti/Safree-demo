export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { CheckoutClient } from './CheckoutClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Checkout — Safree' }

export default async function CheckoutPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/checkout')
  }

  const [{ data: addressesRaw }, { data: ratesRaw }] = await Promise.all([
    supabase
      .from('shipping_addresses')
      .select('id, full_name, line1, line2, city, state, zip, country, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false }),
    supabase
      .from('shipping_rates')
      .select('id, name, description, price, estimated_days_min, estimated_days_max')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  const savedAddresses = (addressesRaw ?? []) as any[]
  const shippingRates = (ratesRaw ?? []) as any[]

  return (
    <PageWrapper>
      <div className="py-8">
        <h1 className="text-h1 text-text-primary mb-1 text-center">Checkout</h1>
        <Divider className="mb-8" />
        <CheckoutClient
          userId={user.id}
          savedAddresses={savedAddresses}
          shippingRates={shippingRates}
        />
      </div>
    </PageWrapper>
  )
}
