'use client'

import { useEffect } from 'react'

/**
 * Client-side Sentry initializer. Mounted once in the root layout.
 * No-ops without NEXT_PUBLIC_SENTRY_DSN so dev builds stay clean.
 */
export function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (!dsn) return
    import('@sentry/nextjs').then(Sentry => {
      Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'production',
        sendDefaultPii: false,
      })
    }).catch(() => {})
  }, [])

  return null
}
