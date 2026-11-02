export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { formatCurrency } from '@/lib/utils/formatters'
import { CheckCircle, Download, Calendar, Users, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

interface Props {
  params: { bookingId: string }
  searchParams: { redirect_status?: string; payment_intent?: string }
}

export const metadata: Metadata = { title: 'Booking Confirmed — Safree' }

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify Stripe payment status if redirect params present
  if (searchParams.payment_intent && searchParams.redirect_status === 'failed') {
    return (
      <PageWrapper>
        <div className="text-center py-20 max-w-md mx-auto">
          <h1 className="text-h2 text-text-primary mb-4">Payment Failed</h1>
          <p className="text-text-muted mb-8">Your payment could not be processed. No booking was created.</p>
          <Link href="/map"><Button variant="primary">Back to Experiences</Button></Link>
        </div>
      </PageWrapper>
    )
  }

  const { data: bookingRaw } = await supabase
    .from('bookings')
    .select(`
      id, ref_number, status, start_date, end_date, guests,
      subtotal, addons_total, service_fee, total, addons,
      cancellation_policy, voucher_url, paid_at,
      experiences(id, slug, title, images, location_city, location_state, location_name),
      stores(id, name, slug, logo_url, location_city, location_state)
    `)
    .eq('id', params.bookingId)
    .single()

  if (!bookingRaw) notFound()
  const b = bookingRaw as any
  const exp = b.experiences
  const store = b.stores
  const addons = (b.addons ?? []) as any[]

  const nights = Math.round(
    (new Date(b.end_date + 'T00:00').getTime() - new Date(b.start_date + 'T00:00').getTime()) / 86400000
  )

  const isConfirmed = ['confirmed', 'completed'].includes(b.status)

  return (
    <PageWrapper>
      <div className="py-12 max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="font-heading text-4xl text-accent-cream mb-2">Booking Confirmed!</h1>
          <p className="text-text-muted">Your adventure is locked in. Get ready for an unforgettable experience.</p>
        </div>

        {/* Reference */}
        <div className="bg-bg-secondary rounded-card px-6 py-4 text-center mb-8">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Booking Reference</p>
          <p className="font-heading text-3xl text-accent-cream tracking-widest">
            {b.ref_number ?? b.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <Divider />

        {/* Experience summary */}
        <div className="my-8 flex gap-4 items-start">
          {exp?.images?.[0] && (
            <div className="relative w-28 h-24 rounded-card overflow-hidden flex-shrink-0">
              <Image src={exp.images[0]} alt={exp.title} fill className="object-cover" sizes="112px" />
            </div>
          )}
          <div>
            <p className="font-heading text-xl text-text-primary mb-1">{exp?.title}</p>
            <p className="text-text-muted text-sm">{store?.name}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(b.start_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(b.end_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {b.guests} {b.guests === 1 ? 'hunter' : 'hunters'}
              </span>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <div className="mb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Included Add-ons</p>
            <div className="flex flex-wrap gap-2">
              {addons.map((a: any) => (
                <span key={a.key} className="bg-bg-secondary border border-border rounded-full px-3 py-1 text-xs text-text-primary">
                  ✓ {a.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="card-base p-4 mb-8 text-sm space-y-2">
          <div className="flex justify-between text-text-muted">
            <span>Base fee</span>
            <span className="text-text-primary">{formatCurrency(b.subtotal)}</span>
          </div>
          {b.addons_total > 0 && (
            <div className="flex justify-between text-text-muted">
              <span>Add-ons</span>
              <span className="text-text-primary">{formatCurrency(b.addons_total)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-muted">
            <span>Service fee</span>
            <span className="text-text-primary">{formatCurrency(b.service_fee)}</span>
          </div>
          <Divider />
          <div className="flex justify-between font-heading text-lg">
            <span className="text-text-primary">Total paid</span>
            <span className="text-accent-cream">{formatCurrency(b.total)}</span>
          </div>
        </div>

        {/* Provider contact (only shown after confirmed) */}
        {isConfirmed && store && (
          <div className="card-base p-4 mb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Provider Contact</p>
            <div className="flex items-center gap-3">
              {store.logo_url && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image src={store.logo_url} alt={store.name} fill className="object-cover" sizes="48px" />
                </div>
              )}
              <div>
                <p className="font-heading text-text-primary">{store.name}</p>
                <Link href={`/stores/${store.slug ?? store.id}`} className="text-accent-cream text-xs hover:underline">
                  View store profile →
                </Link>
              </div>
            </div>
            {(exp?.location_city || exp?.location_state) && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-text-muted">
                <MapPin className="h-4 w-4 text-red-primary" />
                <span>
                  {exp.location_name
                    ? exp.location_name
                    : [exp.location_city, exp.location_state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isConfirmed && (
            <a href={`/api/bookings/${b.id}/voucher`} download>
              <Button variant="primary" size="lg" leftIcon={<Download className="h-4 w-4" />}>
                Download PDF Voucher
              </Button>
            </a>
          )}
          <Link href="/user/bookings">
            <Button variant="secondary" size="lg">View My Bookings</Button>
          </Link>
          <Link href="/map">
            <Button variant="ghost" size="lg">Explore More</Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}
