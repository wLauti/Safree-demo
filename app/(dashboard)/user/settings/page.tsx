export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/session'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { DeleteAccountSection } from './DeleteAccountSection'
import { Download, ShieldCheck } from 'lucide-react'
import { CookiePrefsButton } from '@/components/legal/CookiePrefsButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Account Settings — Safree' }

export default async function SettingsPage() {
  await requireAuth()

  return (
    <PageWrapper>
      <div className="py-6 max-w-2xl">
        <h1 className="text-h1 text-text-primary mb-1">Account & Privacy</h1>
        <p className="text-text-muted mb-6">Manage your data and privacy preferences.</p>
        <Divider />

        <div className="mt-6 space-y-5">
          {/* Data export */}
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-5 w-5 text-accent-cream" />
              <h3 className="font-heading text-text-primary">Download My Data</h3>
            </div>
            <p className="text-text-muted text-sm mb-4">
              Export a JSON copy of your profile, orders, bookings, reviews, and saved items (CCPA Right to Know).
            </p>
            <a href="/api/account/export" download>
              <span className="btn-secondary inline-flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" /> Download My Data
              </span>
            </a>
          </div>

          {/* Cookie preferences */}
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-accent-cream" />
              <h3 className="font-heading text-text-primary">Cookie Preferences</h3>
            </div>
            <p className="text-text-muted text-sm mb-4">
              Review or change which cookies Safree may use.
            </p>
            <CookiePrefsButton />
          </div>

          {/* Delete account */}
          <DeleteAccountSection />
        </div>
      </div>
    </PageWrapper>
  )
}
