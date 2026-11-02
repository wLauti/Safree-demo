-- =============================================================================
-- Safree — Row-Level Security policies (OPTIONAL)
-- =============================================================================
-- These are the exact RLS policies from the Supabase project. They are OPTIONAL
-- off Supabase for two reasons:
--
--   1) The Next.js app does NOT depend on RLS. Every API route authorizes
--      server-side in lib/api/guard.ts (reads the role from the DB, validates
--      with Zod) and connects with a privileged DB role. RLS was a second line
--      of defense specific to Supabase's "client talks straight to Postgres"
--      model.
--   2) The policies call auth.uid() / auth.role() and target the Supabase roles
--      anon / authenticated / service_role, none of which exist on a vanilla
--      PostgreSQL server.
--
-- The compatibility shim below lets the policies be created and behave sensibly
-- IF your new backend sets the request's user id via a GUC
-- (SET LOCAL "request.jwt.claim.sub" = '<uuid>') per transaction — the same
-- convention Supabase/PostgREST uses. If your developer authorizes in the app
-- layer instead (recommended here), they can simply SKIP this entire file.
-- =============================================================================

-- --- Compatibility shim ------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon')
$$;

DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Enable RLS --------------------------------------------------------------
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_keys    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_qa          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prohibited_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content    ENABLE ROW LEVEL SECURITY;

-- --- Policies ----------------------------------------------------------------
CREATE POLICY audit_log_deny_insert_client ON public.audit_log FOR INSERT
  WITH CHECK (false);
CREATE POLICY audit_log_select_admin ON public.audit_log FOR SELECT
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
CREATE POLICY "Public read availability" ON public.availability FOR SELECT
  USING (true);
CREATE POLICY "Stores manage own availability" ON public.availability FOR ALL
  USING ((experience_id IN ( SELECT e.id FROM (experiences e JOIN stores s ON ((s.id = e.store_id))) WHERE (s.owner_id = auth.uid()))))
  WITH CHECK ((experience_id IN ( SELECT e.id FROM (experiences e JOIN stores s ON ((s.id = e.store_id))) WHERE (s.owner_id = auth.uid()))));
CREATE POLICY availability_manage_store ON public.availability FOR ALL
  USING ((experience_id IN ( SELECT e.id FROM (experiences e JOIN stores s ON ((s.id = e.store_id))) WHERE (s.owner_id = auth.uid()))));
CREATE POLICY availability_select_public ON public.availability FOR SELECT
  USING (true);
CREATE POLICY "Cotos see own experience bookings" ON public.bookings FOR SELECT
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY "Users see own bookings" ON public.bookings FOR SELECT
  USING ((auth.uid() = user_id));
CREATE POLICY bookings_insert_own ON public.bookings FOR INSERT
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY bookings_select_store ON public.bookings FOR SELECT
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY bookings_select_user ON public.bookings FOR SELECT
  USING ((user_id = auth.uid()));
CREATE POLICY bookings_update_store ON public.bookings FOR UPDATE
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY cart_delete_own ON public.cart_items FOR DELETE
  USING ((user_id = auth.uid()));
CREATE POLICY cart_insert_own ON public.cart_items FOR INSERT
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY cart_select_own ON public.cart_items FOR SELECT
  USING ((user_id = auth.uid()));
CREATE POLICY cart_update_own ON public.cart_items FOR UPDATE
  USING ((user_id = auth.uid()));
CREATE POLICY categories_select_public ON public.categories FOR SELECT
  USING (true);
CREATE POLICY "Mods manage flags" ON public.content_flags FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))));
CREATE POLICY "Users create flags" ON public.content_flags FOR INSERT
  WITH CHECK ((auth.uid() = reported_by));
CREATE POLICY "Users see own flags" ON public.content_flags FOR SELECT
  USING ((auth.uid() = reported_by));
CREATE POLICY "Admins manage all disputes" ON public.disputes FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))));
CREATE POLICY "Stores respond to disputes" ON public.disputes FOR UPDATE
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY "Stores see own disputes" ON public.disputes FOR SELECT
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY "Users open disputes" ON public.disputes FOR INSERT
  WITH CHECK ((auth.uid() = opened_by_user_id));
CREATE POLICY "Users see own disputes" ON public.disputes FOR SELECT
  USING ((auth.uid() = opened_by_user_id));
CREATE POLICY disputes_insert_auth ON public.disputes FOR INSERT
  WITH CHECK (((auth.uid() IS NOT NULL) AND (opened_by_user_id = auth.uid())));
CREATE POLICY disputes_select_parties ON public.disputes FOR SELECT
  USING (((opened_by_user_id = auth.uid()) OR (store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['moderator'::user_role, 'admin'::user_role])))))));
CREATE POLICY disputes_update_admin ON public.disputes FOR UPDATE
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
CREATE POLICY "Admins manage all experiences" ON public.experiences FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))));
CREATE POLICY "Public read active experiences" ON public.experiences FOR SELECT
  USING ((status = 'active'::listing_status));
