-- product_specs: public read, store manages own
CREATE POLICY "specs_select_public" ON product_specs FOR SELECT USING (TRUE);
CREATE POLICY "specs_manage_store" ON product_specs FOR ALL USING (
  product_id IN (
    SELECT p.id FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE s.owner_id = auth.uid()
  )
);

-- product_qa: public read, auth users ask, store answers
CREATE POLICY "qa_select_public" ON product_qa FOR SELECT USING (TRUE);
CREATE POLICY "qa_insert_auth" ON product_qa FOR INSERT WITH CHECK (auth.uid() = asked_by);
CREATE POLICY "qa_answer_store" ON product_qa FOR UPDATE USING (
  product_id IN (
    SELECT p.id FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE s.owner_id = auth.uid()
  )
);

-- saved_items: users manage own
CREATE POLICY "saved_select_own" ON saved_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved_insert_own" ON saved_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete_own" ON saved_items FOR DELETE USING (user_id = auth.uid());
