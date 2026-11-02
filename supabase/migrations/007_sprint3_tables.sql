-- Sprint 3: Checkout, payments, orders

-- Extend notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_paid';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_failed';

-- Stripe onboarding columns on stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;

-- Extend orders table for checkout flow
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_total numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Shipping addresses (user-saved)
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  line1      text NOT NULL,
  line2      text,
  city       text NOT NULL,
  state      text NOT NULL,
  zip        text NOT NULL,
  country    text NOT NULL DEFAULT 'US',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Admin-configured flat shipping rates
CREATE TABLE IF NOT EXISTS shipping_rates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  description        text,
  price              numeric(10,2) NOT NULL,
  estimated_days_min int NOT NULL DEFAULT 5,
  estimated_days_max int NOT NULL DEFAULT 7,
  is_active          boolean NOT NULL DEFAULT true,
  sort_order         int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

-- Seed default shipping rates (idempotent via conflict on name)
INSERT INTO shipping_rates (name, description, price, estimated_days_min, estimated_days_max, sort_order)
VALUES
  ('Standard Shipping', '5–7 business days via USPS', 9.99, 5, 7, 1),
  ('Expedited Shipping', '2–3 business days via UPS', 19.99, 2, 3, 2)
ON CONFLICT DO NOTHING;

-- Seed commission rate in integration_keys
INSERT INTO integration_keys (service, key_encrypted)
VALUES ('stripe_commission_rate', '5')
ON CONFLICT (service) DO NOTHING;

-- RPC: decrement product stock atomically (used in webhook)
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_quantity int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
$$;
GRANT EXECUTE ON FUNCTION decrement_product_stock(uuid, int) TO service_role;
