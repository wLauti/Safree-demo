export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/session'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { NotificationsClient } from './NotificationsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications — Safree' }

export default async function NotificationsPage() {
  await requireAuth()
  return (
    <PageWrapper>
      <div className="py-6 max-w-2xl">
        <h1 className="text-h1 text-text-primary mb-1">Notifications</h1>
        <p className="text-text-muted mb-6">Your recent activity</p>
        <Divider />
        <div className="mt-6">
          <NotificationsClient />
        </div>
      </div>
    </PageWrapper>
  )
}
