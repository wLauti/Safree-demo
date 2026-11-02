import { LegalPage } from '@/components/legal/LegalPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Community Standards — Safree' }

export default function ModerationPolicyPage() {
  return (
    <LegalPage title="Community Standards" lastUpdated="May 2026">
      <p>Safree is built for a community of ethical hunters and anglers. These standards keep the platform safe, legal, and respectful.</p>

      <h2>1. Ethical Hunting Guidelines</h2>
      <p>We align with the fair-chase and conservation principles of organizations such as Safari Club International and the NRA. Listings and experiences must promote legal, ethical, and sustainable practices.</p>

      <h2>2. Zero Tolerance for Discrimination</h2>
      <p>We have zero tolerance for content or conduct that discriminates on the basis of race, religion, sexual orientation, national origin, gender, disability, or age. Violations result in immediate removal and may lead to a permanent ban.</p>

      <h2>3. Prohibited Species</h2>
      <p>Listings or experiences involving species protected under <strong>CITES Appendix I</strong> (e.g., tigers, rhinoceros, elephants, snow leopards, sea turtles, pangolins) are strictly prohibited.</p>

      <h2>4. Prohibited Content</h2>
      <ul>
        <li>Firearms, ammunition, suppressors, and related regulated items.</li>
        <li>Illegal wildlife products or poaching-related content.</li>
        <li>Hate speech, harassment, or threats.</li>
        <li>Misleading, fraudulent, or deceptive listings.</li>
        <li>Sexually explicit or graphically violent material.</li>
      </ul>

      <h2>5. Consequences of Violations</h2>
      <ul>
        <li><strong>First offense:</strong> content removal and a warning.</li>
        <li><strong>Repeat or severe offenses:</strong> account suspension.</li>
        <li><strong>Illegal activity:</strong> permanent ban and, where required, referral to authorities.</li>
      </ul>

      <h2>6. Reporting</h2>
      <p>Use the &quot;Flag&quot; option on any listing or review to report a violation. Our moderation team reviews all reports.</p>
    </LegalPage>
  )
}
