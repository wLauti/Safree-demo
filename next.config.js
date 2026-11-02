/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    // In development Next.js uses eval() for HMR and source maps.
    // Blocking eval() via CSP silently prevents React from hydrating,
    // so client-side event handlers are never attached.
    // We only enforce the strict CSP in production.
    if (isDev) return []

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob: *.supabase.co *.tile.openstreetmap.org *.basemaps.cartocdn.com",
              "script-src 'self' 'unsafe-inline' js.stripe.com",
              "worker-src blob:",
              "connect-src 'self' *.supabase.co *.tile.openstreetmap.org *.basemaps.cartocdn.com api.stripe.com *.ingest.sentry.io *.ingest.us.sentry.io",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: *.basemaps.cartocdn.com",
              "frame-src js.stripe.com www.openstreetmap.org",
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
