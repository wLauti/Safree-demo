# Testing & QA

## Test layers

| Layer | Tool | Location | Runs in CI |
|---|---|---|---|
| Unit | Vitest | `tests/unit/` | Always |
| Integration (business logic) | Vitest | `tests/integration/` | Always |
| RLS policy audit | Node + Supabase | `scripts/rls-audit.mjs` | Against staging |
| E2E journeys | Playwright | `tests/e2e/` | Against staging |

## Commands

```bash
npm test                 # unit + integration
npm run test:coverage    # with coverage report (./coverage)
npm run test:watch       # watch mode
npm run rls-audit        # RLS policy audit (needs Supabase staging env vars)
npm run test:e2e         # Playwright journeys (needs E2E_BASE_URL)

# Everything (auto-skips RLS/E2E when env vars are absent):
bash scripts/test.sh     # macOS/Linux
scripts\test.bat         # Windows
```

## Coverage

Unit coverage is measured against the **deterministic, pure** surface of `/lib`
(formatters, pricing, cancellation, ref, sanitize, crypto, schemas, consent).
Current: **97.8% lines / 100% functions** — target is 80%.

Database/Stripe/email/push-coupled modules (`lib/supabase`, `lib/stripe`,
`lib/email`, `lib/push`, `lib/notifications`, `lib/audit`, `lib/api/guard`,
`lib/moderation/checks`) require a live environment and are validated by the
**RLS audit** and **E2E** suites rather than unit tests — including them in unit
coverage would misreport intentionally-untested-at-this-layer code.

## RLS audit (`scripts/rls-audit.mjs`)

Creates an ephemeral test user per role and asserts unauthorized access fails:
- `integration_keys` / `audit_log` unreadable by non-service clients
- cross-user reads of carts/orders/profiles blocked
- self-escalation to `admin` blocked
- forged reviews (spoofed `user_id`) blocked
- anonymous read of orders blocked

> Run against a **staging/disposable** Supabase project — it creates and deletes users.

## E2E journeys (`tests/e2e/`)

Five critical journeys, run against staging with Stripe **test-mode** cards
(`4242 4242 4242 4242`). Set `E2E_BASE_URL` and the `E2E_*` credential env vars
(see `tests/e2e/helpers.ts`). Browsers/devices: Chromium, Firefox, WebKit,
iPhone 14, Pixel 7.

1. Product purchase (guest → cart → login → checkout → confirmation)
2. Experience booking (map → dates → pay → voucher)
3. Dispute resolution (open → admin resolves with refund)
4. Store onboarding & publishing (payments prompt → moderator approves → live)
5. Admin credential update (re-auth → edit a credential → audit entry)

## Performance notes

- `/map` lazy-loads Leaflet via `next/dynamic({ ssr: false })`
  (`MapExplorerLoader`) — Leaflet renders raster tiles in the DOM (no WebGL).
- Database indexes for all hot paths are in `supabase/migrations/013_sprint9_indexes.sql`
  (incl. a GIST index on `experiences.location_coords` for map bounds/distance).
- Images use `next/image` with explicit `sizes`; listing queries use joined
  `.select()` to avoid N+1.

## Accessibility

- Keyboard-navigable interactive elements; modals trap focus.
- Descriptive `alt` text on images; form inputs have associated labels.
- Cream-on-dark palette meets WCAG AA contrast (≥ 4.5:1).
- Run an axe/Lighthouse a11y pass on homepage, `/products`, `/checkout` before launch.