CREATE POLICY "Stores manage own experiences" ON public.experiences FOR ALL
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))))
  WITH CHECK ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY experiences_delete_own ON public.experiences FOR DELETE
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY experiences_insert_own ON public.experiences FOR INSERT
  WITH CHECK ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY experiences_select_moderator ON public.experiences FOR SELECT
  USING (((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['moderator'::user_role, 'admin'::user_role]))))) AND (status = 'pending'::listing_status)));
CREATE POLICY experiences_select_public ON public.experiences FOR SELECT
  USING ((status = 'active'::listing_status));
CREATE POLICY experiences_select_store_own ON public.experiences FOR SELECT
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY experiences_update_own ON public.experiences FOR UPDATE
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY "Admins manage featured" ON public.featured_content FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
CREATE POLICY "Public read featured" ON public.featured_content FOR SELECT
  USING (true);
CREATE POLICY "Admins manage slides" ON public.hero_slides FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
CREATE POLICY "Public read active slides" ON public.hero_slides FOR SELECT
  USING ((is_active = true));
CREATE POLICY integration_keys_deny_all ON public.integration_keys FOR ALL
  USING (false);
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT
  USING ((user_id = auth.uid()));
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE
  USING ((user_id = auth.uid()));
CREATE POLICY orders_select_store ON public.orders FOR SELECT
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY orders_select_user ON public.orders FOR SELECT
  USING ((user_id = auth.uid()));
CREATE POLICY orders_update_store ON public.orders FOR UPDATE
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY qa_answer_store ON public.product_qa FOR UPDATE
  USING ((product_id IN ( SELECT p.id FROM (products p JOIN stores s ON ((s.id = p.store_id))) WHERE (s.owner_id = auth.uid()))));
CREATE POLICY qa_insert_auth ON public.product_qa FOR INSERT
  WITH CHECK ((auth.uid() = asked_by));
CREATE POLICY qa_select_public ON public.product_qa FOR SELECT
  USING (true);
CREATE POLICY specs_manage_store ON public.product_specs FOR ALL
  USING ((product_id IN ( SELECT p.id FROM (products p JOIN stores s ON ((s.id = p.store_id))) WHERE (s.owner_id = auth.uid()))));
CREATE POLICY specs_select_public ON public.product_specs FOR SELECT
  USING (true);
CREATE POLICY products_delete_own ON public.products FOR DELETE
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY products_insert_own ON public.products FOR INSERT
  WITH CHECK ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY products_select_moderator ON public.products FOR SELECT
  USING (((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['moderator'::user_role, 'admin'::user_role]))))) AND (status = 'pending'::listing_status)));
CREATE POLICY products_select_public ON public.products FOR SELECT
  USING ((status = 'active'::listing_status));
CREATE POLICY products_select_store_own ON public.products FOR SELECT
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY products_update_own ON public.products FOR UPDATE
  USING ((store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid()))));
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT
  USING ((auth.uid() = id));
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE
  USING ((auth.uid() = id));
CREATE POLICY "Admins manage keywords" ON public.prohibited_keywords FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
CREATE POLICY "Anyone read keywords" ON public.prohibited_keywords FOR SELECT
  USING (true);
CREATE POLICY "Mods manage all reviews" ON public.reviews FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))))));
CREATE POLICY "Public read active reviews" ON public.reviews FOR SELECT
  USING ((status = 'active'::text));
CREATE POLICY "Users insert own reviews" ON public.reviews FOR INSERT
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own reviews" ON public.reviews FOR UPDATE
  USING ((auth.uid() = user_id));
CREATE POLICY reviews_insert_auth ON public.reviews FOR INSERT
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY reviews_select_public ON public.reviews FOR SELECT
  USING (true);
CREATE POLICY saved_delete_own ON public.saved_items FOR DELETE
  USING ((user_id = auth.uid()));
CREATE POLICY saved_insert_own ON public.saved_items FOR INSERT
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY saved_select_own ON public.saved_items FOR SELECT
  USING ((user_id = auth.uid()));
CREATE POLICY "Users manage own addresses" ON public.shipping_addresses FOR ALL
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins manage shipping rates" ON public.shipping_rates FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
CREATE POLICY "Anyone can read active shipping rates" ON public.shipping_rates FOR SELECT
  USING ((is_active = true));
CREATE POLICY "Admins manage all species" ON public.species FOR ALL
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
CREATE POLICY "Public read approved species" ON public.species FOR SELECT
  USING (((is_approved = true) OR (auth.uid() IS NOT NULL)));
CREATE POLICY "Stores insert custom species" ON public.species FOR INSERT
  WITH CHECK (((is_custom = true) AND (created_by_store_id IN ( SELECT stores.id FROM stores WHERE (stores.owner_id = auth.uid())))));
CREATE POLICY species_select_public ON public.species FOR SELECT
  USING (true);
CREATE POLICY stores_delete_owner ON public.stores FOR DELETE
  USING ((auth.uid() = owner_id));
CREATE POLICY stores_insert_owner ON public.stores FOR INSERT
  WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY stores_select_public ON public.stores FOR SELECT
  USING ((is_active = true));
CREATE POLICY stores_update_owner ON public.stores FOR UPDATE
  USING ((auth.uid() = owner_id));

-- =============================================================================
-- End of RLS policies.
-- =============================================================================
