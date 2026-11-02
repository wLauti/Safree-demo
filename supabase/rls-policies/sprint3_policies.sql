-- Sprint 3 RLS Policies

-- shipping_addresses: users manage their own
CREATE POLICY "Users manage own addresses"
  ON shipping_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- shipping_rates: public read, admin write
CREATE POLICY "Anyone can read active shipping rates"
  ON shipping_rates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage shipping rates"
  ON shipping_rates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
