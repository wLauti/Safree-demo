-- RPC: increment product views (called by /api/products/[id]/views)
-- Uses security definer so it can update any row without bypassing RLS elsewhere
CREATE OR REPLACE FUNCTION increment_product_views(product_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products
  SET views = views + 1
  WHERE id = product_id;
$$;

-- Grant execute to all authenticated and anonymous users
GRANT EXECUTE ON FUNCTION increment_product_views(uuid) TO anon, authenticated;
