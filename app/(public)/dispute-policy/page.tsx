import { LegalPage } from '@/components/legal/LegalPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dispute Policy — Safree' }

export default function DisputePolicyPage() {
  return (
    <LegalPage title="Dispute Policy" lastUpdated="May 2026">
      <p>If something goes wrong with an order or experience, Safree provides a structured dispute process to reach a fair outcome.</p>

      <h2>When You Can Open a Dispute</h2>
      <ul>
        <li><strong>Orders:</strong> within 7 days after the order is marked delivered.</li>
        <li><strong>Experiences:</strong> within 7 days after the experience is marked completed.</li>
      </ul>

      <h2>Step 1 — Open the Dispute</h2>
      <p>From your order or booking, select &quot;Open Dispute,&quot; choose a reason, describe the issue (at least 50 characters), and optionally upload up to 5 supporting files. You&apos;ll receive a dispute reference number.</p>

      <h2>Step 2 — Provider Response</h2>
      <p>The seller or provider has 3 business days to respond with their account and evidence. If they don&apos;t respond, Safree reviews the dispute based on available information.</p>

      <h2>Step 3 — Safree Resolution</h2>
      <p>Safree reviews both sides and decides one of:</p>
      <ul>
        <li><strong>Full refund</strong> — the full amount is returned to the buyer.</li>
        <li><strong>Partial refund</strong> — a specified amount is returned.</li>
        <li><strong>No refund</strong> — the transaction stands.</li>
      </ul>
      <p>Both parties are notified of the decision by email and in-app notification.</p>

      <h2>Escrow Protection (Experiences)</h2>
      <p>For experiences, funds are held in escrow and are <strong>not</strong> released to the provider while a dispute is open, ensuring funds are available for any refund decision.</p>

      <h2>Questions</h2>
      <p>Contact <a href="mailto:support@safree.com">support@safree.com</a> with your dispute reference number.</p>
    </LegalPage>
  )
}
