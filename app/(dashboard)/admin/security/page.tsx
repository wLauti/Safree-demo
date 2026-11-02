export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { MFAEnroll } from './MFAEnroll'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Security — Admin — Safree' }

export default async function AdminSecurityPage() {
  await requireRole(['admin'])

  return (
    <PageWrapper>
      <div className="py-6 max-w-2xl">
        <h1 className="text-h1 text-text-primary mb-1">Security</h1>
        <p className="text-text-muted mb-6">Protect your admin account with two-factor authentication.</p>
        <Divider />
        <div className="mt-6 space-y-5">
          <MFAEnroll />
          <div className="card-base p-5">
            <h3 className="font-heading text-text-primary mb-2">Session Policy</h3>
            <ul className="text-text-muted text-sm space-y-1 list-disc pl-5">
              <li>Access tokens expire after 1 hour; refresh tokens after 7 days.</li>
              <li>Changing a user&apos;s role forces re-authentication on their next request.</li>
              <li>Sensitive actions (credentials, suspensions, dispute resolutions) re-verify your identity.</li>
            </ul>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
