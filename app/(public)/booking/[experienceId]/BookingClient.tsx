'use client'

import { useState, useMemo, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { StepIndicator } from '@/components/checkout/StepIndicator'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { formatCurrency } from '@/lib/utils/formatters'
import { POLICY_INFO, daysUntil } from '@/lib/bookings/cancellation'
import type { CancellationPolicy } from '@/lib/bookings/cancellation'
import { notify } from '@/components/ui/Notification'
import { AgeDisclaimer } from '@/components/legal/AgeDisclaimer'
import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight, Users, Calendar, ShieldCheck, Lock } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const STEPS = ['Dates', 'Add-ons', 'Review', 'Payment']

const ADDON_KEYS = ['guide', 'accommodation', 'meals', 'transport', 'equipment']
const ADDON_META: Record<string, { label: string; icon: string; type: 'per_day' | 'flat' }> = {
  guide:         { label: 'Professional Guide',  icon: '🧭', type: 'per_day' },
  accommodation: { label: 'Accommodation',        icon: '🏕️', type: 'per_day' },
  meals:         { label: 'Meals',                icon: '🍖', type: 'per_day' },
  transport:     { label: 'Airport Transport',    icon: '🚗', type: 'flat' },
  equipment:     { label: 'Equipment Package',    icon: '🎯', type: 'flat' },
}

interface AvailRow { date: string; slots: number; slots_booked: number; is_blocked: boolean }

interface ExperienceData {
  id: string
  slug: string | null
  title: string
  price_per_person: number
  max_guests: number
  addon_prices: Record<string, number>
  cancellation_policy: string
  images: string[]
  location_city: string | null
  location_state: string | null
  min_booking_days: number
  stores: { name: string }
}

interface Props {
  experience: ExperienceData
  initialStart?: string
  initialEnd?: string
  initialGuests?: number
}

