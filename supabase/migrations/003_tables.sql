-- profiles (mirrors auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'user',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone         TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- stores
CREATE TABLE stores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,
  subtype           store_subtype NOT NULL DEFAULT 'store',
  logo_url          TEXT,
  banner_url        TEXT,
  location_state    TEXT,
  location_city     TEXT,
  location_coords   GEOGRAPHY(POINT, 4326),
  stripe_account_id TEXT,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- categories
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  type       TEXT NOT NULL CHECK (type IN ('product', 'experience')),
  icon_url   TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- species
CREATE TABLE species (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      TEXT NOT NULL,
  slug      TEXT NOT NULL UNIQUE,
  type      TEXT NOT NULL CHECK (type IN ('game', 'fish', 'bird')),
  image_url TEXT
);

ALTER TABLE species ENABLE ROW LEVEL SECURITY;

-- products
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  price            NUMERIC(10, 2) NOT NULL,
  compare_at_price NUMERIC(10, 2),
  images           TEXT[] NOT NULL DEFAULT '{}',
  stock            INTEGER NOT NULL DEFAULT 0,
  sku              TEXT,
  status           listing_status NOT NULL DEFAULT 'pending',
  species_ids      UUID[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- experiences
CREATE TABLE experiences (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  price_per_person NUMERIC(10, 2) NOT NULL,
  max_guests       INTEGER NOT NULL DEFAULT 1,
  images           TEXT[] NOT NULL DEFAULT '{}',
  location_name    TEXT,
  location_state   TEXT,
  location_coords  GEOGRAPHY(POINT, 4326),
  duration_days    INTEGER,
  status           listing_status NOT NULL DEFAULT 'pending',
  species_ids      UUID[] NOT NULL DEFAULT '{}',
  amenities        TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- availability (for experiences)
CREATE TABLE availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  slots         INTEGER NOT NULL DEFAULT 0,
  is_blocked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- cart_items
CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- orders
CREATE TABLE orders (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  items                   JSONB NOT NULL DEFAULT '[]',
  subtotal                NUMERIC(10, 2) NOT NULL,
  tax                     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total                   NUMERIC(10, 2) NOT NULL,
  status                  order_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  shipping_address        JSONB,
  tracking_number         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- bookings
CREATE TABLE bookings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  experience_id           UUID NOT NULL REFERENCES experiences(id) ON DELETE RESTRICT,
  store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  guests                  INTEGER NOT NULL DEFAULT 1,
  start_date              DATE NOT NULL,
  end_date                DATE NOT NULL,
  total                   NUMERIC(10, 2) NOT NULL,
  status                  booking_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  special_requests        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- disputes
CREATE TABLE disputes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_type          dispute_ref_type NOT NULL,
  ref_id            UUID NOT NULL,
  opened_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  reason            TEXT NOT NULL,
  status            dispute_status NOT NULL DEFAULT 'open',
  resolution_note   TEXT,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- reviews
CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_type   dispute_ref_type NOT NULL,
  ref_id     UUID NOT NULL,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ref_type, ref_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- integration_keys (admin-only, encrypted values)
CREATE TABLE integration_keys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service       TEXT NOT NULL UNIQUE,
  key_encrypted TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE integration_keys ENABLE ROW LEVEL SECURITY;

-- audit_log (append-only, service role only)
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID NOT NULL,
  actor_role  user_role NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  ref_type   TEXT,
  ref_id     UUID,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
