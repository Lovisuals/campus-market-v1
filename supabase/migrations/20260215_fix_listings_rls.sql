-- Fix Listings RLS to hide pending/hidden listings from public
DROP POLICY IF EXISTS "Public view listings" ON public.listings;

CREATE POLICY "Public view listings" 
ON public.listings FOR SELECT 
USING (
  status IN ('active', 'sold') 
  OR 
  (auth.uid() = seller_id) -- Login user can see their own pending listings
);
