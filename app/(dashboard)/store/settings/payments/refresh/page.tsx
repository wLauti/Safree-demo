'use client'

import { useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Loader'

export default function PaymentsRefreshPage() {
  useEffect(() => {
    // Re-initiate onboarding with a fresh link
    fetch('/api/store/onboarding', { method: 'POST' })
      .then(r => r.json())
      .then(({ url }) => { if (url) window.location.href = url })
      .catch(() => { window.location.href = '/store/settings/payments' })
  }, [])

  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner className="h-10 w-10" />
        <p className="text-text-muted">Generating a new onboarding link…</p>
      </div>
    </PageWrapper>
  )
}
