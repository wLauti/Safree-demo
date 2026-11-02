export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PhotoBanner } from '@/components/layout/PhotoBanner'
import { IMG } from '@/lib/utils/images'
import { ExperienceCard } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState } from '@/components/ui/EmptyState'
import { MapPin } from 'lucide-react'
import { Suspense } from 'react'

interface Experience {
  id: string
  title: string
  price_per_person: number
  images: string[]
  location_state: string | null
  duration_days: number | null
}

async function ExperienceGrid() {
  const supabase = createClient()
  const { data } = await supabase
    .from('experiences')
    .select('id, title, price_per_person, images, location_state, duration_days')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(48)

    const experiences = (data ?? []) as any as Experience[]

  if (!experiences.length) {
    return (
      <EmptyState
        icon={<MapPin />}
        title="No experiences listed yet"
        description="Hunting grounds and fishing lodges are being added. Be the first to list yours!"
        action={{ label: 'List Your Property', href: '/register' }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {experiences.map(e => (
        <ExperienceCard
          key={e.id}
          id={e.id}
          title={e.title}
          price_per_person={e.price_per_person}
          image_url={e.images?.[0] ?? null}
          location_state={e.location_state}
          duration_days={e.duration_days}
        />
      ))}
    </div>
  )
}

export default function ExperiencesPage() {
  return (
    <>
      <PhotoBanner
        image={IMG.experiences}
        eyebrow="Hunting Grounds & Lodges"
        title="Your Next Trip Starts Here"
        subtitle="Book verified hunting ranches and fishing lodges across Texas."
      />
      <PageWrapper>
        <div className="py-2">
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          }>
            <ExperienceGrid />
          </Suspense>
        </div>
      </PageWrapper>
    </>
  )
}


