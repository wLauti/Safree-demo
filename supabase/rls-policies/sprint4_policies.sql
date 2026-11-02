-- Sprint 4 RLS Policies

-- ── experiences ──────────────────────────────────────────────
-- Public can read active experiences
CREATE POLICY "Public read active experiences"
  ON experiences FOR SELECT
  USING (status = 'active');

-- Stores (Cotos) can CRUD their own
CREATE POLICY "Stores manage own experiences"
  ON experiences FOR ALL
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Admins/moderators can manage all
CREATE POLICY "Admins manage all experiences"
  ON experiences FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ── availability ─────────────────────────────────────────────
-- Public can read availability
CREATE POLICY "Public read availability"
  ON availability FOR SELECT
  USING (true);

-- Store owners manage their experience availability
CREATE POLICY "Stores manage own availability"
  ON availability FOR ALL
  USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      JOIN stores s ON s.id = e.store_id
      WHERE s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    experience_id IN (
      SELECT e.id FROM experiences e
      JOIN stores s ON s.id = e.store_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- ── species ──────────────────────────────────────────────────
-- Anyone can read approved species
CREATE POLICY "Public read approved species"
  ON species FOR SELECT
  USING (is_approved = true OR auth.uid() IS NOT NULL);

-- Stores can insert custom species
CREATE POLICY "Stores insert custom species"
  ON species FOR INSERT
  WITH CHECK (
    is_custom = true
    AND created_by_store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Admins manage all species
CREATE POLICY "Admins manage all species"
  ON species FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
