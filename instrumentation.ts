// Next.js server/edge instrumentation — initializes Sentry on the server.
// No-ops when SENTRY_DSN is not set, so local/dev builds are unaffected.

export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      // Never capture request bodies / headers that may contain secrets or PII
      sendDefaultPii: false,
      beforeSend(event) {
        // Scrub potential PII from the event
        if (event.request) {
          delete event.request.cookies
          delete event.request.data
          if (event.request.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['cookie']
            delete event.request.headers['stripe-signature']
          }
        }
        return event
      },
    })
  }
}
