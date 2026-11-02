#!/usr/bin/env node
/**
 * Safree documentation generator.
 * Scans the codebase (API routes, env vars, migrations, package.json) and emits
 * the full /docs tree as Markdown. Converts to branded PDF when `md-to-pdf` is
 * installed (npm i -D md-to-pdf); otherwise writes Markdown only and notes it.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.join(ROOT, 'docs')
const C = { cyan: '\x1b[36m', yellow: '\x1b[33m', green: '\x1b[32m', red: '\x1b[31m', dim: '\x1b[2m', reset: '\x1b[0m' }
const log = (color, msg) => console.log(`${color}${msg}${C.reset}`)

function read(p) { try { return fs.readFileSync(p, 'utf8') } catch { return '' } }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }) }

const pkg = JSON.parse(read(path.join(ROOT, 'package.json')) || '{}')
const VERSION = pkg.version ?? '0.0.0'
const TODAY = new Date().toISOString().split('T')[0]

// ── Scanners ────────────────────────────────────────────────────
function walk(dir, filter, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, filter, acc)
    else if (filter(full)) acc.push(full)
  }
  return acc
}

/** Scan /app/api for route handlers → { path, methods, auth } */
function scanApiRoutes() {
  const apiDir = path.join(ROOT, 'app', 'api')
  const files = walk(apiDir, f => f.endsWith('route.ts'))
  return files.map(file => {
    const src = read(file)
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      .filter(m => new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(src))
    // Derive the URL path from the folder structure
    let rel = file.substring(apiDir.length).replace(/\\/g, '/').replace(/\/route\.ts$/, '')
    const urlPath = '/api' + rel
    const requiresAuth = /requireUser|requireApiRole|requireRole|auth\.getUser/.test(src)
    const adminOnly = /requireApiRole\(\[['"]admin/.test(src) || /role.*!==.*'admin'/.test(src)
    const usesZod = /parseBody\(|safeParse|\.parse\(/.test(src)
    const verifiesStripe = /constructEvent/.test(src)
    return { urlPath, methods, requiresAuth, adminOnly, usesZod, verifiesStripe }
  }).sort((a, b) => a.urlPath.localeCompare(b.urlPath))
}

/** Parse migrations for tables, enums, indexes. */
function scanSchema() {
  const migDir = path.join(ROOT, 'supabase', 'migrations')
  const sql = walk(migDir, f => f.endsWith('.sql')).map(read).join('\n')
  const tables = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(([\s\S]*?)\n\);/gi)]
    .map(m => ({ name: m[1], body: m[2] }))
  const enums = [...sql.matchAll(/CREATE TYPE (\w+) AS ENUM \(([^)]*)\)/gi)]
    .map(m => ({ name: m[1], values: m[2].replace(/'/g, '').split(',').map(s => s.trim()).filter(Boolean) }))
  const indexes = [...sql.matchAll(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)\s+ON\s+(\w+)([^;]*);/gi)]
    .map(m => ({ name: m[1], table: m[2], def: m[3].trim() }))
  const postgis = /GEOGRAPHY|GIST|ST_|location_coords/.test(sql)
  return { tables, enums, indexes, postgis }
}

function scanEnvVars() {
  const example = read(path.join(ROOT, '.env.local.example'))
  return example.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const name = l.split('=')[0]
      const isPublic = name.startsWith('NEXT_PUBLIC_')
      return { name, scope: isPublic ? 'client + server' : 'server only', value: '••••••• (masked)' }
    })
}

/** Folder tree (top 2 levels of key dirs). */
function folderTree() {
  const dirs = ['app', 'components', 'lib', 'hooks', 'supabase', 'scripts', 'tests', 'docs']
  const lines = ['safree/']
  for (const d of dirs) {
    const full = path.join(ROOT, d)
    if (!fs.existsSync(full)) continue
    lines.push(`├── ${d}/`)
    const subs = fs.readdirSync(full, { withFileTypes: true }).filter(e => e.isDirectory()).slice(0, 12)
    subs.forEach((s, i) => lines.push(`│   ${i === subs.length - 1 ? '└──' : '├──'} ${s.name}/`))
  }
  return lines.join('\n')
}

// ── Markdown builders ───────────────────────────────────────────
const routes = scanApiRoutes()
const schema = scanSchema()
const envVars = scanEnvVars()

const DRAFT = '> ⚠️ **DRAFT — REQUIRES LEGAL REVIEW BEFORE PUBLICATION**\n'

function depsTable() {
  const keep = ['next', 'react', '@supabase/supabase-js', 'stripe', '@stripe/stripe-js', 'leaflet', 'react-leaflet', 'react-leaflet-cluster', 'resend', 'zod', 'zustand', '@react-pdf/renderer', 'web-push', 'recharts', '@sentry/nextjs', 'vitest', '@playwright/test']
  const all = { ...pkg.dependencies, ...pkg.devDependencies }
  return ['| Package | Version |', '|---|---|', ...keep.filter(k => all[k]).map(k => `| ${k} | ${all[k]} |`)].join('\n')
}

const technical = {
  'architecture.md': `# Safree — Architecture

_Version ${VERSION} · Generated ${TODAY}_

## Overview
Safree is a Next.js 14 (App Router) marketplace and booking platform for outdoor
gear, hunting grounds, and fishing lodges. It uses Supabase (PostgreSQL + PostGIS +
Auth + Storage), Stripe Connect for payments/escrow, Leaflet + OpenStreetMap
(CARTO tiles) for map discovery, Resend for email, and Web Push for notifications.

## Tech Stack
${depsTable()}

## Folder Structure
\`\`\`
${folderTree()}
\`\`\`

## Data Flow
\`\`\`mermaid
flowchart LR
  U[User] -->|HTTPS| N[Next.js App Router]
  N -->|RLS queries| S[(Supabase Postgres)]
  N -->|PaymentIntent| ST[Stripe]
  ST -->|webhook| N
  N -->|transactional| R[Resend Email]
  N -->|Web Push| U
  CRON[Vercel Cron] -->|daily escrow release| N
\`\`\`

## Environment Variables
| Variable | Scope | Value |
|---|---|---|
${envVars.map(e => `| ${e.name} | ${e.scope} | ${e.value} |`).join('\n')}

## Deployment Architecture
\`\`\`mermaid
flowchart TB
  GH[GitHub] -->|push| V[Vercel Build]
  V --> EDGE[Edge: middleware, rate limit, CORS]
  V --> FN[Serverless Functions: /api/*]
  FN --> SUPA[(Supabase Prod)]
  FN --> STRIPE[Stripe Live]
  V --> SENTRY[Sentry]
\`\`\`
Preview/staging deployments use a separate Supabase project from production.
`,

  'database.md': `# Safree — Database

_Version ${VERSION} · Generated ${TODAY}_

## Tables (${schema.tables.length})
${schema.tables.map(t => {
  const cols = t.body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('--'))
    .map(l => l.replace(/,$/, '')).filter(l => /^\w+\s/.test(l)).slice(0, 40)
  return `### \`${t.name}\`\n\`\`\`\n${cols.join('\n')}\n\`\`\``
}).join('\n\n')}

## ENUM Types
${schema.enums.map(e => `- **${e.name}**: ${e.values.join(', ')}`).join('\n')}

## Indexes (${schema.indexes.length})
| Index | Table |
|---|---|
${schema.indexes.map(i => `| ${i.name} | ${i.table} |`).join('\n')}

## RLS
Row Level Security is enabled on all tables. Policies are defined in
\`supabase/rls-policies/\`. Highlights:
- Users read/write only their own rows (orders, bookings, cart, reviews, disputes).
- Stores/Cotos scope to rows for their own store.
- \`integration_keys\` and \`audit_log\` are service-role only (no client policies).
- Public read is limited to \`status = 'active'\` listings.
The RLS audit (\`scripts/rls-audit.mjs\`) verifies these on every deploy.

## PostGIS
${schema.postgis ? 'Enabled. `experiences.location_coords` is `GEOGRAPHY(POINT,4326)` with a GIST index. Map discovery uses `ST_MakeEnvelope` (bounds) and `ST_Distance` (nearby) via the `experiences_in_bounds` / `experiences_near_point` functions.' : 'Not detected.'}
`,

  'api.md': `# Safree — API Reference

_Version ${VERSION} · Generated ${TODAY} · ${routes.length} routes_

Auto-scanned from \`/app/api\`. Every authenticated route validates the session
server-side and reads roles from the database (never client claims).

| Route | Methods | Auth | Admin | Validation | Notes |
|---|---|---|---|---|---|
${routes.map(r => `| \`${r.urlPath}\` | ${r.methods.join(', ') || '—'} | ${r.requiresAuth ? '✅' : '—'} | ${r.adminOnly ? '✅' : '—'} | ${r.usesZod ? 'Zod' : '—'} | ${r.verifiesStripe ? 'Stripe sig verified' : ''} |`).join('\n')}

