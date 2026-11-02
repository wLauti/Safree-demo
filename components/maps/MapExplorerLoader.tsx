'use client'

import dynamic from 'next/dynamic'
import { Spinner } from '@/components/ui/Loader'

interface Species { id: string; name: string; type: string }

// Code-split Leaflet out of the initial bundle; load only on the map route,
// client-side, with a skeleton. Leaflet accesses window and is SSR-incompatible.
const MapExplorer = dynamic(
  () => import('./MapExplorer').then(m => m.MapExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-bg-secondary">
        <div className="text-center">
          <Spinner className="h-10 w-10 mx-auto mb-3" />
          <p className="text-text-muted text-sm">Loading map…</p>
        </div>
      </div>
    ),
  }
)

export function MapExplorerLoader({ species }: { species?: Species[] }) {
  return <MapExplorer species={species} />
}
