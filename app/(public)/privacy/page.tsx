import { LegalPage } from '@/components/legal/LegalPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — Safree' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="May 2026" draft>
      <p>This Privacy Policy explains how Safree Inc. (&quot;Safree,&quot; &quot;we,&quot; &quot;us&quot;) collects, uses, and protects your personal information when you use our marketplace and booking platform.</p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email address, phone number, password (hashed), and profile details.</li>
        <li><strong>Transaction data:</strong> orders, bookings, shipping addresses, and payment records (card data is handled by Stripe — we never store full card numbers).</li>
        <li><strong>Content you submit:</strong> reviews, listings, dispute descriptions, and uploaded files.</li>
        <li><strong>Technical data:</strong> IP address, device/browser information, and cookies (see our cookie banner).</li>
        <li><strong>Location data:</strong> approximate location for map-based discovery, only where you provide it.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To operate the marketplace: process orders, bookings, payments, and payouts.</li>
        <li>To provide customer support and resolve disputes.</li>
        <li>To send transactional emails and (with consent) push notifications.</li>
        <li>To detect fraud, abuse, and policy violations.</li>
        <li>To improve the platform via aggregated, de-identified analytics (only after consent).</li>
      </ul>

      <h2>3. Third-Party Service Providers</h2>
      <p>We share data only as necessary with these processors:</p>
      <ul>
        <li><strong>Stripe</strong> — payment processing and Connect payouts.</li>
        <li><strong>Mapbox</strong> — interactive maps.</li>
        <li><strong>Resend</strong> — transactional email delivery.</li>
        <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
        <li><strong>Vercel</strong> — application hosting.</li>
      </ul>

      <h2>4. Your Rights Under CCPA</h2>
      <p>If you are a California resident, you have the following rights:</p>
      <ul>
        <li><strong>Right to Know:</strong> request a copy of the personal data we hold about you (Account → Privacy → &quot;Download My Data&quot;).</li>
        <li><strong>Right to Delete:</strong> request deletion of your account and personal data (Account → Privacy → &quot;Delete My Account&quot;).</li>
        <li><strong>Right to Opt-Out of Sale:</strong> <strong>Safree does not sell your personal data.</strong></li>
        <li><strong>Right to Non-Discrimination:</strong> we will never discriminate against you for exercising these rights.</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>When you delete your account, personal data is removed and financial records are anonymized and retained as required by law. Some data may take up to 30 days to purge from encrypted backups.</p>

      <h2>6. Contact</h2>
      <p>For privacy requests or questions, contact <a href="mailto:legal@safree.com">legal@safree.com</a>.</p>
    </LegalPage>
  )
}