// ── Minimal calendar for date range selection ─────────────────
function BookingCalendar({
  experienceId, value, onChange, availability,
}: {
  experienceId: string
  value: { start: string | null; end: string | null }
  onChange: (v: { start: string | null; end: string | null }) => void
  availability: AvailRow[]
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [hovering, setHovering] = useState<string | null>(null)

  const avMap = new Map(availability.map(a => [a.date, a]))
  const days = new Date(year, month, 0).getDate()
  const startDay = new Date(year, month - 1, 1).getDay()

  function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function getStatus(iso: string): 'available' | 'booked' | 'past' {
    if (iso < today.toISOString().split('T')[0]) return 'past'
    const row = avMap.get(iso)
    if (!row) return 'available'
    if (row.is_blocked) return 'booked'
    if (row.slots > 0 && row.slots_booked >= row.slots) return 'booked'
    return 'available'
  }

  function handleClick(iso: string) {
    if (getStatus(iso) !== 'available') return
    if (!value.start || (value.start && value.end)) {
      onChange({ start: iso, end: null })
    } else {
      const [s, e] = iso < value.start ? [iso, value.start] : [value.start, iso]
      onChange({ start: s, end: e })
    }
  }

  function inRange(iso: string) {
    const end = value.end ?? hovering
    if (!value.start || !end) return false
    const [s, e] = value.start <= end ? [value.start, end] : [end, value.start]
    return iso > s && iso < e
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS_H = ['Su','Mo','Tu','We','Th','Fr','Sa']

  function navPrev() { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  function navNext() { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={navPrev} className="p-1 text-text-muted hover:text-text-primary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="font-heading text-text-primary text-sm">{MONTHS[month - 1]} {year}</span>
        <button onClick={navNext} className="p-1 text-text-muted hover:text-text-primary"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_H.map(d => <div key={d} className="text-center text-[10px] text-text-muted">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1
          const iso = toISO(year, month, day)
          const status = getStatus(iso)
          const isStart = value.start === iso
          const isEnd = value.end === iso
          const range = inRange(iso)
          return (
            <button
              key={iso}
              onClick={() => handleClick(iso)}
              onMouseEnter={() => value.start && !value.end && setHovering(iso)}
              onMouseLeave={() => setHovering(null)}
              disabled={status !== 'available'}
              className={cn(
                'h-8 text-xs rounded transition-colors',
                status === 'past' && 'text-text-muted/30 cursor-default',
                status === 'booked' && 'text-red-primary/40 cursor-not-allowed line-through',
                status === 'available' && !range && !isStart && !isEnd && 'text-text-primary hover:bg-red-primary/20 cursor-pointer',
                range && 'bg-red-primary/20 text-text-primary',
                (isStart || isEnd) && 'bg-red-primary text-accent-cream font-bold',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Stripe payment form ───────────────────────────────────────
function PaymentForm({ total, bookingId, onError }: { total: number; bookingId: string; onError: (msg: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/booking/confirmation/${bookingId}` },
    })
    if (error) { onError(error.message ?? 'Payment failed'); setLoading(false) }
  }

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs', paymentMethodOrder: ['apple_pay', 'google_pay', 'card'] }} />
      <div className="flex items-start gap-2 bg-bg-secondary rounded-card p-3 text-xs text-text-muted">
        <Lock className="h-3.5 w-3.5 text-green-400 flex-shrink-0 mt-0.5" />
        Your funds are held securely in escrow until 7 days after your experience ends.
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!stripe || !elements}>
        Confirm &amp; Pay — {formatCurrency(total)}
      </Button>
    </form>
  )
}

// ── Main booking client ───────────────────────────────────────
export function BookingClient({ experience, initialStart, initialEnd, initialGuests = 1 }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: initialStart ?? null,
    end: initialEnd ?? null,
  })
  const [guests, setGuests] = useState(Math.min(initialGuests, experience.max_guests))
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [availability, setAvailability] = useState<AvailRow[]>([])

  const [clientSecret, setClientSecret] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [intentTotal, setIntentTotal] = useState(0)
  const [creatingIntent, setCreatingIntent] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const nights = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return 0
    return Math.max(0, Math.round(
      (new Date(dateRange.end + 'T00:00').getTime() - new Date(dateRange.start + 'T00:00').getTime()) / 86400000
    ))
  }, [dateRange])

  const addonPrices = experience.addon_prices ?? {}

  const addonDetails = useMemo(() => {
    return selectedAddons
      .filter(k => addonPrices[k] != null)
      .map(k => {
        const meta = ADDON_META[k]
        const unitPrice = addonPrices[k]
        const price = meta?.type === 'per_day' ? unitPrice * nights : unitPrice
        return { key: k, label: meta?.label ?? k, price }
      })
  }, [selectedAddons, addonPrices, nights])

  const subtotal = experience.price_per_person * guests * nights
  const addonsTotal = addonDetails.reduce((s, a) => s + a.price, 0)
  const serviceFeeRate = 5 // displayed; actual rate read server-side
  const serviceFee = Math.round((subtotal + addonsTotal) * serviceFeeRate / 100 * 100) / 100
  const total = subtotal + addonsTotal + serviceFee

  const policy = (experience.cancellation_policy ?? 'moderate') as CancellationPolicy
  const policyInfo = POLICY_INFO[policy]

  const canProceed = dateRange.start && dateRange.end && nights >= (experience.min_booking_days ?? 1)

  const createIntent = async () => {
    setCreatingIntent(true)
    setPaymentError('')
    const res = await fetch('/api/bookings/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experience_id: experience.id,
        start_date: dateRange.start,
        end_date: dateRange.end,
        guests,
        selected_addons: selectedAddons,
      }),
    })
    const data = await res.json()
    setCreatingIntent(false)
    if (!res.ok) {
      notify.error(data.error ?? 'Booking failed')
      return false
    }
    // DEMO MODE: booking confirmed server-side — go straight to My Bookings.
    if (data.demo) {
      notify.success('¡Reserva simulada confirmada! (modo demo)')
      router.push('/user/bookings')
      return false
    }
    setClientSecret(data.clientSecret)
    setBookingId(data.bookingId)
    setIntentTotal(data.total)
    return true
  }

  const handleNext = async () => {
    if (step === 2) {
      const ok = await createIntent()
      if (ok) setStep(3)
    } else {
      setStep(s => s + 1)
    }
  }

  // Price summary sidebar
  const PriceSummary = () => (
    <div className="card-base p-4 space-y-2 text-sm">
      <h3 className="font-heading text-text-primary mb-3">Price Summary</h3>
      {nights > 0 ? (
        <>
          <div className="flex justify-between text-text-muted">
            <span>{formatCurrency(experience.price_per_person)} × {guests} {guests === 1 ? 'guest' : 'guests'} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
            <span className="text-text-primary">{formatCurrency(subtotal)}</span>
          </div>
          {addonDetails.map(a => (
            <div key={a.key} className="flex justify-between text-text-muted">
              <span>{a.label}</span>
              <span className="text-text-primary">{formatCurrency(a.price)}</span>
            </div>
          ))}
          <div className="flex justify-between text-text-muted">
            <span>Safree service fee ({serviceFeeRate}%)</span>
            <span className="text-text-primary">{formatCurrency(serviceFee)}</span>
          </div>
          <Divider />
          <div className="flex justify-between font-heading text-lg">
            <span className="text-text-primary">Total</span>
            <span className="text-accent-cream">{formatCurrency(total)}</span>
          </div>
        </>
      ) : (
        <p className="text-text-muted text-xs">Select dates to see pricing</p>
      )}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator steps={STEPS} current={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* ── Step 0: Dates ─────────────────────────────── */}
          {step === 0 && (
            <>
              <h2 className="font-heading text-xl text-text-primary">Select Dates &amp; Party Size</h2>
              <BookingCalendar
                experienceId={experience.id}
                value={dateRange}
                onChange={setDateRange}
                availability={availability}
              />

              {dateRange.start && dateRange.end && (
                <div className="card-base p-3 text-sm flex gap-3 items-center">
                  <Calendar className="h-4 w-4 text-accent-cream flex-shrink-0" />
                  <span className="text-text-primary">
                    {new Date(dateRange.start + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(dateRange.end + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}
                    <strong>{nights} {nights === 1 ? 'night' : 'nights'}</strong>
                  </span>
                </div>
              )}

              {experience.min_booking_days > 1 && nights > 0 && nights < experience.min_booking_days && (
                <p className="text-red-primary text-sm">Minimum booking is {experience.min_booking_days} nights.</p>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-sm text-text-muted mb-2">
                  <Users className="h-3.5 w-3.5" /> Party size
                </label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-primary hover:border-red-primary transition-colors">–</button>
                  <span className="font-heading text-xl text-text-primary w-8 text-center">{guests}</span>
                  <button onClick={() => setGuests(g => Math.min(experience.max_guests, g + 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-primary hover:border-red-primary transition-colors">+</button>
                  <span className="text-text-muted text-xs">Max {experience.max_guests}</span>
                </div>
              </div>
            </>
          )}

          {/* ── Step 1: Add-ons ───────────────────────────── */}
          {step === 1 && (
            <>
              <h2 className="font-heading text-xl text-text-primary">Select Add-ons</h2>
              <p className="text-text-muted text-sm">Enhance your experience with optional extras.</p>
              <div className="space-y-3">
                {ADDON_KEYS.filter(k => addonPrices[k] != null).map(k => {
                  const meta = ADDON_META[k]
                  const unitPrice = addonPrices[k]
                  const price = meta.type === 'per_day' ? unitPrice * nights : unitPrice
                  const active = selectedAddons.includes(k)
                  return (
                    <button
                      key={k}
                      onClick={() => setSelectedAddons(prev => active ? prev.filter(a => a !== k) : [...prev, k])}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-card border text-left transition-colors',
                        active ? 'border-accent-cream bg-accent-cream/5' : 'border-border hover:border-red-primary/40'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors', active ? 'bg-accent-cream border-accent-cream' : 'border-border')}>
                          {active && <span className="text-bg-primary text-xs font-bold">✓</span>}
                        </div>
                        <div>
                          <p className="text-text-primary text-sm font-body">{meta.icon} {meta.label}</p>
                          <p className="text-text-muted text-xs">
                            {formatCurrency(unitPrice)}{meta.type === 'per_day' ? '/day' : ' flat'} · {formatCurrency(price)} for {nights} {nights === 1 ? 'night' : 'nights'}
                          </p>
                        </div>
                      </div>
                      <span className="font-heading text-accent-cream">{formatCurrency(price)}</span>
                    </button>
                  )
                }).concat(
                  ADDON_KEYS.filter(k => addonPrices[k] == null).length > 0
                    ? [<p key="none" className="text-text-muted text-sm text-center py-4">No add-ons configured by this provider.</p>]
                    : []
                )}
              </div>
            </>
          )}

          {/* ── Step 2: Review ────────────────────────────── */}
          {step === 2 && (
            <>
              <h2 className="font-heading text-xl text-text-primary">Review Booking</h2>

              {/* Experience card */}
              <div className="card-base flex gap-4 p-4">
                {experience.images?.[0] && (
                  <div className="relative w-24 h-20 rounded-card overflow-hidden flex-shrink-0">
                    <Image src={experience.images[0]} alt={experience.title} fill className="object-cover" sizes="96px" />
                  </div>
                )}
                <div>
                  <p className="font-heading text-text-primary">{experience.title}</p>
                  <p className="text-text-muted text-sm">{experience.stores.name}</p>
                  <p className="text-text-muted text-xs">{[experience.location_city, experience.location_state].filter(Boolean).join(', ')}</p>
                </div>
              </div>

              {/* Booking details */}
              <div className="card-base p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Dates</span>
                  <span className="text-text-primary">
                    {dateRange.start && new Date(dateRange.start + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {dateRange.end && new Date(dateRange.end + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' '}({nights} {nights === 1 ? 'night' : 'nights'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Party size</span>
                  <span className="text-text-primary">{guests} {guests === 1 ? 'hunter' : 'hunters'}</span>
                </div>
                {addonDetails.map(a => (
                  <div key={a.key} className="flex justify-between">
                    <span className="text-text-muted">{a.label}</span>
                    <span className="text-text-primary">{formatCurrency(a.price)}</span>
                  </div>
                ))}
                <Divider />
                <div className="flex justify-between">
                  <span className="text-text-muted">Base ({formatCurrency(experience.price_per_person)} × {guests} × {nights})</span>
                  <span className="text-text-primary">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Safree service fee ({serviceFeeRate}%)</span>
                  <span className="text-text-primary">{formatCurrency(serviceFee)}</span>
                </div>
                <Divider />
                <div className="flex justify-between font-heading text-lg">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent-cream">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Cancellation policy */}
              <div className="card-base p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-accent-cream" />
                  <span className="font-heading text-text-primary text-sm">Cancellation Policy: {policyInfo.name}</span>
                </div>
                <ul className="space-y-1">
                  {policyInfo.details.map((d, i) => (
                    <li key={i} className="text-text-muted text-xs flex items-start gap-1.5">
                      <span className="text-accent-cream mt-0.5">·</span> {d}
                    </li>
                  ))}
                </ul>
              </div>

              <AgeDisclaimer />
            </>
          )}

          {/* ── Step 3: Payment ───────────────────────────── */}
          {step === 3 && clientSecret && (
            <>
              <h2 className="font-heading text-xl text-text-primary">Payment</h2>
              <div className="text-center mb-4">
                <span className="font-heading text-4xl text-accent-cream">{formatCurrency(intentTotal)}</span>
                <p className="text-text-muted text-sm mt-1">Total due today</p>
              </div>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: { colorPrimary: '#E6DDBC', colorBackground: '#262525', colorText: '#E6DDBC', borderRadius: '6px' },
                  },
                }}
              >
                <PaymentForm total={intentTotal} bookingId={bookingId} onError={msg => { setPaymentError(msg); setStep(3) }} />
              </Elements>
              {paymentError && (
                <div className="bg-red-primary/10 border border-red-primary rounded-card p-3 text-sm text-red-primary">
                  {paymentError}
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Button>}
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={step === 0 && !canProceed}
                loading={creatingIntent}
              >
                {step === 2 ? 'Proceed to Payment' : 'Continue'}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <PriceSummary />
          {step >= 0 && dateRange.start && dateRange.end && (
            <div className="card-base p-3 text-xs text-text-muted space-y-1">
              <p className="text-text-primary font-body font-medium">Your booking</p>
              <p>{new Date(dateRange.start + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(dateRange.end + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p>{guests} {guests === 1 ? 'hunter' : 'hunters'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
