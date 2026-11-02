-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- stores
-- ============================================================
CREATE POLICY "stores_select_public" ON stores
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "stores_insert_owner" ON stores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_update_owner" ON stores
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "stores_delete_owner" ON stores
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================================
-- categories (public read)
-- ============================================================
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT USING (TRUE);

-- ============================================================
-- species (public read)
-- ============================================================
CREATE POLICY "species_select_public" ON species
  FOR SELECT USING (TRUE);

-- ============================================================
-- products
-- ============================================================
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (status = 'active');

CREATE POLICY "products_select_store_own" ON products
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_select_moderator" ON products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    AND status = 'pending'
  );

CREATE POLICY "products_insert_own" ON products
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_update_own" ON products
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_delete_own" ON products
  FOR DELETE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- ============================================================
-- experiences (same pattern as products)
-- ============================================================
CREATE POLICY "experiences_select_public" ON experiences
  FOR SELECT USING (status = 'active');

CREATE POLICY "experiences_select_store_own" ON experiences
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "experiences_select_moderator" ON experiences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    AND status = 'pending'
  );

CREATE POLICY "experiences_insert_own" ON experiences
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "experiences_update_own" ON experiences
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "experiences_delete_own" ON experiences
  FOR DELETE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- ============================================================
-- availability
-- ============================================================
CREATE POLICY "availability_select_public" ON availability
  FOR SELECT USING (TRUE);

CREATE POLICY "availability_manage_store" ON availability
  FOR ALL USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      JOIN stores s ON s.id = e.store_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- ============================================================
-- cart_items
-- ============================================================
CREATE POLICY "cart_select_own" ON cart_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cart_insert_own" ON cart_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cart_update_own" ON cart_items
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cart_delete_own" ON cart_items
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- orders
-- ============================================================
CREATE POLICY "orders_select_user" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_select_store" ON orders
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "orders_update_store" ON orders
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- ============================================================
-- bookings
-- ============================================================
CREATE POLICY "bookings_select_user" ON bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "bookings_select_store" ON bookings
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "bookings_insert_own" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "bookings_update_store" ON bookings
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- ============================================================
-- disputes
-- ============================================================
CREATE POLICY "disputes_select_parties" ON disputes
  FOR SELECT USING (
    opened_by_user_id = auth.uid()
    OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
  );

CREATE POLICY "disputes_insert_auth" ON disputes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND opened_by_user_id = auth.uid());

-- Admins only update disputes (resolution)
CREATE POLICY "disputes_update_admin" ON disputes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- reviews
-- ============================================================
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "reviews_insert_auth" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- integration_keys (admin service role only — deny all direct access)
-- ============================================================
CREATE POLICY "integration_keys_deny_all" ON integration_keys
  FOR ALL USING (FALSE);

-- ============================================================
-- audit_log
-- ============================================================
CREATE POLICY "audit_log_deny_insert_client" ON audit_log
  FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- notifications
-- ============================================================
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
