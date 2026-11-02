export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { ExperienceForm } from '../../ExperienceForm'
import type { Metadata } from 'next'

interface Props { params: { id: string } }
export const metadata: Metadata = { title: 'Edit Experience — Safree' }

export default async function EditExperiencePage({ params }: Props) {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', profile.id).single()
  if (!store) notFound()

  const [{ data: expRaw }, { data: speciesRaw }] = await Promise.all([
    supabase
      .from('experiences')
      .select(`
        id, slug, title, type, description, price_per_person, max_guests,
        images, video_url, location_state, location_city, location_coords,
        species_ids, amenities, terrain_description, duration_days, min_booking_days
      `)
      .eq('id', params.id)
      .eq('store_id', (store as any).id)
      .single(),
    supabase.from('species').select('id, name, slug, type').eq('is_approved', true).order('name'),
  ])

  if (!expRaw) notFound()
  const exp = expRaw as any

  return (
    <PageWrapper>
      <div className="py-6 max-w-3xl">
        <Breadcrumb crumbs={[
          { label: 'My Experiences', href: '/store/experiences' },
          { label: exp.title, href: `/store/experiences/${params.id}/edit` },
          { label: 'Edit' },
        ]} />
        <h1 className="text-h1 text-text-primary mt-4 mb-1">Edit Experience</h1>
        <Divider />
        <div className="mt-8">
          <ExperienceForm
            allSpecies={(speciesRaw ?? []) as any[]}
            initialData={exp}
            experienceId={params.id}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
