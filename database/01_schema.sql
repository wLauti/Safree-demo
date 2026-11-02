-- =============================================================================
-- Safree — Full database schema (portable / self-hosted PostgreSQL)
-- =============================================================================
-- Exported from the live Supabase project (lccdlpezojfghcyxsyhy), PostgreSQL 17.
-- This file recreates the complete `public` schema on ANY standard PostgreSQL 14+
-- server. It depends only on three open-source extensions (postgis, pgcrypto,
-- uuid-ossp) — nothing Supabase-specific is required to create the schema.
--
-- RUN ORDER:
--   1) 01_schema.sql        <- this file (extensions, types, tables, functions, triggers)
--   2) 02_auth_users.sql    <- user identities + password hashes
--   3) 03_data.sql          <- all application data
--   4) 04_rls_policies.sql  <- OPTIONAL row-level security (Supabase-style; see README)
--
-- Load with, e.g.:
--   psql "postgresql://user:pass@host:5432/safree" -v ON_ERROR_STOP=1 -f 01_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions (installed into the public schema so unqualified calls resolve)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS pgcrypto;       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS postgis;        -- geography(Point,4326), ST_* functions

-- ---------------------------------------------------------------------------
-- auth schema + minimal users table
-- ---------------------------------------------------------------------------
-- On Supabase, user identities live in auth.users (managed by Supabase Auth /
-- GoTrue). public.profiles has a FK to it. Off Supabase there is no GoTrue, so
-- we recreate a MINIMAL auth.users table that holds the real identity columns we
-- exported. Your developer can keep this table and build authentication on top
-- of it, or drop the FK and use their own users table. See 00_README.md.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id                 uuid PRIMARY KEY,
  email              text UNIQUE,
  encrypted_password text,                 -- bcrypt hash ($2a$...), NULL for OAuth-only users
  email_confirmed_at timestamptz,
  phone              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  last_sign_in_at    timestamptz,
  raw_user_meta_data jsonb,                 -- full_name, avatar_url, OAuth profile, ...
  raw_app_meta_data  jsonb                  -- provider, providers[]
);

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role        AS ENUM ('admin', 'moderator', 'store', 'user');
CREATE TYPE public.store_subtype    AS ENUM ('store', 'coto');
CREATE TYPE public.listing_status   AS ENUM ('pending', 'active', 'rejected', 'archived');
CREATE TYPE public.order_status     AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'disputed', 'refunded', 'cancelled');
CREATE TYPE public.booking_status   AS ENUM ('pending', 'confirmed', 'completed', 'disputed', 'refunded', 'cancelled');
CREATE TYPE public.dispute_status   AS ENUM ('open', 'under_review', 'resolved_refund', 'resolved_no_refund', 'closed');
CREATE TYPE public.dispute_ref_type AS ENUM ('order', 'booking');
CREATE TYPE public.notification_type AS ENUM (
  'listing_approved', 'listing_rejected', 'new_order', 'new_booking', 'dispute_opened',
  'dispute_resolved', 'funds_released', 'verification_approved', 'review_received',
  'order_paid', 'payment_failed', 'booking_cancelled', 'booking_completed',
  'booking_dispute', 'account_suspended', 'content_flagged', 'dispute_response', 'welcome'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  email_verified boolean DEFAULT false NOT NULL,
  phone text,
  bio text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  suspended_at timestamp with time zone,
  last_active_at timestamp with time zone,
  push_subscription jsonb,
  review_manipulation_flag boolean DEFAULT false NOT NULL,
  cookie_consent jsonb
);

