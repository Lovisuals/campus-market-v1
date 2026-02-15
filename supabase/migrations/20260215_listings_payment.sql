-- Update Listings Status Check Constraint to allow 'pending_payment'
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE public.listings 
ADD CONSTRAINT listings_status_check 
CHECK (status IN ('active', 'sold', 'inactive', 'pending_payment', 'hidden'));

-- Ensure is_anonymous column exists (in case it wasn't added previously or to be safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_anonymous') THEN
        ALTER TABLE public.listings ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'listing_type') THEN
        ALTER TABLE public.listings ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sell';
    END IF;
END $$;
