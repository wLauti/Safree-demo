# Safree — Security

_Version 0.1.0 · Generated 2026-05-30_

## Security Headers (next.config.js)
- Content-Security-Policy (self + Stripe/CARTO/Supabase/Sentry allowlists)
- Strict-Transport-Security (2y, preload)
- X-Frame-Options: DENY · X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(self)

## CORS
Cross-origin `/api/*` requests are rejected by middleware unless the origin
matches the configured app URL.

## Rate Limiting (middleware.ts)
- `/api/auth`, `/login`, `/register`: 10 req/min/IP
- `/api/checkout`, `/api/stripe`: 5 req/min
- default: 60 req/min/IP

## RLS
Enabled on all tables; see database.md. Audited by `scripts/rls-audit.mjs`.

## Credential Storage
Integration secrets live in `integration_keys` encrypted with AES-256-GCM
(`ENCRYPTION_MASTER_KEY`). The `/admin/credentials` panel requires password
re-auth, masks values, reveals for 30s, and audit-logs every reveal/edit.
Plaintext is decrypted only on the server at runtime.

## Audit Log Events (sample)
order_paid, booking_confirmed, listing_approved, listing_rejected, store_verified,
user_role_changed, user_suspended, user_banned, dispute_opened,
dispute_response_submitted, dispute_resolved, funds_released, credential_revealed,
credential_updated, account_deleted, data_exported, review_manipulation_flagged.

