-- Sprint 7 RLS Policies

-- ── reviews ──────────────────────────────────────────────────
-- Public can read active reviews
CREATE POLICY "Public read active reviews"
  ON reviews FOR SELECT USING (status = 'active');

-- Users insert reviews only for their own completed transactions
-- (eligibility re-checked server-side; this guards the user_id binding)
CREATE POLICY "Users insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own reviews
CREATE POLICY "Users manage own reviews"
  ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Admins/mods manage all reviews (for removal)
CREATE POLICY "Mods manage all reviews"
  ON reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- ── disputes ─────────────────────────────────────────────────
-- Users see disputes they opened
CREATE POLICY "Users see own disputes"
  ON disputes FOR SELECT USING (auth.uid() = opened_by_user_id);

-- Users open disputes
CREATE POLICY "Users open disputes"
  ON disputes FOR INSERT
  WITH CHECK (auth.uid() = opened_by_user_id);

-- Stores see disputes involving their store
CREATE POLICY "Stores see own disputes"
  ON disputes FOR SELECT
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- Stores can update (respond to) their disputes
CREATE POLICY "Stores respond to disputes"
  ON disputes FOR UPDATE
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- Admins/mods manage all disputes
CREATE POLICY "Admins manage all disputes"
  ON disputes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
