-- Sprint 6 RLS Policies

-- ── content_flags ────────────────────────────────────────────
-- Users can create flags
CREATE POLICY "Users create flags"
  ON content_flags FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Users see own flags
CREATE POLICY "Users see own flags"
  ON content_flags FOR SELECT
  USING (auth.uid() = reported_by);

-- Moderators + admins see all flags and update them
CREATE POLICY "Mods manage flags"
  ON content_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- ── prohibited_keywords (admin-only write, public read for filter) ──
CREATE POLICY "Anyone read keywords"
  ON prohibited_keywords FOR SELECT USING (true);

CREATE POLICY "Admins manage keywords"
  ON prohibited_keywords FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── hero_slides (public read active, admin write) ────────────
CREATE POLICY "Public read active slides"
  ON hero_slides FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage slides"
  ON hero_slides FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── featured_content (public read, admin write) ──────────────
CREATE POLICY "Public read featured"
  ON featured_content FOR SELECT USING (true);

CREATE POLICY "Admins manage featured"
  ON featured_content FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Note: integration_keys remains service-role only (no policies = no client access).
-- Credentials are read/written exclusively through server routes with the service client.
