# Safree — API Reference

_Version 0.1.0 · Generated 2026-05-30 · 43 routes_

Auto-scanned from `/app/api`. Every authenticated route validates the session
server-side and reads roles from the database (never client claims).

| Route | Methods | Auth | Admin | Validation | Notes |
|---|---|---|---|---|---|
| `/api/account/delete` | POST | ✅ | — | Zod |  |
| `/api/account/export` | GET | ✅ | — | — |  |
| `/api/admin/credentials` | GET, POST | ✅ | ✅ | — |  |
| `/api/admin/featured` | POST, DELETE | ✅ | ✅ | — |  |
| `/api/admin/hero-slides` | POST, PATCH, DELETE | ✅ | ✅ | — |  |
| `/api/admin/listings/[type]/[id]` | PATCH | ✅ | ✅ | — |  |
| `/api/admin/shipping` | POST, PATCH, DELETE | ✅ | ✅ | — |  |
| `/api/admin/users/[id]` | PATCH | ✅ | ✅ | — |  |
| `/api/admin/verification/[storeId]` | PATCH | ✅ | ✅ | — |  |
| `/api/auth/callback` | GET | — | — | — |  |
| `/api/bookings/[id]/cancel` | POST | ✅ | — | — |  |
| `/api/bookings/[id]/complete` | POST | ✅ | — | — |  |
| `/api/bookings/[id]/voucher` | GET | ✅ | — | — |  |
| `/api/bookings/create-intent` | POST | ✅ | — | — |  |
| `/api/cart` | GET, POST, DELETE | ✅ | — | — |  |
| `/api/checkout/create-intent` | POST | ✅ | — | — |  |
| `/api/consent` | POST | ✅ | — | Zod |  |
| `/api/content/flag` | POST | ✅ | — | Zod |  |
| `/api/cron/release-funds` | GET | — | — | — |  |
| `/api/disputes` | POST | ✅ | — | — |  |
| `/api/disputes/[id]/resolve` | POST | ✅ | — | — |  |
| `/api/disputes/[id]/respond` | POST | ✅ | — | — |  |
| `/api/experiences` | GET | — | — | — |  |
| `/api/experiences/[slug]` | GET | — | — | — |  |
| `/api/experiences/[slug]/availability` | GET, POST | ✅ | — | — |  |
| `/api/moderation/[type]/[id]/approve` | POST | ✅ | — | — |  |
| `/api/moderation/[type]/[id]/reject` | POST | ✅ | — | — |  |
| `/api/moderation/flags/[id]` | PATCH | ✅ | — | — |  |
| `/api/moderator/promote-store` | POST | ✅ | — | — |  |
| `/api/orders/[id]/deliver` | PATCH | ✅ | — | — |  |
| `/api/orders/[id]/ship` | PATCH | ✅ | — | — |  |
| `/api/products/[id]/views` | POST | — | — | — |  |
| `/api/products/search` | GET | — | — | — |  |
| `/api/push/subscribe` | POST, DELETE | ✅ | — | — |  |
| `/api/reviews` | POST | ✅ | — | Zod |  |
| `/api/saved` | GET, POST | ✅ | — | — |  |
| `/api/species` | GET, POST | ✅ | — | — |  |
| `/api/store/experiences` | GET, POST | ✅ | — | — |  |
| `/api/store/experiences/[id]` | PUT, DELETE | ✅ | — | — |  |
| `/api/store/onboarding` | POST | ✅ | — | — |  |
| `/api/stores` | POST | — | — | — |  |
| `/api/stores/[id]` | PATCH | — | ✅ | — |  |
| `/api/webhooks/stripe` | POST | — | — | — | Stripe sig verified |

## Error Codes
- **400** — invalid/failed validation (Zod) or malformed body
- **401** — not authenticated
- **403** — authenticated but wrong role / restricted account
- **404** — resource not found
- **409** — conflict (e.g. already reviewed, out of stock, dispute open)
- **429** — rate limited
- **500** — unexpected (generic message in production; details in Sentry)

