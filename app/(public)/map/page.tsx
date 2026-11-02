export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { MapExplorerLoader } from '@/components/maps/MapExplorerLoader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Hunting Grounds — Safree',
  description: 'Discover hunting grounds and fishing lodges across Texas and beyond.',
}

export default async function MapPage() {
  const supabase = createClient()

  const { data: speciesRaw } = await supabase
    .from('species')
    .select('id, name, slug, type')
    .eq('is_approved', true)
    .order('name')

  const species = (speciesRaw ?? []) as any[]

  // Render directly — no PageWrapper (its inner mx-auto div has no height,
  // which collapses the flex chain and gives the map canvas 0px height).
  return <MapExplorerLoader species={species} />
}
