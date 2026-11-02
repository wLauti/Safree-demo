-- Sprint 8: CCPA compliance — account deletion (anonymization) + cookie consent

-- Cookie consent preferences stored per logged-in user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cookie_consent JSONB;

-- ── Make user references nullable so financial/store records survive anonymization ──
-- Orders/bookings are kept (anonymized) for financial records after account deletion.
ALTER TABLE orders   ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;

-- Reviews are kept (body retained for the store's record) but reviewer is detached.
ALTER TABLE reviews  ALTER COLUMN user_id DROP NOT NULL;

-- Disputes opened_by becomes nullable too (record retained for audit)
ALTER TABLE disputes ALTER COLUMN opened_by_user_id DROP NOT NULL;

-- Note: the actual deletion flow runs server-side with the service role:
--   1. orders/bookings/reviews/disputes: set user_id (opened_by) = NULL  (anonymize)
--   2. cart_items / notifications / shipping_addresses: hard delete
--   3. profiles: hard delete
--   4. auth.users: delete via admin API
-- These columns must be nullable for step 1 to succeed before the profile row is removed.
