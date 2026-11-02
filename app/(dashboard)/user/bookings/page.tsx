export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils/formatters'
import { Calendar, Download } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { CancelBookingButton } from './CancelBookingButton'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { OpenDisputeButton } from '@/components/disputes/OpenDisputeButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Bookings — Safree' }

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (['confirmed', 'completed'].includes(s)) return 'verified'
  if (['cancelled', 'disputed', 'refunded'].includes(s)) return 'pending'
  return 'default'
}

interface Props { searchParams: { tab?: string } }

export default async function UserBookingsPage({ searchParams }: Props) {
  const user = await requireAuth()
  const supabase = createClient()
  const tab = searchParams.tab ?? 'upcoming'

  const today = new Date().toISOString().split('T')[0]

  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select(`
      id, ref_number, status, start_date, end_date, guests, total, service_fee, voucher_url,
      cancelled_at, completed_at, cancellation_policy,
      experiences(id, slug, title, images, location_city, location_state),
      stores(name)
    `)
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })

  const bookings = (bookingsRaw ?? []) as any[]

  const upcoming = bookings.filter(b => b.start_date >= today && !['cancelled', 'refunded'].includes(b.status))
  const past = bookings.filter(b => b.end_date < today && !['cancelled', 'refunded'].includes(b.status))
  const cancelled = bookings.filter(b => ['cancelled', 'refunded'].includes(b.status))

  const current = tab === 'past' ? past : tab === 'cancelled' ? cancelled : upcoming
  const tabs = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { key: 'past', label: 'Past', count: past.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ]

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-6">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border mb-6">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={`/user/bookings?tab=${t.key}`}
              className={`px-5 py-3 text-sm font-body font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'text-accent-cream border-red-primary'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-2 text-[10px] bg-red-primary text-accent-cream rounded-full px-1.5 py-0.5">
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {current.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Calendar />}
              title="No bookings"
              description={tab === 'upcoming' ? "You have no upcoming trips. Time to plan your next hunt!" : `No ${tab} bookings.`}
              action={tab === 'upcoming' ? { label: 'Find Experiences', href: '/map' } : undefined}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {current.map(booking => {
              const exp = booking.experiences
              const isConfirmed = ['confirmed', 'completed'].includes(booking.status)
              const isCompleted = booking.status === 'completed'
              const endDate = booking.end_date
              const canDispute = isCompleted && endDate
                ? (Date.now() - new Date(endDate + 'T00:00').getTime()) < 7 * 24 * 60 * 60 * 1000
                : false
              const canCancel = ['pending', 'confirmed'].includes(booking.status)
              const canReview = isCompleted && new Date(endDate + 'T00:00') < new Date()

              return (
                <div key={booking.id} className="card-base p-4 flex gap-4">
                  {/* Photo */}
                  <div className="relative w-24 h-20 rounded-card overflow-hidden bg-bg-secondary flex-shrink-0">
                    {exp?.images?.[0]
                      ? <Image src={exp.images[0]} alt={exp.title} fill className="object-cover" sizes="96px" />
                      : <Calendar className="h-6 w-6 text-text-muted m-auto" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link href={`/booking/confirmation/${booking.id}`} className="font-mono text-text-muted text-xs hover:text-accent-cream">
                        #{booking.ref_number ?? booking.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                    </div>
                    <p className="font-heading text-text-primary line-clamp-1">{exp?.title ?? 'Experience'}</p>
                    <p className="text-text-muted text-xs">{booking.stores?.name}</p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {new Date(booking.start_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(booking.end_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {booking.guests} hunter{booking.guests !== 1 ? 's' : ''}
                    </p>
                    <p className="text-accent-cream font-heading text-sm mt-0.5">{formatCurrency(booking.total)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                    {isConfirmed && (
                      <a href={`/api/bookings/${booking.id}/voucher`} download>
                        <button className="text-xs text-accent-cream hover:underline flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" /> Voucher
                        </button>
                      </a>
                    )}
                    {canCancel && (
                      <CancelBookingButton bookingId={booking.id} startDate={booking.start_date} policy={booking.cancellation_policy ?? 'moderate'} total={booking.total} serviceFee={booking.service_fee ?? 0} />
                    )}
                    {canReview && (
                      <ReviewForm refType="booking" refId={booking.id} triggerLabel="Leave Review" />
                    )}
                    {canDispute && (
                      <OpenDisputeButton refType="booking" refId={booking.id} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
