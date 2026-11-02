# Store & Coto (Provider) Guide

## Overview
Stores sell gear; Cotos list hunting/fishing experiences. Both need Stripe Connect
onboarding before publishing.

## Tasks
### Create your store
After receiving the `store` role, open `/store` and click **Create My Store** to
set the name, type (Gear Store or Coto/Ranch), description and location. Cotos can
later edit their full profile, images and location at `/store/settings/coto`.

The dashboard adapts to your store type: Gear Stores get Product/Listings/Orders
shortcuts; Cotos get Configure Coto / New Experience / Bookings shortcuts.

### Set up payments
`/store/settings/payments` → "Set up payments" → complete Stripe onboarding.

### Create a product listing
`/store/listings/new` → photos, price, stock, category → submit (status: pending).

### Create an experience
`/store/experiences/new` → photos (min 3), type, species, price/day, map pin,
amenities, cancellation policy → submit for review.

### Manage availability
`/store/availability/[id]` → set slots per date, block dates, bulk actions.

### Orders & bookings
`/store/orders` (mark shipped/delivered) · `/store/bookings` (mark completed →
starts the 7-day escrow release clock).

> 📷 _Screenshot placeholder: Experience create form_

## FAQ
- **When am I paid?** Orders: after transfer on payment. Bookings: 7 days after you
  mark the experience completed, absent a dispute.

