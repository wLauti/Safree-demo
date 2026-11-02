-- Sprint 4: Experience discovery & availability module

-- Extend experiences table
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS type       TEXT CHECK (type IN ('hunt', 'fishing'));
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS slug       TEXT UNIQUE;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS terrain_description TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS video_url  TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS min_booking_days INTEGER NOT NULL DEFAULT 1;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) NOT NULL DEFAULT 0;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

-- Extend availability: slots → slots_total, add slots_booked
ALTER TABLE availability ADD COLUMN IF NOT EXISTS slots_booked INTEGER NOT NULL DEFAULT 0;
-- 'slots' column now treated as slots_total
DO $$ BEGIN
  ALTER TABLE availability ADD CONSTRAINT availability_unique_date UNIQUE (experience_id, date);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Extend species table
ALTER TABLE species ADD COLUMN IF NOT EXISTS is_custom          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE species ADD COLUMN IF NOT EXISTS created_by_store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE species ADD COLUMN IF NOT EXISTS is_approved        BOOLEAN NOT NULL DEFAULT true;

-- ─── Seed predefined species ───────────────────────────────────
INSERT INTO species (name, slug, type, is_custom, is_approved) VALUES
  -- Game animals
  ('Whitetail Deer',   'whitetail-deer',   'game', false, true),
  ('Mule Deer',        'mule-deer',        'game', false, true),
  ('Elk',              'elk',              'game', false, true),
  ('Moose',            'moose',            'game', false, true),
  ('Bear',             'bear',             'game', false, true),
  ('Wild Boar',        'wild-boar',        'game', false, true),
  ('Antelope',         'antelope',         'game', false, true),
  ('Bighorn Sheep',    'bighorn-sheep',    'game', false, true),
  ('Mountain Lion',    'mountain-lion',    'game', false, true),
  ('Alligator',        'alligator',        'game', false, true),
  -- Birds
  ('Turkey',           'turkey',           'bird', false, true),
  ('Duck',             'duck',             'bird', false, true),
  ('Pheasant',         'pheasant',         'bird', false, true),
  ('Quail',            'quail',            'bird', false, true),
  ('Dove',             'dove',             'bird', false, true),
  ('Goose',            'goose',            'bird', false, true),
  -- Fish
  ('Trout',            'trout',            'fish', false, true),
  ('Salmon',           'salmon',           'fish', false, true),
  ('Bass',             'bass',             'fish', false, true),
  ('Walleye',          'walleye',          'fish', false, true),
  ('Catfish',          'catfish',          'fish', false, true),
  ('Striped Bass',     'striped-bass',     'fish', false, true),
  ('Redfish',          'redfish',          'fish', false, true),
  ('Snook',            'snook',            'fish', false, true),
  ('Tarpon',           'tarpon',           'fish', false, true),
  ('Flounder',         'flounder',         'fish', false, true)
ON CONFLICT (slug) DO NOTHING;

-- ─── PostGIS spatial query functions ───────────────────────────

-- Experiences within map viewport bounds
CREATE OR REPLACE FUNCTION experiences_in_bounds(
  p_lat_min float8,
  p_lat_max float8,
  p_lng_min float8,
  p_lng_max float8
)
RETURNS SETOF experiences
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM experiences
  WHERE status = 'active'
    AND location_coords IS NOT NULL
    AND location_coords::geometry &&
        ST_MakeEnvelope(p_lng_min, p_lat_min, p_lng_max, p_lat_max, 4326)
  ORDER BY id;
$$;
GRANT EXECUTE ON FUNCTION experiences_in_bounds(float8, float8, float8, float8) TO anon, authenticated;

-- Nearby experiences ordered by distance from a point
CREATE OR REPLACE FUNCTION experiences_near_point(
  p_lat   float8,
  p_lng   float8,
  p_limit int DEFAULT 20
)
RETURNS SETOF experiences
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM experiences
  WHERE status = 'active'
    AND location_coords IS NOT NULL
  ORDER BY ST_Distance(location_coords, ST_Point(p_lng, p_lat)::geography)
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION experiences_near_point(float8, float8, int) TO anon, authenticated;

-- Increment slots_booked atomically (called when booking confirmed)
CREATE OR REPLACE FUNCTION increment_availability_booked(
  p_experience_id uuid,
  p_date          date,
  p_quantity      int DEFAULT 1
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE availability
  SET slots_booked = LEAST(slots_booked + p_quantity, slots)
  WHERE experience_id = p_experience_id
    AND date = p_date
    AND NOT is_blocked
    AND slots > slots_booked;
$$;
GRANT EXECUTE ON FUNCTION increment_availability_booked(uuid, date, int) TO service_role;

-- Maps use OpenStreetMap (MapLibre GL) — no API token required.
