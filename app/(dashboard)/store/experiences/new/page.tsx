export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { ExperienceForm } from '../ExperienceForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Experience — Safree' }

export default async function NewExperiencePage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const [{ data: store }, { data: speciesRaw }] = await Promise.all([
    supabase.from('stores').select('id').eq('owner_id', profile.id).single(),
    supabase.from('species').select('id, name, slug, type').eq('is_approved', true).order('name'),
  ])

  return (
    <PageWrapper>
      <div className="py-6 max-w-3xl">
        <Breadcrumb crumbs={[
          { label: 'My Experiences', href: '/store/experiences' },
          { label: 'Create New' },
        ]} />
        <h1 className="text-h1 text-text-primary mt-4 mb-1">Create Experience</h1>
        <p className="text-text-muted mb-6">List your hunting ground or fishing lodge.</p>
        <Divider />
        <div className="mt-8">
          <ExperienceForm allSpecies={(speciesRaw ?? []) as any[]} />
        </div>
      </div>
    </PageWrapper>
  )
}
