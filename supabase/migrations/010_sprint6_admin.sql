-- Sprint 6: Moderator queue, Admin panel, credentials, featured content

-- Notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_suspended';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'content_flagged';

-- ── profiles: suspension / ban ───────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'banned'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at  TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- ── listings: rejection reason + featured + view count ───────
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason     TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_category   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured             BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count           INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_flags     JSONB NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_by          UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_at          TIMESTAMPTZ;

ALTER TABLE experiences ADD COLUMN IF NOT EXISTS rejection_reason   TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS rejection_category TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS featured           BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS view_count         INTEGER NOT NULL DEFAULT 0;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS moderation_flags   JSONB NOT NULL DEFAULT '[]';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS reviewed_by        UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS reviewed_at        TIMESTAMPTZ;

-- ── stores: verification documents + verified_at ─────────────
ALTER TABLE stores ADD COLUMN IF NOT EXISTS verification_docs  TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS verified_at        TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS verification_rejection TEXT;

-- ── content_flags: user reports ──────────────────────────────
CREATE TABLE IF NOT EXISTS content_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type      TEXT NOT NULL CHECK (ref_type IN ('product', 'experience', 'review')),
  ref_id        UUID NOT NULL,
  reported_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  details       TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'removed', 'escalated')),
  resolved_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

-- ── prohibited_keywords: editable keyword filter ─────────────
CREATE TABLE IF NOT EXISTS prohibited_keywords (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword    TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL CHECK (category IN ('firearm', 'cites_species', 'hate_speech', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE prohibited_keywords ENABLE ROW LEVEL SECURITY;

INSERT INTO prohibited_keywords (keyword, category) VALUES
  ('glock', 'firearm'), ('ar-15', 'firearm'), ('ar15', 'firearm'), ('rifle', 'firearm'),
  ('handgun', 'firearm'), ('pistol', 'firearm'), ('ammunition', 'firearm'), ('firearm', 'firearm'),
  ('silencer', 'firearm'), ('suppressor', 'firearm'),
  ('snow leopard', 'cites_species'), ('tiger', 'cites_species'), ('rhinoceros', 'cites_species'),
  ('elephant ivory', 'cites_species'), ('gorilla', 'cites_species'), ('orangutan', 'cites_species'),
  ('sea turtle', 'cites_species'), ('pangolin', 'cites_species')
ON CONFLICT (keyword) DO NOTHING;

-- ── featured content: hero slides + curated sections ─────────
CREATE TABLE IF NOT EXISTS hero_slides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT NOT NULL,
  headline    TEXT NOT NULL,
  subtext     TEXT,
  cta_text    TEXT,
  cta_url     TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS featured_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section     TEXT NOT NULL CHECK (section IN ('most_notable', 'featured_grounds', 'featured_deals')),
  ref_type    TEXT NOT NULL CHECK (ref_type IN ('product', 'experience')),
  ref_id      UUID NOT NULL,
  sale_price  NUMERIC(10, 2),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section, ref_id)
);
ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

-- ── integration_keys: seed the credential rows ──────────────
INSERT INTO integration_keys (service, key_encrypted) VALUES
  ('stripe_publishable_key', ''),
  ('stripe_secret_key', ''),
  ('stripe_webhook_secret', ''),
  ('google_oauth_client_id', ''),
  ('google_oauth_client_secret', ''),
  ('resend_api_key', ''),
  ('email_from_address', ''),
  ('email_from_name', ''),
  ('vapid_public_key', ''),
  ('vapid_private_key', ''),
  ('analytics_id', ''),
  ('allowed_origins', '')
ON CONFLICT (service) DO NOTHING;

-- ── Category avg-price helper for automated checks ──────────
CREATE OR REPLACE FUNCTION category_avg_price(p_category_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(price), 0)
  FROM products
  WHERE category_id = p_category_id AND status = 'active';
$$;
GRANT EXECUTE ON FUNCTION category_avg_price(uuid) TO service_role;
