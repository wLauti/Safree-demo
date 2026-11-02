-- Sprint 9: Performance — indexes on hot query paths.
-- All created CONCURRENTLY-safe via IF NOT EXISTS (run outside a txn block in prod
-- if you switch to CONCURRENTLY).

-- Products
CREATE INDEX IF NOT EXISTS idx_products_status      ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_store        ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_products_category     ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured     ON products (featured) WHERE featured = true;

-- Experiences
CREATE INDEX IF NOT EXISTS idx_experiences_status    ON experiences (status);
CREATE INDEX IF NOT EXISTS idx_experiences_store     ON experiences (store_id);
CREATE INDEX IF NOT EXISTS idx_experiences_type      ON experiences (type);
CREATE INDEX IF NOT EXISTS idx_experiences_state     ON experiences (location_state);
-- GIST index for PostGIS bounds / distance queries
CREATE INDEX IF NOT EXISTS idx_experiences_coords    ON experiences USING GIST (location_coords);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user           ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store          ON orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_pi             ON orders (stripe_payment_intent_id);

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user         ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_experience   ON bookings (experience_id);
CREATE INDEX IF NOT EXISTS idx_bookings_store        ON bookings (store_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings (status);
-- Cron escrow-release scan: status='completed' AND funds_released=false AND release_at<=now()
CREATE INDEX IF NOT EXISTS idx_bookings_release      ON bookings (release_at)
  WHERE funds_released = false;

-- Availability lookups by experience + date range
CREATE INDEX IF NOT EXISTS idx_availability_exp_date ON availability (experience_id, date);

-- Disputes
CREATE INDEX IF NOT EXISTS idx_disputes_status       ON disputes (status);
CREATE INDEX IF NOT EXISTS idx_disputes_store        ON disputes (store_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by    ON disputes (opened_by_user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_ref          ON disputes (ref_type, ref_id);

-- Reviews (rating aggregation + listing display)
CREATE INDEX IF NOT EXISTS idx_reviews_store         ON reviews (store_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_reviews_ref           ON reviews (ref_type, ref_id);

-- Notifications (bell unread count + list)
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications (user_id) WHERE is_read = false;

-- Cart
CREATE INDEX IF NOT EXISTS idx_cart_user             ON cart_items (user_id);

-- Content flags (moderator queue)
CREATE INDEX IF NOT EXISTS idx_content_flags_status  ON content_flags (status) WHERE status = 'open';

-- Audit log (admin filtering)
CREATE INDEX IF NOT EXISTS idx_audit_created         ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action          ON audit_log (action);
