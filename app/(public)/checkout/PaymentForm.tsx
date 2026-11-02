'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/formatters'
import { ShieldAlert } from 'lucide-react'

interface PaymentFormProps {
  total: number
  hasHuntingItems: boolean
}

export function PaymentForm({ total, hasHuntingItems }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    })

    // Only reached on error (success causes redirect)
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
        }}
      />

      {hasHuntingItems && (
        <div className="flex gap-2 bg-bg-secondary rounded-card p-3">
          <ShieldAlert className="h-4 w-4 text-accent-cream flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            By purchasing hunting equipment you confirm you are 18 years of age or older and comply with all applicable local laws.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-primary/10 border border-red-primary rounded-card p-3 text-sm text-red-primary">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        disabled={!stripe || !elements}
      >
        Place Order — {formatCurrency(total)}
      </Button>
    </form>
  )
}
