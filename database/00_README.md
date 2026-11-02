# Safree — Database export (self-hosted PostgreSQL)

This folder is a **complete, portable export of the Safree database** taken from the
live Supabase project (`lccdlpezojfghcyxsyhy`, PostgreSQL 17). It is meant to be
handed to a developer/DBA so they can stand the database up on **their own
PostgreSQL server**, with no dependency on Supabase.

Everything here is plain SQL and loads on **any standard PostgreSQL 14+** server.
The only requirements are three open-source extensions, listed below.

---

## Files & load order

Run them **in this exact order** with `psql` (or any client):

| # | File | What it does |
|---|------|--------------|
| 1 | `01_schema.sql` | Extensions, `auth.users` stub, enums, 24 tables, constraints, indexes, functions, triggers |
| 2 | `02_auth_users.sql` | 5 user identities + bcrypt password hashes (**sensitive**) |
| 3 | `03_data.sql` | All application data (profiles, stores, catalog, etc.) |
| 4 | `04_rls_policies.sql` | **Optional** row-level security (Supabase-style — see below) |

```bash
# Create an empty database first, then:
createdb safree
psql "postgresql://USER:PASS@HOST:5432/safree" -v ON_ERROR_STOP=1 -f 01_schema.sql
psql "postgresql://USER:PASS@HOST:5432/safree" -v ON_ERROR_STOP=1 -f 02_auth_users.sql
psql "postgresql://USER:PASS@HOST:5432/safree" -v ON_ERROR_STOP=1 -f 03_data.sql
# optional:
psql "postgresql://USER:PASS@HOST:5432/safree" -v ON_ERROR_STOP=1 -f 04_rls_policies.sql
```

### Requirements (installed automatically by `01_schema.sql`)
- `uuid-ossp` — `uuid_generate_v4()` default keys
- `pgcrypto` — `gen_random_uuid()` default keys
- `postgis` — `geography(Point,4326)` columns + map-search functions
  (on Debian/Ubuntu: `apt install postgresql-16-postgis-3`)

> This export was **validated** by loading the full schema and the complex data
> types (PostGIS geography, UUID arrays, JSONB) into a throwaway schema on a real
> PostgreSQL 17 server — all 24 tables build and the rows insert cleanly.

### Row counts in this export
profiles 5 · auth users 5 · stores 2 · categories 14 · species 27 · products 1 ·
experiences 1 · product_specs 1 · shipping_rates 2 · prohibited_keywords 18 ·
integration_keys 14 · audit_log 2 · notifications 1. All other tables are empty.

---

## Two things that are NOT "just the database" — your developer must handle them

### 1. Authentication (the biggest item)
On Supabase, logins were handled by **Supabase Auth (GoTrue)** and **Google OAuth**.
Off Supabase there is no GoTrue. We exported the identities into a minimal
`auth.users` table (file 02) so that:
- `public.profiles.id` → `auth.users.id` still has referential integrity, and
- you keep every user's **email + bcrypt password hash** (`$2a$…`), which standard
  bcrypt libraries verify directly — so email/password logins can keep working.
- Users with `encrypted_password = NULL` only ever used **Google sign-in** and have
  no password until one is set.

Your developer picks one of:
- **(A)** Keep `auth.users` as the identity table and build auth on top of it
  (verify bcrypt on login, issue your own sessions/JWT). Optional helper triggers
  (`handle_new_user`, `handle_email_confirmed`) are included, commented out, in
  file 01.
- **(B)** Move identities into their own `users` table, then drop the FK
  (`ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;`) and point it at
  the new table.

### 2. File storage (images) — already bundled
The product/store/experience images (and the two Google profile avatars) have been
**downloaded into the project** at `public/media/...`, and every URL in
`03_data.sql` now points at local app paths (`/media/...`) instead of Supabase
Storage. So out of the box the images are self-contained — no Supabase Storage,
no re-hosting needed for the existing data.

Note for the future: when users upload NEW images, your backend still needs
somewhere to put them. `lib/supabase/storage.ts` currently uploads to Supabase
Storage — point it at your own object store (S3/MinIO or local disk) and have new
uploads land under `public/media/` (or your bucket) the same way. The buckets the
app uses are `products`, `stores`, `experiences`, plus `vouchers` / `disputes` for
generated files.

### About RLS (`04_rls_policies.sql`)
The Next.js app does **not** rely on row-level security — every API route authorizes
server-side (`lib/api/guard.ts`). RLS was a Supabase-specific second layer that uses
`auth.uid()` and the `anon/authenticated/service_role` roles. The file includes a
compatibility shim so it can be applied if you keep that model, but you can safely
**skip it** if you authorize in the application layer. See the header of that file.

---

## Everything in the project still wired to an external service

The user asked for a full inventory. Beyond the database itself, the codebase talks
to these external services. To make "nothing connected to another service", each
must be removed, self-hosted, or swapped:

| Service | Used for | Where | Self-host / replace with |
|---|---|---|---|
| **Supabase — Postgres** | the database | everywhere | ✅ this export → your own PostgreSQL |
| **Supabase — Auth + Google OAuth** | login / signup | `lib/supabase`, `middleware.ts`, `/login` | your own auth (see above) |
| **Supabase — Storage** | images & files | `lib/supabase/storage.ts` | ✅ existing images now bundled in `public/media/`; wire new uploads to S3/MinIO/local disk |
| **Stripe** (+ Stripe Connect) | payments, payouts, escrow | `lib/stripe/*`, `/api/checkout`, `/api/webhooks/stripe`, cron | a payment provider; or a manual/offline flow |
| **Resend** | transactional email | `lib/email/resend.ts` | your SMTP server / another email API |
| **Web Push (VAPID)** | browser push notifications | `lib/push/web-push.ts` | self-hostable, but delivery still goes via browser vendors' push endpoints (FCM/Mozilla/Apple) |
| **Sentry** | error monitoring (optional) | `instrumentation.ts`, `components/SentryInit.tsx` | self-hosted GlitchTip/Sentry, or remove |
| **OpenStreetMap + CARTO tiles** | map basemap | `lib/utils/mapStyle.ts` | self-hosted tile server, or keep (free) |
| **Google Fonts** | Oswald / Inter fonts | `styles/fonts.css` | ✅ now self-hosted in `public/fonts/` (woff2) |
| **Unsplash** | decorative background images | `lib/utils/images.ts` | ✅ now self-hosted in `public/media/backgrounds/` |
| **Google Maps link** | "get directions" link | `app/(public)/experiences/[slug]/page.tsx` | any map link, or remove |
| **YouTube** | product/experience promo videos (user-supplied `video_url`) | data | optional; self-host or embed differently |
| **Vercel** | hosting + the daily escrow cron | deployment, `vercel.json` | any Node host + a system cron hitting `/api/cron/release-funds` |

### Where the real secrets live
API keys are **not** in the database (the `integration_keys` table is effectively
empty in this export). They live in environment variables — see `.env.local` and
`.env.local.example` at the project root (Supabase keys, Stripe **test** keys,
Resend key, `ENCRYPTION_MASTER_KEY`). Rotate/replace these when moving providers.

---

_Generated 2026-11-01 from the live Supabase project via SQL introspection._
