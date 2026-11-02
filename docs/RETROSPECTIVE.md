# Safree — Build Retrospective (Sprints 1–10)

## What we shipped
A feature-complete, hardened, tested outdoor marketplace + experience-booking
platform for the Texas soft launch.

| Sprint | Focus | Outcome |
|---|---|---|
| 1 | Auth, RLS, design system, middleware | ✅ |
| 2 | Marketplace listings, cart, search | ✅ |
| 3 | Stripe Connect, checkout, orders | ✅ |
| 4 | Map discovery, experiences, availability | ✅ |
| 5 | Booking flow, escrow, PDF vouchers, cron | ✅ |
| 6 | Moderator queue, Admin panel, credentials | ✅ |
| 7 | Reviews, disputes, notifications, web push | ✅ |
| 8 | Security hardening, CCPA, legal pages, Sentry | ✅ |
| 9 | Unit/integration/E2E tests, indexes, perf | ✅ (99 tests, 97.8% lib coverage) |
| 10 | Automation scripts, auto-docs, launch prep | ✅ |

## What worked
- **RLS-first data model** — security baked in from Sprint 1 meant later features
  inherited correct access control rather than bolting it on.
- **Server-side guards + Zod** (`lib/api/guard.ts`) gave every route a consistent
  auth/validation/error contract.
- **Escrow via platform-held funds + daily cron** kept payout logic simple and
  auditable; the dispute system halts release cleanly.
- **Auto-generated docs** stay in sync with the codebase (routes/tables/env scanned
  live), so documentation won't rot.
- **Migrated maps to Leaflet + OpenStreetMap** (from Mapbox/MapLibre) — removes the
  WebGL dependency and the need for any map API key, and is code-split off `/map`.

## What to change next time
- Introduce typed Supabase clients (generate from schema) to drop the `as any` casts.
- Move product creation behind a server route (like experiences) so moderation flags
  are computed at submit time, not lazily in the queue.
- Add contract tests that hit real API routes against a seeded test DB (current
  integration tests assert business logic in isolation).
- Wire the `welcome_email` template into the post-signup path.

## Known follow-ups before/at launch
- ⚠️ Legal review of `/terms` and `/privacy`; remove DRAFT banners.
- ⚙️ Lighthouse runs + live cross-browser/device pass (E2E harness ready).
- ⚙️ AAL2 admin enforcement + Stripe webhook IP allowlist at the edge.
- 📷 Replace screenshot placeholders in `/docs/user/*` once UI is final.
- PDF docs require `npm i -D md-to-pdf` (puppeteer) in the docs environment.

## Phase 2 priorities (confirmed)
1. Tax calculation at checkout.
2. Carrier shipping APIs (replace flat rates) + live tracking.
3. Electron desktop packaging (`scripts/package-desktop` placeholder exists).
4. Sort-by-views + richer search/ranking.
5. Expansion beyond Texas; localized compliance.
6. Booking calendar carrier/iCal sync for Cotos.