CREATE TABLE public.stores (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  subtype store_subtype DEFAULT 'store'::store_subtype NOT NULL,
  logo_url text,
  banner_url text,
  location_state text,
  location_city text,
  location_coords geography(Point,4326),
  stripe_account_id text,
  is_verified boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  stripe_onboarding_complete boolean DEFAULT false NOT NULL,
  stripe_charges_enabled boolean DEFAULT false NOT NULL,
  stripe_payouts_enabled boolean DEFAULT false NOT NULL,
  verification_docs text[] DEFAULT '{}'::text[] NOT NULL,
  verification_status text DEFAULT 'unverified'::text NOT NULL,
  verified_at timestamp with time zone,
  verification_rejection text,
  rating_avg numeric(2,1) DEFAULT 0 NOT NULL,
  review_count integer DEFAULT 0 NOT NULL,
  low_rating_flag boolean DEFAULT false NOT NULL
);

CREATE TABLE public.categories (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid,
  type text NOT NULL,
  icon_url text,
  sort_order integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.species (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  type text NOT NULL,
  image_url text,
  is_custom boolean DEFAULT false NOT NULL,
  created_by_store_id uuid,
  is_approved boolean DEFAULT true NOT NULL
);

CREATE TABLE public.products (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid NOT NULL,
  category_id uuid,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  images text[] DEFAULT '{}'::text[] NOT NULL,
  stock integer DEFAULT 0 NOT NULL,
  sku text,
  status listing_status DEFAULT 'pending'::listing_status NOT NULL,
  species_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  condition text DEFAULT 'new'::text NOT NULL,
  state_location text,
  video_url text,
  shipping_notes text,
  views integer DEFAULT 0 NOT NULL,
  rejection_reason text,
  search_vector tsvector,
  slug text,
  rejection_category text,
  featured boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  moderation_flags jsonb DEFAULT '[]'::jsonb NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);

CREATE TABLE public.experiences (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid NOT NULL,
  category_id uuid,
  title text NOT NULL,
  description text,
  price_per_person numeric(10,2) NOT NULL,
  max_guests integer DEFAULT 1 NOT NULL,
  images text[] DEFAULT '{}'::text[] NOT NULL,
  location_name text,
  location_state text,
  location_coords geography(Point,4326),
  duration_days integer,
  status listing_status DEFAULT 'pending'::listing_status NOT NULL,
  species_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  amenities text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  search_vector tsvector,
  type text,
  slug text,
  location_city text,
  terrain_description text,
  video_url text,
  min_booking_days integer DEFAULT 1 NOT NULL,
  avg_rating numeric(2,1) DEFAULT 0 NOT NULL,
  review_count integer DEFAULT 0 NOT NULL,
  addon_prices jsonb DEFAULT '{}'::jsonb NOT NULL,
  cancellation_policy text DEFAULT 'moderate'::text NOT NULL,
  rejection_reason text,
  rejection_category text,
  featured boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  moderation_flags jsonb DEFAULT '[]'::jsonb NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);

CREATE TABLE public.availability (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  experience_id uuid NOT NULL,
  date date NOT NULL,
  slots integer DEFAULT 0 NOT NULL,
  is_blocked boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  slots_booked integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.cart_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.orders (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid,
  store_id uuid NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  tax numeric(10,2) DEFAULT 0 NOT NULL,
  total numeric(10,2) NOT NULL,
  status order_status DEFAULT 'pending'::order_status NOT NULL,
  stripe_payment_intent_id text,
  shipping_address jsonb,
  tracking_number text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  shipping_method text,
  shipping_total numeric(10,2) DEFAULT 0 NOT NULL,
  discount numeric(10,2) DEFAULT 0 NOT NULL,
  promo_code text,
  paid_at timestamp with time zone,
  tracking_url text,
  delivered_at timestamp with time zone
);

CREATE TABLE public.bookings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid,
  experience_id uuid NOT NULL,
  store_id uuid NOT NULL,
  guests integer DEFAULT 1 NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total numeric(10,2) NOT NULL,
  status booking_status DEFAULT 'pending'::booking_status NOT NULL,
  stripe_payment_intent_id text,
  special_requests text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  ref_number text,
  subtotal numeric(10,2) DEFAULT 0 NOT NULL,
  addons jsonb DEFAULT '[]'::jsonb NOT NULL,
  addons_total numeric(10,2) DEFAULT 0 NOT NULL,
  service_fee numeric(10,2) DEFAULT 0 NOT NULL,
  cancellation_policy text,
  refund_amount numeric(10,2),
  release_at timestamp with time zone,
  funds_released boolean DEFAULT false NOT NULL,
  voucher_url text,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  paid_at timestamp with time zone
);

CREATE TABLE public.disputes (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  ref_type dispute_ref_type NOT NULL,
  ref_id uuid NOT NULL,
  opened_by_user_id uuid,
  store_id uuid NOT NULL,
  reason text NOT NULL,
  status dispute_status DEFAULT 'open'::dispute_status NOT NULL,
  resolution_note text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  ref_number text,
  reason_category text,
  description text,
  evidence_urls text[] DEFAULT '{}'::text[] NOT NULL,
  store_response text,
  store_evidence_urls text[] DEFAULT '{}'::text[] NOT NULL,
  resolution_type text,
  refund_amount numeric(10,2),
  resolved_by uuid
);

CREATE TABLE public.reviews (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  ref_type dispute_ref_type NOT NULL,
  ref_id uuid NOT NULL,
  user_id uuid,
  rating integer NOT NULL,
  body text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  store_id uuid,
  is_verified_purchase boolean DEFAULT true NOT NULL,
  is_anonymous boolean DEFAULT false NOT NULL,
  status text DEFAULT 'active'::text NOT NULL
);

CREATE TABLE public.integration_keys (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  service text NOT NULL,
  key_encrypted text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_log (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  actor_id uuid NOT NULL,
  actor_role user_role NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notifications (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text,
  ref_type text,
  ref_id uuid,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.product_specs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  product_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.product_qa (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  product_id uuid NOT NULL,
  asked_by uuid NOT NULL,
  question text NOT NULL,
  answer text,
  answered_by uuid,
  answered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.saved_items (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.shipping_addresses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  country text DEFAULT 'US'::text NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.shipping_rates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  estimated_days_min integer DEFAULT 5 NOT NULL,
  estimated_days_max integer DEFAULT 7 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.content_flags (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  ref_type text NOT NULL,
  ref_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'open'::text NOT NULL,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.prohibited_keywords (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  keyword text NOT NULL,
  category text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.hero_slides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  image_url text NOT NULL,
  headline text NOT NULL,
  subtext text,
  cta_text text,
  cta_url text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.featured_content (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  section text NOT NULL,
  ref_type text NOT NULL,
  ref_id uuid NOT NULL,
  sale_price numeric(10,2),
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- Primary keys / unique / check / foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);

ALTER TABLE public.availability ADD CONSTRAINT availability_pkey PRIMARY KEY (id);
ALTER TABLE public.availability ADD CONSTRAINT availability_unique_date UNIQUE (experience_id, date);
ALTER TABLE public.availability ADD CONSTRAINT availability_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
ALTER TABLE public.bookings ADD CONSTRAINT bookings_ref_number_key UNIQUE (ref_number);
ALTER TABLE public.bookings ADD CONSTRAINT bookings_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE RESTRICT;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_product_id_key UNIQUE (user_id, product_id);
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0));
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE public.categories ADD CONSTRAINT categories_type_check CHECK ((type = ANY (ARRAY['product'::text, 'experience'::text])));
ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE public.content_flags ADD CONSTRAINT content_flags_pkey PRIMARY KEY (id);
ALTER TABLE public.content_flags ADD CONSTRAINT content_flags_ref_type_check CHECK ((ref_type = ANY (ARRAY['product'::text, 'experience'::text, 'review'::text])));
ALTER TABLE public.content_flags ADD CONSTRAINT content_flags_status_check CHECK ((status = ANY (ARRAY['open'::text, 'dismissed'::text, 'removed'::text, 'escalated'::text])));
ALTER TABLE public.content_flags ADD CONSTRAINT content_flags_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.content_flags ADD CONSTRAINT content_flags_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.disputes ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);
ALTER TABLE public.disputes ADD CONSTRAINT disputes_ref_number_key UNIQUE (ref_number);
ALTER TABLE public.disputes ADD CONSTRAINT disputes_resolution_type_check CHECK ((resolution_type = ANY (ARRAY['full_refund'::text, 'partial_refund'::text, 'no_refund'::text])));
ALTER TABLE public.disputes ADD CONSTRAINT disputes_opened_by_user_id_fkey FOREIGN KEY (opened_by_user_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT;

ALTER TABLE public.experiences ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);
ALTER TABLE public.experiences ADD CONSTRAINT experiences_slug_key UNIQUE (slug);
ALTER TABLE public.experiences ADD CONSTRAINT experiences_cancellation_policy_check CHECK ((cancellation_policy = ANY (ARRAY['flexible'::text, 'moderate'::text, 'strict'::text])));
ALTER TABLE public.experiences ADD CONSTRAINT experiences_type_check CHECK ((type = ANY (ARRAY['hunt'::text, 'fishing'::text])));
ALTER TABLE public.experiences ADD CONSTRAINT experiences_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE public.featured_content ADD CONSTRAINT featured_content_pkey PRIMARY KEY (id);
ALTER TABLE public.featured_content ADD CONSTRAINT featured_content_section_ref_id_key UNIQUE (section, ref_id);
ALTER TABLE public.featured_content ADD CONSTRAINT featured_content_ref_type_check CHECK ((ref_type = ANY (ARRAY['product'::text, 'experience'::text])));
ALTER TABLE public.featured_content ADD CONSTRAINT featured_content_section_check CHECK ((section = ANY (ARRAY['most_notable'::text, 'featured_grounds'::text, 'featured_deals'::text])));

ALTER TABLE public.hero_slides ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);

ALTER TABLE public.integration_keys ADD CONSTRAINT integration_keys_pkey PRIMARY KEY (id);
ALTER TABLE public.integration_keys ADD CONSTRAINT integration_keys_service_key UNIQUE (service);

ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE public.orders ADD CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.product_qa ADD CONSTRAINT product_qa_pkey PRIMARY KEY (id);
ALTER TABLE public.product_qa ADD CONSTRAINT product_qa_answered_by_fkey FOREIGN KEY (answered_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.product_qa ADD CONSTRAINT product_qa_asked_by_fkey FOREIGN KEY (asked_by) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.product_qa ADD CONSTRAINT product_qa_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE public.product_specs ADD CONSTRAINT product_specs_pkey PRIMARY KEY (id);
ALTER TABLE public.product_specs ADD CONSTRAINT product_specs_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
ALTER TABLE public.products ADD CONSTRAINT products_condition_check CHECK ((condition = ANY (ARRAY['new'::text, 'used'::text])));
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD CONSTRAINT products_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'banned'::text])));
-- NOTE: references the auth.users table created above. Drop this FK if you move
-- user identities to your own table. See 00_README.md.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.prohibited_keywords ADD CONSTRAINT prohibited_keywords_pkey PRIMARY KEY (id);
ALTER TABLE public.prohibited_keywords ADD CONSTRAINT prohibited_keywords_keyword_key UNIQUE (keyword);
ALTER TABLE public.prohibited_keywords ADD CONSTRAINT prohibited_keywords_category_check CHECK ((category = ANY (ARRAY['firearm'::text, 'cites_species'::text, 'hate_speech'::text, 'other'::text])));

ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_ref_type_ref_id_user_id_key UNIQUE (ref_type, ref_id, user_id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_status_check CHECK ((status = ANY (ARRAY['active'::text, 'removed'::text])));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.saved_items ADD CONSTRAINT saved_items_pkey PRIMARY KEY (id);
ALTER TABLE public.saved_items ADD CONSTRAINT saved_items_user_id_product_id_key UNIQUE (user_id, product_id);
ALTER TABLE public.saved_items ADD CONSTRAINT saved_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE public.saved_items ADD CONSTRAINT saved_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.shipping_addresses ADD CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id);
ALTER TABLE public.shipping_addresses ADD CONSTRAINT shipping_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.shipping_rates ADD CONSTRAINT shipping_rates_pkey PRIMARY KEY (id);

ALTER TABLE public.species ADD CONSTRAINT species_pkey PRIMARY KEY (id);
ALTER TABLE public.species ADD CONSTRAINT species_slug_key UNIQUE (slug);
ALTER TABLE public.species ADD CONSTRAINT species_type_check CHECK ((type = ANY (ARRAY['game'::text, 'fish'::text, 'bird'::text])));
ALTER TABLE public.species ADD CONSTRAINT species_created_by_store_id_fkey FOREIGN KEY (created_by_store_id) REFERENCES stores(id) ON DELETE SET NULL;

ALTER TABLE public.stores ADD CONSTRAINT stores_pkey PRIMARY KEY (id);
ALTER TABLE public.stores ADD CONSTRAINT stores_slug_key UNIQUE (slug);
ALTER TABLE public.stores ADD CONSTRAINT stores_verification_status_check CHECK ((verification_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'verified'::text, 'rejected'::text])));
ALTER TABLE public.stores ADD CONSTRAINT stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- Functions (trigger functions + RPC helpers used by the app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
 RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.experiences_search_vector_update()
 RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_store_rating()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  affected_store UUID;
  new_avg NUMERIC;
  new_count INTEGER;
BEGIN
  affected_store := COALESCE(NEW.store_id, OLD.store_id);
  IF affected_store IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0), COUNT(*)
  INTO new_avg, new_count
  FROM reviews
  WHERE store_id = affected_store AND status = 'active';

  UPDATE stores
  SET rating_avg = new_avg,
      review_count = new_count,
      low_rating_flag = (new_count >= 10 AND new_avg < 3.0),
      updated_at = NOW()
  WHERE id = affected_store;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_review_manipulation()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  distinct_stores INTEGER;
