-- Refinement for Phase 5: Listings and Anonymity

-- Add support for "Buy Requests" vs "Sell Listings"
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sell' CHECK (listing_type IN ('sell', 'buy'));

-- Add support for Paid Anonymity
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_anonymous_allowed BOOLEAN DEFAULT FALSE;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Ensure RLS policies respect anonymity (Mock example)
-- If is_anonymous is true, public queries should NOT return the created_by user ID (or the frontend should mask it)
-- This is often handled at the API layer or via a separate view, but for now we enforce the column existence.

-- Add "School" column to listings if not present (for filtering by the new school list)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS school_id TEXT;
