export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { Tabs } from '@/components/ui/Tabs'
import { BookingWidget } from './BookingWidget'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  MapPin, Users, Calendar, Star, CheckCircle, Video, ExternalLink,
  Crosshair, Fish, Flag
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeGeoPoint } from '@/lib/utils/geo'
import { ReadonlyMap } from '@/components/maps/ReadonlyMap'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const query = supabase
    .from('experiences')
    .select('title, description')
    .eq('status', 'active')

  const { data: experience } = isUuid
    ? await query.eq('id', params.slug).single()
    : await query.eq('slug', params.slug).single()

  if (!experience) return { title: 'Experience — Safree' }
  const exp = experience as { title: string; description: string | null }
  return {
    title: `${exp.title} — Safree`,
    description: exp.description?.slice(0, 160) ?? '',
  }
}

export default async function ExperienceDetailPage({ params }: Props) {
  const supabase = createClient()

  // Fetch from DB directly (more efficient than going through API route)
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const baseQuery = supabase
    .from('experiences')
    .select(`
      id, slug, title, description, type, price_per_person, max_guests,
      images, video_url, location_name, location_state, location_city,
      location_coords, species_ids, amenities, terrain_description,
      avg_rating, review_count, min_booking_days, duration_days, status,
      stores(id, name, slug, logo_url, is_verified, location_state, location_city, owner_id)
    `)
    .eq('status', 'active')

  const { data: expRaw, error } = isUuid
    ? await baseQuery.eq('id', params.slug).single()
    : await baseQuery.eq('slug', params.slug).single()

  if (error || !expRaw) notFound()
  const exp = expRaw as any
  const store = exp.stores

  // Fetch species details
  let speciesData: any[] = []
  if (exp.species_ids?.length > 0) {
    const { data } = await supabase.from('species').select('id, name, slug').in('id', exp.species_ids)
    speciesData = data ?? []
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, created_at, profiles(full_name, avatar_url)')
    .eq('ref_type', 'order')
    .eq('ref_id', exp.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // More by this store
  const { data: moreByStore } = await supabase
    .from('experiences')
    .select('id, slug, title, type, price_per_person, images, location_state, location_city')
    .eq('store_id', store?.id)
    .eq('status', 'active')
    .neq('id', exp.id)
    .limit(4)

  const AMENITY_ICONS: Record<string, string> = {
    guide: '🧭 Guide included',
    accommodation: '🏕️ Accommodation',
    meals: '🍖 Meals',
    transport: '🚗 Transport',
    equipment: '🎯 Equipment provided',
  }

  const mapsUrl = exp.location_city && exp.location_state
    ? `https://maps.google.com/?q=${encodeURIComponent(`${exp.location_city}, ${exp.location_state}`)}`
    : null

  const locationCoords = normalizeGeoPoint(exp.location_coords)?.coordinates

  return (
    <PageWrapper>
      <div className="py-6">
        <Breadcrumb
          crumbs={[
            { label: 'Experiences', href: '/map' },
            { label: exp.title },
          ]}
        />

        {/* Hero gallery */}
        {exp.images?.length > 0 && (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96 mt-4 rounded-xl overflow-hidden">
            <div className="col-span-4 sm:col-span-2 row-span-2 relative">
              <Image
                src={exp.images[0]}
                alt={exp.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width:640px)100vw,50vw"
              />
            </div>
            {exp.images.slice(1, 5).map((img: string, i: number) => (
              <div key={i} className="relative hidden sm:block">
                <Image src={img} alt="" fill className="object-cover" sizes="25vw" />
              </div>
            ))}
          </div>
        )}

        {/* Main content grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {exp.type && (
                  <Badge variant={exp.type === 'fishing' ? 'default' : 'sale'}>
                    {exp.type === 'fishing' ? <Fish className="h-3 w-3 mr-1 inline" /> : <Crosshair className="h-3 w-3 mr-1 inline" />}
                    {exp.type === 'fishing' ? 'FISHING' : 'HUNT'}
                  </Badge>
                )}
                {store?.is_verified && <Badge variant="verified">Verified Outfitter</Badge>}
              </div>

              <h1 className="text-h1 text-text-primary mb-3">{exp.title}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                {(exp.location_city || exp.location_state) && (
                  <a
                    href={mapsUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-accent-cream transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    {[exp.location_city, exp.location_state].filter(Boolean).join(', ')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> Max {exp.max_guests} {exp.max_guests === 1 ? 'hunter' : 'hunters'}
                </span>
                {exp.min_booking_days && exp.min_booking_days > 1 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Min {exp.min_booking_days} days
                  </span>
                )}
              </div>

              {exp.review_count > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Rating value={exp.avg_rating} readonly />
                  <span className="text-sm text-text-muted">({exp.review_count} review{exp.review_count !== 1 ? 's' : ''})</span>
                </div>
              )}
            </div>

            {/* Species tags */}
            {speciesData.length > 0 && (
              <div>
                <h3 className="font-heading text-sm text-text-muted uppercase tracking-wider mb-2">Species Available</h3>
                <div className="flex flex-wrap gap-2">
                  {speciesData.map(sp => (
                    <Badge key={sp.id} variant="species">{sp.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs tabs={[
              {
                id: 'about',
                label: 'About',
                content: (
                  <div className="space-y-4">
                    {exp.description && (
                      <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                    )}
                    {exp.terrain_description && (
                      <>
                        <h4 className="font-heading text-text-primary mt-4">Terrain & Environment</h4>
                        <p className="text-text-muted leading-relaxed">{exp.terrain_description}</p>
                      </>
                    )}
                    {exp.video_url && (
                      <div className="mt-4">
                        <a
                          href={exp.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-accent-cream hover:underline"
                        >
                          <Video className="h-4 w-4" /> Watch property video
                        </a>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: 'included',
                label: "What's Included",
                content: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(AMENITY_ICONS).map(([key, label]) => {
                      const included = exp.amenities?.includes(key)
                      return (
                        <div key={key} className={`flex items-center gap-2 text-sm ${included ? 'text-text-primary' : 'text-text-muted/40 line-through'}`}>
                          <CheckCircle className={`h-4 w-4 flex-shrink-0 ${included ? 'text-green-400' : 'text-border'}`} />
                          {label}
                        </div>
                      )
                    })}
                  </div>
                ),
              },
              {
                id: 'location',
                label: 'Location',
                content: (
                  <div>
                    <p className="text-text-muted text-sm mb-4">
                      Exact address provided after booking confirmation.
                    </p>
                    <div className="flex items-center gap-2 text-text-primary mb-4">
                      <MapPin className="h-4 w-4 text-red-primary" />
                      <span>{[exp.location_city, exp.location_state].filter(Boolean).join(', ')}</span>
                    </div>
                    {locationCoords && (
                      <div className="h-56 rounded-card overflow-hidden bg-bg-secondary">
                        <ReadonlyMap lng={locationCoords[0]} lat={locationCoords[1]} />
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: 'reviews',
                label: 'Reviews',
                badge: exp.review_count,
                content: (
                  <div className="space-y-4">
                    {reviews && reviews.length > 0 ? reviews.map((r: any) => (
                      <div key={r.id} className="card-base p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-text-primary text-sm">
                              {(r.profiles as any)?.full_name ?? 'Guest'}
                            </span>
                            <Badge variant="verified" className="text-[9px]">Verified Booking</Badge>
                          </div>
                          <Rating value={r.rating} readonly size="sm" />
                        </div>
                        {r.body && <p className="text-text-muted text-sm leading-relaxed">{r.body}</p>}
                      </div>
                    )) : (
                      <p className="text-text-muted text-sm">No reviews yet — be the first!</p>
                    )}
                  </div>
                ),
              },
            ]} />
          </div>

          {/* Right: booking widget */}
          <div>
            <BookingWidget
              experienceId={exp.id}
              experienceSlug={exp.slug ?? exp.id}
              pricePerPerson={exp.price_per_person}
              maxGuests={exp.max_guests}
              minBookingDays={exp.min_booking_days ?? 1}
              title={exp.title}
              storeNotReady={!store?.is_verified}
            />
          </div>
        </div>

        {/* Provider info */}
        {store && (
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="font-heading text-xl text-text-primary mb-4">About the Provider</h2>
            <div className="card-base p-5 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                {store.logo_url
                  ? <Image src={store.logo_url} alt={store.name} fill className="object-cover" sizes="64px" />
                  : <div className="w-full h-full flex items-center justify-center font-heading text-2xl text-text-muted">{store.name[0]}</div>
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-text-primary text-lg">{store.name}</p>
                  {store.is_verified && <Badge variant="verified">Verified</Badge>}
                </div>
                {(store.location_city || store.location_state) && (
                  <p className="text-text-muted text-sm flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[store.location_city, store.location_state].filter(Boolean).join(', ')}
                  </p>
                )}
                <Link
                  href={`/stores/${store.slug ?? store.id}`}
                  className="text-accent-cream text-sm hover:underline mt-1 inline-block"
                >
                  View all experiences →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Related experiences */}
        {moreByStore && moreByStore.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-xl text-text-primary mb-4">More from this Provider</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(moreByStore as any[]).map(e => (
                <Link
                  key={e.id}
                  href={`/experiences/${e.slug ?? e.id}`}
                  className="card-base overflow-hidden hover:border-red-primary transition-colors"
                >
                  <div className="relative aspect-[4/3]">
                    {e.images?.[0]
                      ? <Image src={e.images[0]} alt={e.title} fill className="object-cover" sizes="300px" />
                      : <div className="w-full h-full bg-bg-primary" />
                    }
                  </div>
                  <div className="p-3">
                    <p className="font-heading text-sm text-text-primary line-clamp-1">{e.title}</p>
                    <p className="text-accent-cream text-sm">{formatCurrency(e.price_per_person)}/person</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
