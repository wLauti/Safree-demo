# Pre-Launch Checklist

Status legend: ✅ done in code · ⚙️ infra/dashboard step · ⚠️ needs human sign-off

## Legal & Compliance
- ⚠️ T&C reviewed by lawyer (or explicit sign-off that the "DRAFT" banner risk is understood)
- ✅ Privacy Policy CCPA sections complete (`/privacy`)
- ✅ Cookie consent working (banner + footer re-open; tested across browsers via E2E)
- ✅ Age disclaimer on product pages and booking flow
- ⚙️ Legal email set up (legal@safree.com)
- ✅ DMCA/legal links in footer (Privacy, Terms, Community Standards, etc.)

## Security
- ✅ Admin 2FA enrollment available (`/admin/security`); ⚙️ enforce AAL2 at project level before go-live
- ⚙️ All env vars set in Vercel (no `.env` on server)
- ⚙️ Stripe webhook in **live** mode
- ⚙️ Supabase PITR backups enabled
- ⚙️ Sentry DSN set and receiving events (init code + PII scrubbing in place)
- ✅ Rate limiting on auth/checkout/default routes (`middleware.ts`)
- ✅ Generic error responses in prod via `handleRoute` (no stack traces / sensitive logs)

## Payments
- ⚙️ Stripe Connect live mode tested with a real connected account
- ✅ Commission rate read from `integration_keys` (configurable in `/admin/credentials`)
- ✅ Vercel Cron for escrow release scheduled (`vercel.json` → `/api/cron/release-funds`); ⚙️ verify on staging
- ⚙️ `STRIPE_WEBHOOK_SECRET` set in production

## Functionality
- ✅ 5 E2E journeys authored (run on staging via `npm run test:e2e`)
- ✅ RLS audit suite (`npm run rls-audit`)
- ⚙️ Email sending verified with Resend production key
- ⚙️ Push notifications verified end-to-end (VAPID keys set)
- ✅ PDF voucher generation (`/api/bookings/[id]/voucher`)
- ✅ Map loads (Leaflet + CARTO/OpenStreetMap tiles — no API key, no WebGL)
- ✅ Moderator queue shows pending listings with automated check flags
- ✅ Error pages styled (`app/not-found.tsx`, `app/error.tsx`)

## Performance
- ✅ Database indexes applied (`013_sprint9_indexes.sql`)
- ✅ Leaflet code-split on `/map` via `next/dynamic({ ssr: false })`
- ⚙️ Lighthouse run on homepage, `/products`, `/map`, `/checkout` (targets: Perf ≥85, A11y ≥90, BP ≥90, SEO ≥85)

## Sign-off
- [ ] All unit + integration tests green (`npm test`) — **99 passing**
- [ ] RLS audit green against staging
- [ ] All 5 E2E journeys green against staging
- [ ] Lighthouse targets met
- [ ] Legal review complete; DRAFT banners removed from `/privacy` and `/terms`
