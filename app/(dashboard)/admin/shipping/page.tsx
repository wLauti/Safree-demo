export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { ShippingManager } from './ShippingManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Shipping Rates — Safree' }

export default async function AdminShippingPage() {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('shipping_rates')
    .select('id, name, description, price, estimated_days_min, estimated_days_max, is_active')
    .order('sort_order')

  return (
    <PageWrapper>
      <div className="py-6 max-w-2xl">
        <h1 className="text-h1 text-text-primary mb-1">Shipping Rates</h1>
        <p className="text-text-muted mb-6">Configure flat-rate shipping options shown at checkout.</p>
        <Divider />
        <div className="mt-6">
          <ShippingManager initialRates={(data ?? []) as any[]} />
        </div>
      </div>
    </PageWrapper>
  )
}
