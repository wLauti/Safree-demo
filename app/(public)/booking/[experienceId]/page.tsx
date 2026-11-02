export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { BookingClient } from './BookingClient'
import type { Metadata } from 'next'

interface Props {
  params: { experienceId: string }
  searchParams: { start?: string; end?: string; guests?: string }
}

export const metadata: Metadata = { title: 'Book Experience — Safree' }

export default async function BookingPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/booking/${params.experienceId}`)

  const { data: expRaw } = await supabase
    .from('experiences')
    .select(`
      id, slug, title, price_per_person, max_guests, addon_prices,
      cancellation_policy, images, location_city, location_state, min_booking_days,
      status,
      stores(id, name)
    `)
    .eq('id', params.experienceId)
    .eq('status', 'active')
    .single()

  if (!expRaw) notFound()
  const exp = expRaw as any

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb crumbs={[
          { label: 'Experiences', href: '/map' },
          { label: exp.title, href: `/experiences/${exp.slug ?? exp.id}` },
          { label: 'Book' },
        ]} />
        <h1 className="text-h1 text-text-primary mt-4 mb-1">{exp.title}</h1>
        <p className="text-text-muted mb-6">{exp.stores?.name}</p>
        <Divider />
        <div className="mt-8">
          <BookingClient
            experience={exp}
            initialStart={searchParams.start}
            initialEnd={searchParams.end}
            initialGuests={parseInt(searchParams.guests ?? '1')}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
