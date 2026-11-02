'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { TILE_URL, TILE_ATTRIBUTION } from '@/lib/utils/mapStyle'

interface Coords { lng: number; lat: number }

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:9999px;background:#822626;
    border:2px solid #E6DDBC;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

function ClickToPlace({ onChange }: { onChange: (c: Coords) => void }) {
  useMapEvents({
    click: (e) => onChange({ lng: e.latlng.lng, lat: e.latlng.lat }),
  })
  return null
}

// Keep the Leaflet canvas sized correctly inside flex/hidden containers.
function ResizeFix() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

interface LocationPickerProps {
  value: Coords | null
  onChange: (c: Coords) => void
  /** Read-only mode: just shows the marker, no click/drag. */
  readonly?: boolean
}

export function LocationPicker({ value, onChange, readonly }: LocationPickerProps) {
  const center: [number, number] = value ? [value.lat, value.lng] : [31.2, -99.3]
  const zoom = value ? 10 : 6

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className="w-full h-full"
      style={{ background: '#1a1a1a' }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ResizeFix />
      {!readonly && <ClickToPlace onChange={onChange} />}
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon}
          draggable={!readonly}
          eventHandlers={{
            dragend: (e) => {
              const ll = e.target.getLatLng()
              onChange({ lng: ll.lng, lat: ll.lat })
            },
          }}
        />
      )}
    </MapContainer>
  )
}
