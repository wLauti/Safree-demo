'use client'

import dynamic from 'next/dynamic'

// Leaflet needs the browser — load client-only, no SSR.
const LocationPicker = dynamic(
  () => import('./LocationPicker').then(m => m.LocationPicker),
  { ssr: false }
)

interface ReadonlyMapProps {
  lng: number
  lat: number
}

// Read-only single-marker map for detail pages (no WebGL — Leaflet raster).
export function ReadonlyMap({ lng, lat }: ReadonlyMapProps) {
  return (
    <LocationPicker
      value={{ lng, lat }}
      onChange={() => {}}
      readonly
    />
  )
}