BEGIN
  SELECT COUNT(DISTINCT store_id) INTO distinct_stores
  FROM reviews
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF distinct_stores >= 5 THEN
    UPDATE profiles SET review_manipulation_flag = TRUE WHERE id = NEW.user_id;

    INSERT INTO audit_log (actor_id, actor_role, action, target_type, target_id, metadata)
    VALUES (NEW.user_id, 'user', 'review_manipulation_flagged', 'user', NEW.user_id,
            jsonb_build_object('distinct_stores_24h', distinct_stores));
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.category_avg_price(p_category_id uuid)
 RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(AVG(price), 0)
  FROM products
  WHERE category_id = p_category_id AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id uuid, p_quantity integer)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_product_views(product_id uuid)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE products
  SET views = views + 1
  WHERE id = product_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_availability_booked(p_experience_id uuid, p_date date, p_quantity integer DEFAULT 1)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE availability
  SET slots_booked = LEAST(slots_booked + p_quantity, slots)
  WHERE experience_id = p_experience_id
    AND date = p_date
    AND NOT is_blocked
    AND slots > slots_booked;
$$;

CREATE OR REPLACE FUNCTION public.reserve_availability_slots(p_experience_id uuid, p_start_date date, p_end_date date, p_quantity integer DEFAULT 1)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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

