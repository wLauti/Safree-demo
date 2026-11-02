'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { TILE_URL, TILE_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/utils/mapStyle'
import { ExperienceCard } from '@/components/ui/Card'
import { PriceRangeSlider } from '@/components/ui/PriceRangeSlider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Loader'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/formatters'
import { SlidersHorizontal, Map, List, X, Star, ChevronUp } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface Species { id: string; name: string; type: string }
interface Experience {
  id: string
  slug: string | null
  title: string
  type: 'hunt' | 'fishing' | null
  price_per_person: number
  images: string[]
  location_state: string | null
  location_city: string | null
  species_ids: string[]
  avg_rating: number
  review_count: number
  location_coords: { coordinates: [number, number] } | null
  stores: { id: string; name: string; is_verified: boolean } | null
}
interface Filters {
  type: 'all' | 'hunt' | 'fishing'
  species: string[]
  price: [number, number]
  rating: number
  state: string
}
type Bounds = [number, number, number, number] // [lng_min, lat_min, lng_max, lat_max]

// ── Leaflet marker icons (no WebGL — pure HTML/CSS) ───────────
function makeIcon(type: 'hunt' | 'fishing', active: boolean) {
  const isHunt = type === 'hunt'
  const bg = isHunt ? '#822626' : '#E6DDBC'
  const fg = isHunt ? '#E6DDBC' : '#262525'
  const size = active ? 34 : 28
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};
      border:2px solid ${active ? '#E6DDBC' : 'transparent'};display:flex;align-items:center;
      justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4);font-size:${size / 2}px;color:${fg};">
      ${isHunt ? '🦌' : '🎣'}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// Custom cluster bubble matching the theme.
function clusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 36 : count < 50 ? 44 : 52
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#822626;
      border:2px solid #E6DDBC;display:flex;align-items:center;justify-content:center;
      color:#E6DDBC;font-family:Oswald,sans-serif;font-weight:600;font-size:14px;
      box-shadow:0 2px 8px rgba(0,0,0,.5);">${count}</div>`,
    iconSize: [size, size],
  })
}