## Error Codes
- **400** — invalid/failed validation (Zod) or malformed body
- **401** — not authenticated
- **403** — authenticated but wrong role / restricted account
- **404** — resource not found
- **409** — conflict (e.g. already reviewed, out of stock, dispute open)
- **429** — rate limited
- **500** — unexpected (generic message in production; details in Sentry)
`,

  'security.md': `# Safree — Security

_Version ${VERSION} · Generated ${TODAY}_

## Security Headers (next.config.js)
- Content-Security-Policy (self + Stripe/CARTO/Supabase/Sentry allowlists)
- Strict-Transport-Security (2y, preload)
- X-Frame-Options: DENY · X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(self)

## CORS
Cross-origin \`/api/*\` requests are rejected by middleware unless the origin
matches the configured app URL.

## Rate Limiting (middleware.ts)
- \`/api/auth\`, \`/login\`, \`/register\`: 10 req/min/IP
- \`/api/checkout\`, \`/api/stripe\`: 5 req/min
- default: 60 req/min/IP

## RLS
Enabled on all tables; see database.md. Audited by \`scripts/rls-audit.mjs\`.

## Credential Storage
Integration secrets live in \`integration_keys\` encrypted with AES-256-GCM
(\`ENCRYPTION_MASTER_KEY\`). The \`/admin/credentials\` panel requires password
re-auth, masks values, reveals for 30s, and audit-logs every reveal/edit.
Plaintext is decrypted only on the server at runtime.

## Audit Log Events (sample)
order_paid, booking_confirmed, listing_approved, listing_rejected, store_verified,
user_role_changed, user_suspended, user_banned, dispute_opened,
dispute_response_submitted, dispute_resolved, funds_released, credential_revealed,
credential_updated, account_deleted, data_exported, review_manipulation_flagged.
`,

  'scripts.md': `# Safree — Scripts

_Version ${VERSION} · Generated ${TODAY}_

All scripts ship as \`.bat\` (Windows) and \`.sh\` (macOS/Linux) in \`/scripts\`.

| Script | Purpose | Usage |
|---|---|---|
| install | Verify Node/npm, install deps, scaffold .env.local | \`scripts/install.sh\` |
| dev | Env check + Supabase + Next dev in parallel, open browser | \`scripts/dev.sh\` |
| build | Typecheck → lint → unit tests → build → docs → report | \`scripts/build.sh\` |
| test | Unit+integration coverage, RLS, reports → /reports | \`scripts/test.sh\` |
| docs | Generate /docs Markdown (+ PDF if md-to-pdf installed) | \`scripts/docs.sh\` |
| package-desktop | Phase 2 placeholder (Electron) | \`scripts/package-desktop.sh\` |

Colored output: web = cyan, database = yellow, build = green, errors = red.
`,

  'stripe.md': `# Safree — Payments & Stripe

_Version ${VERSION} · Generated ${TODAY}_

## Commission
\`commission = round(amount × rate% , cents)\` — rate read from
\`integration_keys.stripe_commission_rate\` (default 5%). See \`lib/utils/pricing.ts\`.

## Product Checkout Flow
\`\`\`mermaid
sequenceDiagram
  Buyer->>API: POST /api/checkout/create-intent
  API->>Stripe: create PaymentIntent (per-cart total)
  Stripe-->>Buyer: client_secret
  Buyer->>Stripe: confirm card payment
  Stripe->>API: webhook payment_intent.succeeded
  API->>DB: orders → paid, decrement stock
  API->>Store: transfer (minus commission)
\`\`\`

## Booking Escrow Timeline
1. Booking paid → funds held on the platform (no immediate transfer).
2. Coto marks the experience **completed** → \`release_at = end_date + 7 days\`.
3. Vercel Cron (\`/api/cron/release-funds\`, daily) transfers net funds to the Coto
   if no dispute is open.
4. An open dispute halts release until an admin resolves it.

## Webhook Events Handled
- \`payment_intent.succeeded\` (orders + bookings)
- \`payment_intent.payment_failed\`
- \`account.updated\` (Connect onboarding status)

Every webhook verifies the \`stripe-signature\` header against \`STRIPE_WEBHOOK_SECRET\`.

## Stripe Connect Onboarding
Admin creates the store → store clicks "Set up payments" →
\`accounts.create({ type: 'standard' })\` → hosted onboarding via
\`accountLinks.create\` → on return, \`charges_enabled\` flips
\`stripe_onboarding_complete\`.
`,
}

