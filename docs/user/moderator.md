# Moderator Guide

## Permissions
Review and approve/reject pending listings; handle flagged content; promote users
to the store role and inspect every store. Moderators **cannot** access financials,
credentials, user deletion, or finalize disputes.

## Tasks
### Review the queue
`/moderator/queue` → Products / Experiences tabs. Each card shows images, store
info, and automated checks (price range, prohibited keywords, image count).
- **Approve** → goes live, store notified.
- **Reject** → choose a category + write a ≥20-char reason; the store is emailed.

### Flagged content
`/moderator/flagged` → Dismiss (keep) or Remove (escalates to Admin).

### Stores
`/moderator/stores` lists every store with its type (Gear Store / Coto), owner,
location and verification status.
- **Promote a user to Store** — enter the account's email to grant the `store`
  role (audit-logged as `user_promoted_to_store`).
- **View a store** — click a store name to open its full profile (owner, contact,
  location, ratings, Stripe status) plus a complete table of its products and
  experiences, each with status, price and a link to its public page.

> 📷 _Screenshot placeholder: Moderation card_

## FAQ
- **What if an automated check warns?** It's advisory — use judgment.

