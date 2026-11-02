'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { useCartStore } from '@/store/cartStore'
import { StepIndicator } from '@/components/checkout/StepIndicator'
import { PaymentForm } from './PaymentForm'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { QuantitySelector } from '@/components/products/QuantitySelector'
import { formatCurrency } from '@/lib/utils/formatters'
import { US_STATES } from '@/lib/utils/constants'
import { MapPin, Trash2, Tag, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notify } from '@/components/ui/Notification'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const STEPS = ['Review', 'Address', 'Shipping', 'Payment']
const PROMO_CODES: Record<string, number> = { SAFREE10: 0.1, OUTDOOR20: 0.2, TEXAS15: 0.15 }

interface ShippingRate {
  id: string
  name: string
  description: string
  price: number
  estimated_days_min: number
  estimated_days_max: number
}

interface SavedAddress {
  id: string
  full_name: string
  line1: string
  line2?: string | null
  city: string
  state: string
  zip: string
  country: string
  is_default: boolean
}

interface CheckoutClientProps {
  userId: string
  savedAddresses: SavedAddress[]
  shippingRates: ShippingRate[]
}

export function CheckoutClient({ userId, savedAddresses, shippingRates }: CheckoutClientProps) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Step 1 state
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState('')

  // Step 2 state
  const [address, setAddress] = useState({
    full_name: '', line1: '', line2: '', city: '',
    state: 'Texas', zip: '', country: 'US', save: false,
  })
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({})
  const [selectedSavedAddr, setSelectedSavedAddr] = useState<string | null>(
    savedAddresses.find(a => a.is_default)?.id ?? null
  )

  // Step 3 state
  const [selectedRateId, setSelectedRateId] = useState(shippingRates[0]?.id ?? '')

  // Step 4 state
  const [clientSecret, setClientSecret] = useState('')
  const [intentTotal, setIntentTotal] = useState(0)
  const [creatingIntent, setCreatingIntent] = useState(false)

  const selectedRate = shippingRates.find(r => r.id === selectedRateId)

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountRate = appliedPromo ? (PROMO_CODES[appliedPromo] ?? 0) : 0
  const discount = Math.round(subtotal * discountRate * 100) / 100
  const shippingCost = selectedRate?.price ?? 0
  const total = subtotal - discount + shippingCost

  const hasHuntingItems = true // All products are hunting/fishing related

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    if (PROMO_CODES[code]) {
      setAppliedPromo(code)
      setPromoError('')
      notify.success(`${Math.round(PROMO_CODES[code] * 100)}% discount applied!`)
    } else {
      setPromoError('Invalid promo code.')
    }
  }

  const validateAddress = () => {
    const errors: Record<string, string> = {}
    if (!address.full_name.trim()) errors.full_name = 'Required'
    if (!address.line1.trim()) errors.line1 = 'Required'
    if (!address.city.trim()) errors.city = 'Required'
    if (!address.state) errors.state = 'Required'
    if (!address.zip.trim()) errors.zip = 'Required'
    else if (!/^\d{5}(-\d{4})?$/.test(address.zip)) errors.zip = 'Enter a valid ZIP'
    setAddrErrors(errors)
    return Object.keys(errors).length === 0
  }

  const getActiveAddress = (): SavedAddress | typeof address => {
    if (selectedSavedAddr) {
      return savedAddresses.find(a => a.id === selectedSavedAddr) ?? address
    }
    return address
  }

  const advanceToPayment = async () => {
    const activeAddr = getActiveAddress()
    setCreatingIntent(true)
    try {
      const res = await fetch('/api/checkout/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          shippingAddress: {
            full_name: (activeAddr as any).full_name,
            line1: (activeAddr as any).line1,
            line2: (activeAddr as any).line2 || null,
            city: (activeAddr as any).city,
            state: (activeAddr as any).state,
            zip: (activeAddr as any).zip,
            country: (activeAddr as any).country || 'US',
            save: !selectedSavedAddr && address.save,
          },
          shippingRateId: selectedRateId,
          promoCode: appliedPromo,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'out_of_stock') {
          notify.error('Some items are no longer available. Please review your cart.')
          setStep(0)
          return
        }
        if (data.error === 'store_not_ready') {
          notify.error("One store hasn't completed payment setup yet. Remove their items to continue.")
          setStep(0)
          return
        }
        throw new Error(data.error ?? 'Failed to initialize payment')
      }

      // DEMO MODE: payment was simulated server-side — go straight to orders.
      if (data.demo) {
        clearCart()
        notify.success('¡Compra simulada confirmada! (modo demo)')
        router.push('/user/orders')
        return
      }

      setClientSecret(data.clientSecret)
      setIntentTotal(data.total)
      setStep(3)
    } catch (err: any) {
      notify.error(err.message ?? 'Something went wrong. Please try again.')
    }
    setCreatingIntent(false)
  }

  const handleContinue = () => {
    if (step === 0) { setStep(1); return }
    if (step === 1) {
      if (selectedSavedAddr || validateAddress()) setStep(2)
      return
    }
    if (step === 2) { advanceToPayment(); return }
  }

  const field = (
    key: keyof typeof address,
    label: string,
    opts: { type?: string; placeholder?: string; required?: boolean } = {}
  ) => (
    <div>
      <label className="block text-sm text-text-muted mb-1.5">{label}{opts.required !== false && <span className="text-red-primary ml-1">*</span>}</label>
      <input
        type={opts.type ?? 'text'}
        value={address[key] as string}
        onChange={e => { setAddress(p => ({ ...p, [key]: e.target.value })); setAddrErrors(p => ({ ...p, [key]: '' })) }}
        placeholder={opts.placeholder}
        className={cn('input-base w-full', addrErrors[key] && 'border-red-primary')}
      />
      {addrErrors[key] && <p className="text-xs text-red-primary mt-1">{addrErrors[key]}</p>}
    </div>
  )

  // — Order Summary sidebar —
  const OrderSummary = () => (
    <div className="card-base p-5">
      <h3 className="font-heading text-text-primary mb-4">Order Summary</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span className="text-text-primary">{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-400">
            <span>Discount ({appliedPromo})</span>
            <span>−{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-text-muted">
          <span>Shipping</span>
          <span className={cn('text-text-primary', shippingCost === 0 && step >= 2 && 'text-green-400')}>
            {step < 2 ? 'Calculated at next step' : shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
          </span>
        </div>
        <Divider />
        <div className="flex justify-between font-heading text-lg">
          <span className="text-text-primary">Total</span>
          <span className="text-accent-cream">{formatCurrency(step >= 2 ? total : subtotal - discount)}</span>
        </div>
      </div>
    </div>
  )

  if (items.length === 0 && step < 3) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted mb-4">Your cart is empty.</p>
        <Link href="/products"><Button variant="primary">Browse Products</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <StepIndicator steps={STEPS} current={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">

          {/* ── Step 1: Review ── */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl text-text-primary">Review Your Cart</h2>
              {items.map(item => (
                <div key={item.product_id} className="card-base p-4 flex gap-4">
                  <div className="relative w-20 h-20 rounded-card overflow-hidden bg-bg-primary flex-shrink-0">
                    {item.image_url
                      ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="80px" />
                      : <div className="w-full h-full bg-bg-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted uppercase tracking-wide">{item.store_name}</p>
                    <p className="text-text-primary font-body line-clamp-2 text-sm leading-snug">{item.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={qty => updateQuantity(item.product_id, qty)}
                        max={Math.min(item.stock, 10)}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-accent-cream">{formatCurrency(item.price * item.quantity)}</span>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-text-muted hover:text-red-primary transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Promo */}
              <div className="card-base p-4">
                <p className="text-sm font-body text-text-muted mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Promo Code
                </p>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-bg-primary rounded-card px-3 py-2">
                    <span className="text-sm text-accent-cream font-mono">{appliedPromo}</span>
                    <button onClick={() => { setAppliedPromo(null); setPromoInput('') }} className="text-xs text-text-muted hover:text-red-primary">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value); setPromoError('') }}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      placeholder="Enter code"
                      className="input-base flex-1 text-sm"
                    />
                    <Button variant="secondary" size="sm" onClick={applyPromo}>Apply</Button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-primary mt-1">{promoError}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: Shipping Address ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl text-text-primary">Shipping Address</h2>

              {savedAddresses.length > 0 && (
                <div className="space-y-2 mb-2">
                  <p className="text-sm text-text-muted">Saved addresses</p>
                  {savedAddresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedSavedAddr(addr.id)}
                      className={cn(
                        'w-full text-left card-base p-3 text-sm transition-colors',
                        selectedSavedAddr === addr.id
                          ? 'border-red-primary bg-red-primary/5'
                          : 'hover:border-red-primary/40'
                      )}
                    >
                      <p className="text-text-primary font-body">{addr.full_name} — {addr.line1}, {addr.city}, {addr.state}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedSavedAddr(null)}
                    className={cn(
                      'w-full text-left card-base p-3 text-sm transition-colors',
                      !selectedSavedAddr ? 'border-accent-cream bg-accent-cream/5' : 'hover:border-border'
                    )}
                  >
                    <p className="text-text-muted">+ Enter a new address</p>
                  </button>
                </div>
              )}

              {!selectedSavedAddr && (
                <div className="space-y-4">
                  {field('full_name', 'Full Name', { placeholder: 'John Smith' })}
                  {field('line1', 'Address Line 1', { placeholder: '123 Main St' })}
                  {field('line2', 'Address Line 2', { placeholder: 'Apt 4B', required: false })}
                  <div className="grid grid-cols-2 gap-4">
                    {field('city', 'City', { placeholder: 'Austin' })}
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">State <span className="text-red-primary">*</span></label>
                      <select
                        value={address.state}
                        onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}
                        className="input-base w-full"
                      >
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  {field('zip', 'ZIP Code', { placeholder: '78701' })}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={address.save}
                      onChange={e => setAddress(p => ({ ...p, save: e.target.checked }))}
                      className="accent-red-primary"
                    />
                    <span className="text-sm text-text-muted">Save this address for future orders</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Shipping Method ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl text-text-primary">Shipping Method</h2>
              {shippingRates.map(rate => (
                <button
                  key={rate.id}
                  onClick={() => setSelectedRateId(rate.id)}
                  className={cn(
                    'w-full card-base p-4 text-left transition-colors',
                    selectedRateId === rate.id
                      ? 'border-accent-cream bg-accent-cream/5'
                      : 'hover:border-red-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex-shrink-0',
                        selectedRateId === rate.id
                          ? 'border-accent-cream bg-accent-cream'
                          : 'border-border'
                      )} />
                      <div>
                        <p className="text-text-primary font-body font-medium">{rate.name}</p>
                        <p className="text-text-muted text-sm">{rate.description}</p>
                      </div>
                    </div>
                    <span className="font-heading text-accent-cream text-lg">{formatCurrency(rate.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 4: Payment ── */}
          {step === 3 && clientSecret && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl text-text-primary">Payment</h2>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#E6DDBC',
                      colorBackground: '#262525',
                      colorText: '#E6DDBC',
                      colorDanger: '#822626',
                      borderRadius: '6px',
                    },
                  },
                }}
              >
                <PaymentForm total={intentTotal} hasHuntingItems={hasHuntingItems} />
              </Elements>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 3 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
                  ← Back
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinue}
                loading={creatingIntent}
                rightIcon={step < 2 ? <ChevronRight className="h-4 w-4" /> : undefined}
              >
                {step === 2 ? 'Continue to Payment' : 'Continue'}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <OrderSummary />

          {step >= 1 && selectedSavedAddr && (
            <div className="card-base p-4 text-sm">
              <p className="text-text-muted mb-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Shipping to</p>
              {(() => {
                const addr = savedAddresses.find(a => a.id === selectedSavedAddr)
                return addr ? (
                  <p className="text-text-primary leading-relaxed">
                    {addr.full_name}<br />
                    {addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}<br />
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                ) : null
              })()}
            </div>
          )}

          {step >= 2 && selectedRate && (
            <div className="card-base p-4 text-sm">
              <p className="text-text-muted mb-1">Shipping method</p>
              <p className="text-text-primary font-body">{selectedRate.name}</p>
              <p className="text-text-muted">{selectedRate.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
