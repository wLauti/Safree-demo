export const dynamic = 'force-dynamic'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { CotoSettingsForm } from '@/components/forms/CotoSettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Coto Settings - Safree' }

export default async function CotoSettingsPage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: storeRaw } = await supabase
    .from('stores')
    .select('id, name, description, subtype, location_state, location_city, logo_url, banner_url')
    .eq('owner_id', profile.id)
    .single()

  const store = storeRaw as {
    id: string
    name: string
    description: string | null
    subtype: string
    location_state: string | null
    location_city: string | null
    logo_url: string | null
    banner_url: string | null
  } | null

  if (!store) redirect('/store/new')
  if (store.subtype !== 'coto') redirect('/store')

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb crumbs={[
          { label: 'Dashboard', href: '/store' },
          { label: 'Coto Settings' },
        ]} />
        <h1 className="text-h1 text-text-primary mt-4 mb-1">Coto Profile</h1>
        <p className="text-text-muted mb-6">
          Configure your property information, location, and images. This is what buyers see on your coto page.
        </p>
        <Divider />
        <div className="mt-8">
          <CotoSettingsForm
            storeId={store.id}
            defaultValues={{
              name:           store.name,
              description:    store.description ?? '',
              location_state: store.location_state ?? '',
              location_city:  store.location_city ?? '',
              logo_url:       store.logo_url,
              banner_url:     store.banner_url,
            }}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
