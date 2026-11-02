# Production Hardening Checklist

This document tracks the security and compliance steps required before Safree goes
live. Code-level items are implemented in the app; infrastructure items must be
configured in the Vercel and Supabase dashboards.

## Environment Variables (Vercel Dashboard)

Set all of these as **Encrypted** environment variables — never commit them.

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | Different project per environment |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview | |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview | Server-only; never exposed to client |
| `ENCRYPTION_MASTER_KEY` | Production + Preview | `openssl rand -hex 32`. Server secret. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Production | Live keys only in production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | |
| `RESEND_API_KEY` | Production | |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Production | Web Push |
| `CRON_SECRET` | Production | Matches the bearer token Vercel Cron sends |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Production | Optional but recommended |

- **Staging/Preview deployments use a separate Supabase project** from production.
- No `NEXT_PUBLIC_*` secrets live in the codebase.

## Supabase Production Settings

- [ ] Enable **Confirm email** for all signups.
- [ ] Enable **Point-In-Time Recovery** backups.
- [ ] Enable **log export**.
- [ ] Apply all migrations in `supabase/migrations/` in order.
- [ ] Apply all RLS policies in `supabase/rls-policies/`.
- [ ] Create Storage buckets: `listings`, `experiences`, `vouchers`, `disputes`.
- [ ] Enforce **MFA (AAL2)** for admin accounts at the project policy level
      (the app provides enrollment at `/admin/security`).

## Security (implemented in code)

- **RLS audit**: `npm run rls-audit` (CI). Creates test users per role and asserts
  unauthorized reads/writes fail. Runs against a disposable/staging project.
- **API guards**: `lib/api/guard.ts` — every hardened route validates the session
  server-side (`requireUser` / `requireApiRole`), reads role from the DB (never from
  client claims), validates input with Zod (`parseBody`), and returns generic errors
  in production via `handleRoute` (no stack traces leaked).
- **Input sanitization**: `lib/sanitize.ts` — `stripHtml`, `sanitizeText`,
  `sanitizeMarkdown`, and `validateUpload` (MIME + size + filename traversal checks).
- **Stripe webhook**: signature verified with `STRIPE_WEBHOOK_SECRET`; invalid
  signatures rejected with 400.
- **Credentials at rest**: AES-256-GCM via `ENCRYPTION_MASTER_KEY`
  (`lib/crypto/secrets.ts`); the `/admin/credentials` panel requires re-auth, masks
  values, reveals for 30s, and audit-logs every reveal/edit.
- **Rate limiting** (`middleware.ts`): auth 10/min, checkout 5/min, default 60/min per IP.
- **Security headers** (`next.config.js`): CSP, HSTS, X-Frame-Options DENY,
  X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy.

## CCPA Compliance (implemented)

- Cookie consent banner (`components/legal/CookieConsent.tsx`) — analytics fire only
  after consent; preferences re-openable from the footer.
- `/privacy`, `/terms`, `/moderation-policy`, `/cancellation-policy`, `/dispute-policy`.
  ⚠️ `/privacy` and `/terms` are **AI drafts and require legal review before launch.**
- Right to Delete: `/user/settings` → Delete My Account (`POST /api/account/delete`)
  — anonymizes financial records, hard-deletes personal data, deletes the auth user.
- Right to Know: `/user/settings` → Download My Data (`GET /api/account/export`).
- Age disclaimer on product pages and the booking flow.

## Error Monitoring

- Sentry initialized server-side (`instrumentation.ts`) and client-side
  (`components/SentryInit.tsx`), both gated on DSN presence.
- PII scrubbing: cookies, auth headers, `stripe-signature`, and request bodies are
  stripped in `beforeSend`; `sendDefaultPii: false`.

## Pre-Launch Manual Steps

- [ ] Legal review of `/privacy` and `/terms`; remove the DRAFT banners.
- [ ] Whitelist Stripe webhook IPs at the edge/CDN for `/api/webhooks/stripe`.
- [ ] Verify `npm run rls-audit` passes against staging in CI.
- [ ] Seed `integration_keys` (commission rate, VAPID) via `/admin/credentials`.
- [ ] Maps need no API key — Leaflet loads CARTO/OpenStreetMap raster tiles directly.
