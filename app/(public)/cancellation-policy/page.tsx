import { LegalPage } from '@/components/legal/LegalPage'
import { POLICY_INFO } from '@/lib/bookings/cancellation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cancellation Policy — Safree' }

export default function CancellationPolicyPage() {
  return (
    <LegalPage title="Cancellation Policy" lastUpdated="May 2026">
      <p>Each experience provider chooses one of three cancellation policies. The applicable policy is shown clearly before you pay and on your booking confirmation.</p>

      {(['flexible', 'moderate', 'strict'] as const).map(tier => {
        const info = POLICY_INFO[tier]
        return (
          <div key={tier}>
            <h2>{info.name}</h2>
            <p>{info.description}</p>
            <ul>
              {info.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )
      })}

      <h2>How Refunds Work</h2>
      <ul>
        <li>The Safree service fee is non-refundable.</li>
        <li>Eligible refunds are issued to your original payment method via Stripe, typically within 5–10 business days.</li>
        <li>Cancelling releases your reserved dates back to the provider&apos;s availability.</li>
      </ul>

      <h2>Provider Cancellations</h2>
      <p>If a provider cancels a confirmed booking, you will receive a full refund including the service fee.</p>
    </LegalPage>
  )
}
