# Admin Guide

## Permissions
Full platform control: users, listings, verification, featured content, credentials,
shipping rates, disputes, audit log. Admin routes require 2FA (enroll at `/admin/security`).

## Common Tasks
### Onboard a pilot Store/Coto
1. Create the store account and assign the `store` role (`/admin/users`).
2. Have the owner complete Stripe Connect at `/store/settings/payments`.
3. Approve verification documents at `/admin/verification`.

### Resolve a dispute
1. Open `/admin/disputes` → select a dispute.
2. Review buyer claim + seller response + evidence.
3. Choose Full / Partial / No refund → Stripe action fires automatically.

### Update credentials
`/admin/credentials` → re-authenticate → reveal/edit → every change is audit-logged.

> 📷 _Screenshot placeholder: Admin dashboard_

## FAQ
- **Can I undo an approval?** Use `/admin/listings` → override/remove.
- **Where are payouts?** Stripe dashboard; balances shown in store payment settings.