const user = {
  'admin.md': `# Admin Guide

## Permissions
Full platform control: users, listings, verification, featured content, credentials,
shipping rates, disputes, audit log. Admin routes require 2FA (enroll at \`/admin/security\`).

## Common Tasks
### Onboard a pilot Store/Coto
1. Create the store account and assign the \`store\` role (\`/admin/users\`).
2. Have the owner complete Stripe Connect at \`/store/settings/payments\`.
3. Approve verification documents at \`/admin/verification\`.

### Resolve a dispute
1. Open \`/admin/disputes\` → select a dispute.
2. Review buyer claim + seller response + evidence.
3. Choose Full / Partial / No refund → Stripe action fires automatically.

### Update credentials
\`/admin/credentials\` → re-authenticate → reveal/edit → every change is audit-logged.

> 📷 _Screenshot placeholder: Admin dashboard_

## FAQ
- **Can I undo an approval?** Use \`/admin/listings\` → override/remove.
- **Where are payouts?** Stripe dashboard; balances shown in store payment settings.
`,

  'moderator.md': `# Moderator Guide

## Permissions
Review and approve/reject pending listings; handle flagged content; promote users
to the store role and inspect every store. Moderators **cannot** access financials,
credentials, user deletion, or finalize disputes.

## Tasks
### Review the queue
\`/moderator/queue\` → Products / Experiences tabs. Each card shows images, store
info, and automated checks (price range, prohibited keywords, image count).
- **Approve** → goes live, store notified.
- **Reject** → choose a category + write a ≥20-char reason; the store is emailed.

### Flagged content
\`/moderator/flagged\` → Dismiss (keep) or Remove (escalates to Admin).

### Stores
\`/moderator/stores\` lists every store with its type (Gear Store / Coto), owner,
location and verification status.
- **Promote a user to Store** — enter the account's email to grant the \`store\`
  role (audit-logged as \`user_promoted_to_store\`).
- **View a store** — click a store name to open its full profile (owner, contact,
  location, ratings, Stripe status) plus a complete table of its products and
  experiences, each with status, price and a link to its public page.

> 📷 _Screenshot placeholder: Moderation card_

## FAQ
- **What if an automated check warns?** It's advisory — use judgment.
`,

  'store-coto.md': `# Store & Coto (Provider) Guide

## Overview
Stores sell gear; Cotos list hunting/fishing experiences. Both need Stripe Connect
onboarding before publishing.

## Tasks
### Create your store
After receiving the \`store\` role, open \`/store\` and click **Create My Store** to
set the name, type (Gear Store or Coto/Ranch), description and location. Cotos can
later edit their full profile, images and location at \`/store/settings/coto\`.

The dashboard adapts to your store type: Gear Stores get Product/Listings/Orders
shortcuts; Cotos get Configure Coto / New Experience / Bookings shortcuts.

### Set up payments
\`/store/settings/payments\` → "Set up payments" → complete Stripe onboarding.

### Create a product listing
\`/store/listings/new\` → photos, price, stock, category → submit (status: pending).

### Create an experience
\`/store/experiences/new\` → photos (min 3), type, species, price/day, map pin,
amenities, cancellation policy → submit for review.

### Manage availability
\`/store/availability/[id]\` → set slots per date, block dates, bulk actions.

### Orders & bookings
\`/store/orders\` (mark shipped/delivered) · \`/store/bookings\` (mark completed →
starts the 7-day escrow release clock).

> 📷 _Screenshot placeholder: Experience create form_

## FAQ
- **When am I paid?** Orders: after transfer on payment. Bookings: 7 days after you
  mark the experience completed, absent a dispute.
`,

  'user.md': `# User & Guest Guide

## Guests
Anyone can browse the marketplace (\`/products\`), discover experiences on the map
(\`/map\`), and add items to a cart. Sign-in is required to check out or book; the
guest cart merges into your account on login.

## Registered Users
### Buy gear
Add to cart → \`/checkout\` → address → shipping → pay (card / Apple Pay / Google Pay)
→ confirmation + email.

### Book an experience
Open an experience → pick dates & party size → add-ons → review → pay → download
your PDF voucher.

### After your trip
Leave a review and, if needed, open a dispute within 7 days of delivery/completion.

### Privacy
\`/user/settings\` → Download My Data (CCPA) or Delete My Account.

> 📷 _Screenshot placeholder: Checkout flow_

## FAQ
- **Refunds?** Governed by the provider's cancellation tier — shown before you pay.
`,
}

