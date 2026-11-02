-- Sprint 7: Reviews, disputes, notifications

-- Notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dispute_response';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'welcome';

-- ── reviews: verified purchase, anonymity, store link, status ─
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS store_id             UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_anonymous         BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed'));

-- ── stores: rating aggregation + anti-abuse flag ─────────────
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rating_avg      NUMERIC(2,1) NOT NULL DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_count    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS low_rating_flag BOOLEAN NOT NULL DEFAULT FALSE;

-- ── profiles: push subscription + manipulation flag ──────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription          JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_manipulation_flag   BOOLEAN NOT NULL DEFAULT FALSE;

-- ── disputes: full dispute lifecycle columns ─────────────────
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS ref_number          TEXT UNIQUE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS reason_category     TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS description         TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_urls       TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS store_response      TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS store_evidence_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_type     TEXT CHECK (resolution_type IN ('full_refund', 'partial_refund', 'no_refund'));
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS refund_amount       NUMERIC(10,2);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_by         UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── Rating aggregation trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION recompute_store_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS trg_recompute_store_rating ON reviews;
CREATE TRIGGER trg_recompute_store_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION recompute_store_rating();

-- ── Review manipulation detection ────────────────────────────
-- Flags a user who reviews 5+ distinct stores within 24h.
CREATE OR REPLACE FUNCTION detect_review_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS trg_detect_review_manipulation ON reviews;
CREATE TRIGGER trg_detect_review_manipulation
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION detect_review_manipulation();