// ── Main component ────────────────────────────────────────────
export function MapExplorer({ species: allSpecies }: { species?: Species[] }) {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; key: number } | null>(null)
  const [filters, setFilters] = useState<Filters>({ type: 'all', species: [], price: [0, 5000], rating: 0, state: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')
  const [sheetExpanded, setSheetExpanded] = useState(false)

  // ── Load experiences ────────────────────────────────────────
  useEffect(() => {
    fetch('/api/experiences?limit=200')
      .then(r => r.json())
      .then(({ experiences }) => {
        setExperiences(experiences ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Client-side filtering ───────────────────────────────────
  const filtered = useMemo(() => {
    return experiences.filter(e => {
      if (filters.type !== 'all' && e.type !== filters.type) return false
      if (e.price_per_person < filters.price[0] || e.price_per_person > filters.price[1]) return false
      if (filters.rating > 0 && e.avg_rating < filters.rating) return false
      if (filters.state && e.location_state !== filters.state) return false
      if (filters.species.length > 0 && !filters.species.some(s => e.species_ids?.includes(s))) return false
      if (bounds && Array.isArray(e.location_coords?.coordinates)) {
        const [lng, lat] = e.location_coords.coordinates
        if (lng < bounds[0] || lat < bounds[1] || lng > bounds[2] || lat > bounds[3]) return false
      }
      return true
    })
  }, [experiences, filters, bounds])

  // ── Fly to a selected experience (handled by Leaflet child) ──
  const flyTo = useCallback((exp: Experience) => {
    if (!Array.isArray(exp.location_coords?.coordinates)) return
    const [lng, lat] = exp.location_coords.coordinates
    setFlyTarget({ lat, lng, key: Date.now() })
    setSelected(exp.id)
  }, [])

  const activeFiltersCount = [
    filters.type !== 'all',
    filters.species.length > 0,
    filters.price[0] > 0 || filters.price[1] < 5000,
    filters.rating > 0,
    !!filters.state,
  ].filter(Boolean).length

  return (
    // Fixed below the sticky navbar (top-16 = 64px), full width, full remaining height.
    // This is intentionally independent of the flex layout chain so the map
    // canvas always gets a concrete pixel height.
    <div className="fixed inset-x-0 top-16 bottom-0 flex flex-row overflow-hidden">

      {/* ── Desktop: Left panel (40%) ─────────────────────────── */}
      <div className={cn(
        'hidden lg:flex flex-col w-[40%] min-w-[340px] max-w-[460px]',
        'border-r border-border bg-bg-primary overflow-hidden'
      )}>
        <PanelHeader
          count={filtered.length}
          activeFilters={activeFiltersCount}
          onToggleFilters={() => setShowFilters(v => !v)}
        />

        {showFilters && (
          <FiltersPanel
            filters={filters}
            onChange={setFilters}
            allSpecies={allSpecies ?? []}
            onClose={() => setShowFilters(false)}
          />
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : filtered.length === 0
            ? <p className="text-text-muted text-center py-12 text-sm">No experiences match your filters in this area.</p>
            : filtered.map(exp => (
                <div
                  key={exp.id}
                  onClick={() => flyTo(exp)}
                  className={cn(
                    'cursor-pointer transition-all rounded-card',
                    selected === exp.id && 'ring-2 ring-red-primary'
                  )}
                >
                  <ExperienceCard
                    id={exp.id}
                    slug={exp.slug}
                    title={exp.title}
                    type={exp.type}
                    price_per_person={exp.price_per_person}
                    image_url={exp.images?.[0] ?? null}
                    location_state={exp.location_state}
                    location_city={exp.location_city}
                    rating={exp.avg_rating}
                    review_count={exp.review_count}
                    is_verified={exp.stores?.is_verified}
                  />
                </div>
              ))
          }
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────── */}
      <div className={cn(
        'relative flex-1',
        mobileView === 'list' ? 'hidden lg:block' : 'block'
      )}>
        <div className="absolute inset-0">
          <LeafletExplorerMap
            experiences={filtered}
            onBoundsChange={setBounds}
            onSelect={setSelected}
            flyTarget={flyTarget}
          />
        </div>

        {/* Mobile toggle */}
        <div className="lg:hidden absolute top-3 left-3 z-10 flex gap-2">
          <button
            onClick={() => setMobileView('list')}
            className="flex items-center gap-1.5 bg-bg-primary border border-border text-text-primary px-3 py-1.5 rounded-full text-xs font-body shadow-lg"
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>

        {/* Result count badge on map */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-bg-primary/90 backdrop-blur border border-border rounded-full px-3 py-1.5 text-xs text-text-muted">
            {filtered.length} experience{filtered.length !== 1 ? 's' : ''} in view
          </div>
        </div>
      </div>

      {/* ── Mobile: Bottom Sheet ─────────────────────────────── */}
      <div className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-20 transition-transform duration-300',
        mobileView === 'list' ? 'hidden' : 'block',
        sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-120px)]'
      )}>
        <div className="bg-bg-primary border-t border-border rounded-t-xl shadow-2xl">
          {/* Sheet handle + header */}
          <button
            onClick={() => setSheetExpanded(v => !v)}
            className="w-full flex flex-col items-center pt-3 pb-2"
          >
            <div className="w-10 h-1 rounded-full bg-border mb-2" />
            <div className="flex items-center justify-between w-full px-4">
              <p className="text-sm text-text-muted">
                {filtered.length} experience{filtered.length !== 1 ? 's' : ''} nearby
              </p>
              <ChevronUp className={cn('h-4 w-4 text-text-muted transition-transform', sheetExpanded && 'rotate-180')} />
            </div>
          </button>

          {/* Cards in horizontal scroll when collapsed, vertical when expanded */}
          <div className={cn(
            'overflow-y-auto transition-all duration-300',
            sheetExpanded ? 'max-h-[60vh] p-4 space-y-3' : 'max-h-[80px]'
          )}>
            {!sheetExpanded ? (
              <div className="flex gap-3 overflow-x-auto px-4 pb-4 snap-x">
                {filtered.slice(0, 10).map(exp => (
                  <div key={exp.id} className="snap-start flex-shrink-0 w-64">
                    <ExperienceCard
                      id={exp.id}
                      slug={exp.slug}
                      title={exp.title}
                      type={exp.type}
                      price_per_person={exp.price_per_person}
                      image_url={exp.images?.[0] ?? null}
                      location_state={exp.location_state}
                      location_city={exp.location_city}
                    />
                  </div>
                ))}
              </div>
            ) : (
              filtered.map(exp => (
                <ExperienceCard
                  key={exp.id}
                  id={exp.id}
                  slug={exp.slug}
                  title={exp.title}
                  type={exp.type}
                  price_per_person={exp.price_per_person}
                  image_url={exp.images?.[0] ?? null}
                  location_state={exp.location_state}
                  location_city={exp.location_city}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: List View ─────────────────────────────────── */}
      {mobileView === 'list' && (
        <div className="lg:hidden fixed inset-0 bg-bg-primary z-30 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button onClick={() => setMobileView('map')} className="text-text-muted hover:text-text-primary">
              <Map className="h-5 w-5" />
            </button>
            <span className="font-heading text-text-primary flex-1">
              {filtered.length} Experiences
            </span>
            <button onClick={() => setShowFilters(v => !v)} className="text-text-muted">
              <SlidersHorizontal className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <span className="ml-1 text-xs text-red-primary">{activeFiltersCount}</span>
              )}
            </button>
          </div>
          {showFilters && (
            <FiltersPanel filters={filters} onChange={setFilters} allSpecies={allSpecies ?? []} onClose={() => setShowFilters(false)} />
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : filtered.map(exp => (
              <ExperienceCard
                key={exp.id}
                id={exp.id}
                slug={exp.slug}
                title={exp.title}
                type={exp.type}
                price_per_person={exp.price_per_person}
                image_url={exp.images?.[0] ?? null}
                location_state={exp.location_state}
                location_city={exp.location_city}
                rating={exp.avg_rating}
                review_count={exp.review_count}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Leaflet map (raster tiles, no WebGL) ──────────────────────
function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (b: Bounds) => void }) {
  const map = useMapEvents({
    moveend: () => emit(),
    zoomend: () => emit(),
  })
  function emit() {
    const b = map.getBounds()
    onBoundsChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
  }
  // Emit initial bounds once after mount
  useEffect(() => { emit() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function FlyController({ target }: { target: { lat: number; lng: number; key: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 12, { duration: 1.2 })
  }, [target?.key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function LeafletExplorerMap({ experiences, onBoundsChange, onSelect, flyTarget }: {
  experiences: Experience[]
  onBoundsChange: (b: Bounds) => void
  onSelect: (id: string) => void
  flyTarget: { lat: number; lng: number; key: number } | null
}) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="w-full h-full"
      style={{ background: '#1a1a1a' }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <FlyController target={flyTarget} />
      <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon as any}>
        {experiences
          .filter(e => Array.isArray(e.location_coords?.coordinates))
          .map(e => {
            const [lng, lat] = e.location_coords!.coordinates
            const type = e.type ?? 'hunt'
            return (
              <Marker
                key={e.id}
                position={[lat, lng]}
                icon={makeIcon(type, false)}
                eventHandlers={{ click: () => onSelect(e.id) }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 180 }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: type === 'fishing' ? '#9a7b1f' : '#822626', fontWeight: 600 }}>
                      {type === 'fishing' ? '🎣 FISHING' : '🦌 HUNT'}
                    </span>
                    <p style={{ fontFamily: 'Oswald,sans-serif', fontSize: 15, margin: '4px 0 2px', lineHeight: 1.3 }}>{e.title}</p>
                    <p style={{ fontSize: 12, margin: '0 0 8px', color: '#666' }}>{e.location_state ?? ''}</p>
                    <p style={{ fontWeight: 'bold', fontSize: 16, margin: '0 0 10px' }}>
                      {formatCurrency(e.price_per_person)}
                      <span style={{ fontSize: 11, fontWeight: 'normal', color: '#666' }}> / person</span>
                    </p>
                    <a
                      href={`/experiences/${e.slug ?? e.id}`}
                      style={{ display: 'block', background: '#822626', color: '#E6DDBC', textAlign: 'center', padding: 8, borderRadius: 5, textDecoration: 'none', fontSize: 13, fontFamily: 'Oswald,sans-serif', letterSpacing: 0.5 }}
                    >
                      VIEW DETAILS →
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}

// ── PanelHeader ────────────────────────────────────────────────
function PanelHeader({ count, activeFilters, onToggleFilters }: {
  count: number; activeFilters: number; onToggleFilters: () => void
}) {
  return (
    <div className="p-4 border-b border-border flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-text-primary text-lg">Find Grounds</h2>
          <p className="text-text-muted text-xs">{count} experience{count !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onToggleFilters}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors',
            activeFilters > 0
              ? 'bg-red-primary border-red-primary text-accent-cream'
              : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilters > 0 && <span className="ml-0.5">{activeFilters}</span>}
        </button>
      </div>
    </div>
  )
}

// ── FiltersPanel ───────────────────────────────────────────────
const US_STATES_SHORT = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
]

function FiltersPanel({ filters, onChange, allSpecies, onClose }: {
  filters: Filters
  onChange: (f: Filters) => void
  allSpecies: Species[]
  onClose: () => void
}) {
  const update = (partial: Partial<Filters>) => onChange({ ...filters, ...partial })
  const reset = () => onChange({ type: 'all', species: [], price: [0, 5000], rating: 0, state: '' })

  return (
    <div className="border-b border-border bg-bg-secondary/30 p-4 space-y-5 flex-shrink-0 max-h-[60vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="font-heading text-sm text-text-primary">Filters</h3>
        <div className="flex gap-2">
          <button onClick={reset} className="text-xs text-text-muted hover:text-text-primary">Reset all</button>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Type</p>
        <div className="flex gap-2">
          {(['all', 'hunt', 'fishing'] as const).map(t => (
            <button
              key={t}
              onClick={() => update({ type: t })}
              className={cn(
                'px-3 py-1 rounded-full text-xs capitalize transition-colors border',
                filters.type === t
                  ? 'bg-red-primary border-red-primary text-accent-cream'
                  : 'border-border text-text-muted hover:border-text-muted'
              )}
            >
              {t === 'all' ? 'All' : t === 'hunt' ? '🦌 Hunt' : '🎣 Fishing'}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Price per person</p>
        <PriceRangeSlider
          min={0} max={5000} step={50}
          value={filters.price}
          onChange={price => update({ price })}
        />
      </div>

      {/* Rating */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Min. rating</p>
        <div className="flex gap-1">
          {[0, 3, 4, 4.5].map(r => (
            <button
              key={r}
              onClick={() => update({ rating: r })}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs transition-colors border',
                filters.rating === r
                  ? 'bg-red-primary border-red-primary text-accent-cream'
                  : 'border-border text-text-muted hover:border-text-muted'
              )}
            >
              {r === 0 ? 'Any' : `${r}★+`}
            </button>
          ))}
        </div>
      </div>

      {/* State */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">State</p>
        <select
          value={filters.state}
          onChange={e => update({ state: e.target.value })}
          className="input-base w-full text-sm"
        >
          <option value="">All states</option>
          {US_STATES_SHORT.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Species */}
      {allSpecies.length > 0 && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Species</p>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {allSpecies.map(sp => {
              const active = filters.species.includes(sp.id)
              return (
                <button
                  key={sp.id}
                  onClick={() => {
                    const next = active
                      ? filters.species.filter(id => id !== sp.id)
                      : [...filters.species, sp.id]
                    update({ species: next })
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs transition-colors border',
                    active
                      ? 'bg-red-primary border-red-primary text-accent-cream'
                      : 'border-border text-text-muted hover:border-text-muted'
                  )}
                >
                  {sp.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
