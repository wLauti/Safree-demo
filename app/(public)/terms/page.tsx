import { LegalPage } from '@/components/legal/LegalPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — Safree' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="May 2026" draft>
      <p>These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Safree platform. By using Safree, you agree to these Terms.</p>

      <h2>1. Platform Description</h2>
      <p>Safree is an online marketplace connecting buyers with sellers of outdoor gear and with providers of hunting and fishing experiences. Safree facilitates transactions but is not a party to the agreements between buyers and sellers/providers.</p>

      <h2>2. Eligibility</h2>
      <p>You must be at least 18 years old to purchase hunting equipment or book experiences. By transacting, you confirm you meet this requirement and comply with all applicable state and federal laws.</p>

      <h2>3. Seller and Provider (Coto) Responsibilities</h2>
      <ul>
        <li>Provide accurate listings, pricing, and availability.</li>
        <li>Fulfill orders and honor bookings as described.</li>
        <li>Complete Stripe Connect onboarding to receive payments.</li>
        <li>Comply with all hunting, wildlife, and safety regulations.</li>
      </ul>

      <h2>4. Prohibited Content</h2>
      <p>Firearms and ammunition are not permitted on the platform. Listings involving CITES Appendix I species, hate speech, or illegal activity are strictly prohibited. See our <a href="/moderation-policy">Community Standards</a>.</p>

      <h2>5. Commission and Payment Terms</h2>
      <p>Safree charges a platform commission on each transaction, disclosed at checkout. Experience booking funds are held in escrow and released to the provider seven (7) days after the experience completes, absent an open dispute.</p>

      <h2>6. Dispute Resolution</h2>
      <p>Disputes are handled through our structured process. See our <a href="/dispute-policy">Dispute Policy</a>. Safree&apos;s resolution decision is final for platform purposes.</p>

      <h2>7. Limitation of Liability</h2>
      <p>Safree provides the platform &quot;as is.&quot; To the maximum extent permitted by law, Safree is not liable for indirect, incidental, or consequential damages arising from transactions between users.</p>

      <h2>8. Governing Law</h2>
      <p>These Terms are governed by the laws of the State of Texas, USA, without regard to conflict-of-law principles.</p>

      <h2>9. Contact</h2>
      <p>Questions about these Terms: <a href="mailto:legal@safree.com">legal@safree.com</a>.</p>
    </LegalPage>
  )
}
