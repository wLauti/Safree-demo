-- Sprint 5: Booking flow, escrow, vouchers, cancellation

-- Notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_dispute';

-- ── Experience: add addon pricing + cancellation policy ──────
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS addon_prices       JSONB NOT NULL DEFAULT '{}';
-- e.g. { "guide": 150, "accommodation": 200, "meals": 75, "transport": 300, "equipment": 100 }
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT 'moderate'
  CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict'));

-- ── Bookings: escrow, voucher, add-ons ──────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ref_number        TEXT UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS subtotal          NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS addons            JSONB NOT NULL DEFAULT '[]';
-- e.g. [{ "key": "guide", "label": "Professional Guide", "price": 450 }]
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS addons_total      NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee       NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount     NUMERIC(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS release_at        TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS funds_released    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS voucher_url       TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at      TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at      TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ;

-- ── RPC: decrement availability slots_booked on booking ──────
CREATE OR REPLACE FUNCTION reserve_availability_slots(
  p_experience_id uuid,
  p_start_date    date,
  p_end_date      date,
  p_quantity      int DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date := p_start_date;
BEGIN
  WHILE d < p_end_date LOOP
    INSERT INTO availability (experience_id, date, slots, slots_booked)
    VALUES (p_experience_id, d, 1, p_quantity)
    ON CONFLICT (experience_id, date) DO UPDATE
      SET slots_booked = LEAST(availability.slots_booked + p_quantity, availability.slots);
    d := d + 1;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION reserve_availability_slots(uuid, date, date, int) TO service_role;

-- ── RPC: release availability slots on cancellation ──────────
CREATE OR REPLACE FUNCTION release_availability_slots(
  p_experience_id uuid,
  p_start_date    date,
  p_end_date      date,
  p_quantity      int DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date := p_start_date;
BEGIN
  WHILE d < p_end_date LOOP
    UPDATE availability
    SET slots_booked = GREATEST(0, slots_booked - p_quantity)
    WHERE experience_id = p_experience_id AND date = d;
    d := d + 1;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION release_availability_slots(uuid, date, date, int) TO service_role;

-- ── RLS for bookings (add what wasn't in Sprint 1) ───────────
-- Users see own bookings
DO $$ BEGIN
  CREATE POLICY "Users see own bookings"
    ON bookings FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Cotos see bookings for their experiences
DO $$ BEGIN
  CREATE POLICY "Cotos see own experience bookings"
    ON bookings FOR SELECT USING (
      store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
