CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'store', 'user');
CREATE TYPE store_subtype AS ENUM ('store', 'coto');
CREATE TYPE listing_status AS ENUM ('pending', 'active', 'rejected', 'archived');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'disputed', 'refunded', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'disputed', 'refunded', 'cancelled');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_refund', 'resolved_no_refund', 'closed');
CREATE TYPE dispute_ref_type AS ENUM ('order', 'booking');
CREATE TYPE notification_type AS ENUM (
  'listing_approved', 'listing_rejected', 'new_order', 'new_booking',
  'dispute_opened', 'dispute_resolved', 'funds_released',
  'verification_approved', 'review_received'
);
