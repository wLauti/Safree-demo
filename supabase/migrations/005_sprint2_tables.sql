-- Product specifications (key-value pairs)
CREATE TABLE product_specs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;

-- Product Q&A
CREATE TABLE product_qa (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  asked_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question     TEXT NOT NULL,
  answer       TEXT,
  answered_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answered_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE product_qa ENABLE ROW LEVEL SECURITY;

-- Saved / wishlisted products
CREATE TABLE saved_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Add extra columns to products for Sprint 2
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS condition       TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
  ADD COLUMN IF NOT EXISTS state_location  TEXT,
  ADD COLUMN IF NOT EXISTS video_url       TEXT,
  ADD COLUMN IF NOT EXISTS shipping_notes  TEXT,
  ADD COLUMN IF NOT EXISTS views           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS search_vector   TSVECTOR;

-- Add slug to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Full-text search index
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN(search_vector);

-- Function to keep search_vector up to date
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_fts
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Experience FTS too
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE INDEX IF NOT EXISTS experiences_search_idx ON experiences USING GIN(search_vector);

CREATE OR REPLACE FUNCTION experiences_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_experiences_fts
  BEFORE INSERT OR UPDATE ON experiences
  FOR EACH ROW EXECUTE FUNCTION experiences_search_vector_update();

-- Supabase Storage bucket setup (run via Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('stores', 'stores', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
