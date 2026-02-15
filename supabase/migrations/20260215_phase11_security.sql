-- Phase 11: Security & Visibility Updates

-- 1. Update Listings for IP and Visibility
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'profile_only', 'flagged'));

-- 2. Ensure Phone is Unique in Users
ALTER TABLE public.users ADD CONSTRAINT unique_phone UNIQUE (phone);

-- 3. AI Usage Table - Extend for Post Moderation Logging
-- (Assuming ai_daily_usage already exists from Phase 9)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_daily_usage' AND column_name = 'action_type') THEN
        ALTER TABLE public.ai_daily_usage ADD COLUMN action_type VARCHAR(20) DEFAULT 'chat';
    END IF;
END $$;
