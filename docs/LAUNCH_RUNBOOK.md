# Soft Launch Runbook — Texas

Sprint 10 delivers the code, scripts, and docs. The steps below are the
**infrastructure/operations** actions performed in the Vercel, Supabase, and
Stripe dashboards to go live. Check each box during launch.

## 1. Supabase Production Project
- [ ] Create a **new** project, separate from staging.
- [ ] Run migrations in order: `supabase/migrations/001 … 013`.
- [ ] Apply RLS policies: every file in `supabase/rls-policies/`.
- [ ] Create Storage buckets: `listings`, `experiences`, `vouchers`, `disputes`.
- [ ] Seed reference data (Admin, pre-launch):
  - Categories and species (`002`/`008` seeds run with migrations).
  - Shipping rates (seeded by `007`; adjust in `/admin/shipping`).
  - Commission rate + VAPID keys via `/admin/credentials` (maps need no key).
- [ ] Enable **Point-In-Time Recovery** backups.
- [ ] Enable log export → Vercel log drain.
- [ ] (Optional) Database webhooks for audit-log events.
- [ ] Enable "Confirm email" for signups; enforce **MFA (AAL2)** for admins.

## 2. Vercel Production Deployment
- [ ] Connect the GitHub repo; production branch = `main`.
- [ ] Set all production env vars (see `docs/PRODUCTION.md` table) — no `.env` on server.
- [ ] Custom domain: **safree.com** (+ www redirect, SSL auto).
- [ ] Enable **Vercel Analytics** and **Speed Insights**.
- [ ] Confirm the Cron Job from `vercel.json` is registered:
  `/api/cron/release-funds` daily at **02:00 UTC** (set `CRON_SECRET`).
- [ ] Verify build uses Node 20.

## 3. Stripe (Live Mode)
- [ ] Switch keys to **live** (`STRIPE_SECRET_KEY`, publishable, webhook secret).
- [ ] Register the production webhook endpoint → `/api/webhooks/stripe`
      for `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`.
- [ ] Test Connect onboarding with one real pilot account.
- [ ] Confirm commission rate in `integration_keys`.

## 4. Monitoring
- [ ] Sentry: set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`; confirm events arrive.
- [ ] Vercel Analytics + Speed Insights live.
- [ ] Supabase logs flowing to the log drain.

## 5. Soft Launch Scope (Texas)
- Platform is nationally accessible but **marketed in Texas only** at first.
- [ ] Admin manually onboards the first **3–5 pilot Stores/Cotos**.
- [ ] Moderator manually reviews **all first 50 listings** before approving.
- [ ] Stand up a direct feedback channel (email/WhatsApp) for pilot partners.

## 6. Post-Launch Daily Checks (first 2 weeks)
- [ ] Sentry: triage new errors.
- [ ] Stripe: payments + transfers processing correctly; no failed payouts.
- [ ] Supabase: slow-query log / performance.
- [ ] Vercel: function timeouts / cron execution log.
- [ ] Moderation queue: backlog size trending down.

## Smoke Test (run once after go-live)
1. Register a real user → receive welcome/verification email.
2. Buy a low-cost product with a real card → order paid → confirmation email.
3. Book a test experience → voucher PDF downloads.
4. Confirm the cron ran (check `/admin/audit-log` for `funds_released` after a completed booking's window).
5. Open `/map` → Leaflet loads CARTO/OpenStreetMap tiles and cotos appear as markers (no API key required).