const legal = {
  'terms-of-service.md': `# Terms of Service\n\n${DRAFT}\n_Generated ${TODAY}_\n\nSee the live page at \`/terms\`. Covers platform description, 18+ eligibility for
hunting purchases, store/Coto responsibilities, prohibited content (no firearms),
commission & escrow terms, dispute resolution, limitation of liability, and Texas
governing law.`,

  'privacy-policy.md': `# Privacy Policy\n\n${DRAFT}\n_Generated ${TODAY}_\n\nSee the live page at \`/privacy\`. Covers data collected, usage, third parties
(Stripe, Resend, Supabase, Vercel; map tiles served by CARTO/OpenStreetMap with no
personal data shared), and CCPA rights: Know, Delete,
Opt-out of Sale (**Safree does not sell personal data**), and Non-Discrimination.
Contact: legal@safree.com.`,

  'moderation-policy.md': `# Community Standards\n\n_Generated ${TODAY}_\n\nEthical hunting aligned with SCI/NRA fair-chase principles. Zero tolerance for
discrimination. Prohibited: CITES Appendix I species, firearms/ammunition, hate
speech, fraud. Enforcement escalates from content removal → warning → suspension →
permanent ban (and referral to authorities for illegal activity).`,

  'cancellation-policy.md': `# Cancellation Policy\n\n_Generated ${TODAY}_\n\n**Flexible** — full refund up to 24h before. **Moderate** — full up to 7 days, 50%
within 7 days. **Strict** — 50% up to 30 days, none after. The Safree service fee is
non-refundable. Example: a $220 booking with a $20 fee under Moderate, cancelled 3
days out, refunds $100 (50% of the $200 refundable portion).`,

  'disputes-policy.md': `# Disputes Policy\n\n_Generated ${TODAY}_\n\nOpen within 7 days of delivery/completion → provider responds within 3 business days
→ Safree resolves (full/partial/no refund). Experience funds stay in escrow while a
dispute is open. Decisions are emailed and shown in-app. Support: support@safree.com.`,
}

