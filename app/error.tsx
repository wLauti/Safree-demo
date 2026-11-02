'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report to Sentry if configured (no-ops otherwise)
    import('@sentry/nextjs').then(Sentry => Sentry.captureException(error)).catch(() => {})
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4 text-center">
      <p className="font-heading text-[6rem] leading-none text-red-primary">500</p>
      <h1 className="font-heading text-2xl text-accent-cream mb-2">Something went wrong</h1>
      <p className="text-text-muted max-w-md mb-8">
        An unexpected error occurred. Our team has been notified. Please try again.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary">Try Again</button>
        <Link href="/" className="btn-secondary">Back Home</Link>
      </div>
      {error.digest && <p className="text-text-muted/50 text-xs mt-6">Reference: {error.digest}</p>}
    </div>
  )
}
