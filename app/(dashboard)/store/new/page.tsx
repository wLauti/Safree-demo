export const dynamic = 'force-dynamic'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CreateStoreForm } from '@/components/forms/CreateStoreForm'
import { Store } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Store — Safree' }

export default async function NewStorePage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  // If they already have a store, send them to the dashboard
  const { data: existing } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', profile.id)
    .maybeSingle()

  if (existing) redirect('/store')

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto py-8">
        <div className="flex items-center gap-3 mb-2">
          <Store className="h-8 w-8 text-red-primary" />
          <h1 className="text-h2 text-text-primary">Create Your Store</h1>
        </div>
        <p className="text-text-muted mb-8">
          Set up your storefront to start selling gear or listing hunting experiences.
        </p>
        <div className="card-base p-8">
          <CreateStoreForm />
        </div>
      </div>
    </PageWrapper>
  )
}