// ── Write files ─────────────────────────────────────────────────
const BRAND_CSS = `
body { background:#fff; font-family: Inter, Arial, sans-serif; color:#1a1a1a; line-height:1.6; padding:2rem; }
h1, h2 { color:#822626; }
h1 { border-bottom:3px solid #822626; padding-bottom:.3rem; }
code, pre { background:#f4f4f4; font-family: ui-monospace, monospace; border-radius:4px; }
pre { padding:1rem; overflow:auto; }
table { border-collapse:collapse; width:100%; } th,td { border:1px solid #ddd; padding:.4rem .6rem; text-align:left; }
th { background:#f4f0e6; }
`

const PDF_OPTIONS = {
  body_class: 'safree-doc',
  css: BRAND_CSS,
  pdf_options: {
    format: 'A4',
    margin: '20mm 16mm',
    headerTemplate: `<div style="font-size:8px;color:#822626;width:100%;text-align:center;font-family:Inter,sans-serif;">SAFREE</div>`,
    footerTemplate: `<div style="font-size:8px;color:#888;width:100%;text-align:center;font-family:Inter,sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated: ${TODAY} | safree.com</div>`,
    displayHeaderFooter: true,
  },
}

const groups = [
  ['technical', technical],
  ['user', user],
  ['legal', legal],
]

let created = 0
const mdFiles = []
for (const [folder, files] of groups) {
  const dir = path.join(DOCS, folder)
  ensureDir(dir)
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(dir, name)
    fs.writeFileSync(fp, content.trimStart() + '\n')
    mdFiles.push(fp)
    created++
    log(C.green, `  ✓ docs/${folder}/${name}`)
  }
}

// ── PDF conversion (optional) ───────────────────────────────────
async function toPdf() {
  let mdToPdf
  try { ({ mdToPdf } = await import('md-to-pdf')) }
  catch {
    log(C.yellow, '\n⚠ md-to-pdf not installed — Markdown generated, PDF skipped.')
    log(C.dim, '  Enable PDFs with: npm i -D md-to-pdf')
    return 0
  }
  let pdfs = 0
  for (const md of mdFiles) {
    try {
      const out = md.replace(/\.md$/, '.pdf')
      const pdf = await mdToPdf({ path: md }, PDF_OPTIONS)
      if (pdf?.content) { fs.writeFileSync(out, pdf.content); pdfs++; log(C.green, `  ✓ ${path.relative(ROOT, out)}`) }
    } catch (e) { log(C.red, `  ✗ PDF failed for ${path.basename(md)}: ${e.message}`) }
  }
  return pdfs
}

log(C.cyan, `\n📄 Safree docs generator — v${VERSION}`)
log(C.dim, `   Scanned ${routes.length} API routes, ${schema.tables.length} tables, ${envVars.length} env vars\n`)

const pdfs = await toPdf()
log(C.green, `\nDocumentation generated: ${created} Markdown file(s)${pdfs ? ` + ${pdfs} PDF(s)` : ''} created.`)