CREATE OR REPLACE FUNCTION public.release_availability_slots(p_experience_id uuid, p_start_date date, p_end_date date, p_quantity integer DEFAULT 1)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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

-- Map discovery helpers (PostGIS). search_path kept to public where PostGIS lives.
CREATE OR REPLACE FUNCTION public.experiences_in_bounds(p_lat_min double precision, p_lat_max double precision, p_lng_min double precision, p_lng_max double precision)
 RETURNS SETOF experiences LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT *
  FROM experiences
  WHERE status = 'active'
    AND location_coords IS NOT NULL
    AND location_coords::geometry &&
        ST_MakeEnvelope(p_lng_min, p_lat_min, p_lng_max, p_lat_max, 4326)
  ORDER BY id;
$$;

CREATE OR REPLACE FUNCTION public.experiences_near_point(p_lat double precision, p_lng double precision, p_limit integer DEFAULT 20)
 RETURNS SETOF experiences LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT *
  FROM experiences
  WHERE status = 'active'
    AND location_coords IS NOT NULL
  ORDER BY ST_Distance(location_coords, ST_Point(p_lng, p_lat)::geography)
  LIMIT p_limit;
$$;

-- These two were Supabase auth hooks (fired by triggers on auth.users). They are
-- included for completeness; attach them to your auth.users table only if you keep
-- the minimal auth.users table as your identity store (see commented triggers below).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles SET email_verified = TRUE WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_audit_action ON public.audit_log USING btree (action);
CREATE INDEX idx_audit_created ON public.audit_log USING btree (created_at DESC);
CREATE INDEX idx_availability_exp_date ON public.availability USING btree (experience_id, date);
CREATE INDEX idx_bookings_experience ON public.bookings USING btree (experience_id);
CREATE INDEX idx_bookings_release ON public.bookings USING btree (release_at) WHERE (funds_released = false);
CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);
CREATE INDEX idx_bookings_store ON public.bookings USING btree (store_id);
CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);
CREATE INDEX idx_cart_user ON public.cart_items USING btree (user_id);
CREATE INDEX idx_content_flags_status ON public.content_flags USING btree (status) WHERE (status = 'open'::text);
CREATE INDEX idx_disputes_opened_by ON public.disputes USING btree (opened_by_user_id);
CREATE INDEX idx_disputes_ref ON public.disputes USING btree (ref_type, ref_id);
CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);
CREATE INDEX idx_disputes_store ON public.disputes USING btree (store_id);
CREATE INDEX experiences_search_idx ON public.experiences USING gin (search_vector);
CREATE INDEX idx_experiences_coords ON public.experiences USING gist (location_coords);
CREATE INDEX idx_experiences_state ON public.experiences USING btree (location_state);
CREATE INDEX idx_experiences_status ON public.experiences USING btree (status);
CREATE INDEX idx_experiences_store ON public.experiences USING btree (store_id);
CREATE INDEX idx_experiences_type ON public.experiences USING btree (type);
CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id) WHERE (is_read = false);
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, created_at DESC);
CREATE INDEX idx_orders_pi ON public.orders USING btree (stripe_payment_intent_id);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_store ON public.orders USING btree (store_id);
CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);
CREATE INDEX idx_products_category ON public.products USING btree (category_id);
CREATE INDEX idx_products_featured ON public.products USING btree (featured) WHERE (featured = true);
CREATE INDEX idx_products_status ON public.products USING btree (status);
CREATE INDEX idx_products_status_created ON public.products USING btree (status, created_at DESC);
CREATE INDEX idx_products_store ON public.products USING btree (store_id);
CREATE INDEX products_search_idx ON public.products USING gin (search_vector);
CREATE INDEX idx_reviews_ref ON public.reviews USING btree (ref_type, ref_id);
CREATE INDEX idx_reviews_store ON public.reviews USING btree (store_id) WHERE (status = 'active'::text);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_experiences_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_fts BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();
CREATE TRIGGER trg_experiences_fts BEFORE INSERT OR UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION experiences_search_vector_update();
CREATE TRIGGER trg_detect_review_manipulation AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION detect_review_manipulation();
CREATE TRIGGER trg_recompute_store_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION recompute_store_rating();

-- OPTIONAL: if you keep auth.users as your identity store, these recreate the
-- Supabase behavior of auto-creating a profile row on signup / flipping
-- email_verified on confirmation. Uncomment to enable.
-- CREATE TRIGGER trg_on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- CREATE TRIGGER trg_on_auth_email_confirmed AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmed();

-- =============================================================================
-- End of schema. Next: 02_auth_users.sql
-- =============================================================================
