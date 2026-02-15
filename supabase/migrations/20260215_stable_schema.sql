-- ==========================================
-- 0. EXTENSIONS & SETUP
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. BASE SCHEMA (Users, Listings, Verification Requests)
-- ==========================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  campus TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  student_id_image_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  vouch_count INTEGER DEFAULT 0,
  rating_badge VARCHAR(20),
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  banned_until TIMESTAMP,
  banned_at TIMESTAMP,
  strike_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON public.users(phone_verified);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  campus TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_campus ON public.listings(campus);
CREATE INDEX IF NOT EXISTS idx_listings_is_verified ON public.listings(is_verified);

-- Verification Requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  seller_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_seller_id ON public.verification_requests(seller_id);

-- ==========================================
-- 2. NOTIFICATIONS & DEVICES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient);

CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64) NOT NULL,
  phone VARCHAR(20),
  device_hash VARCHAR(64),
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_ip_hash ON public.user_devices(ip_hash);

-- ==========================================
-- 3. SECURITY & OTP
-- ==========================================

CREATE TABLE IF NOT EXISTS public.otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  device_hash VARCHAR(64) NOT NULL,
  ip_hash VARCHAR(64) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_code_format CHECK (code ~ '^\d{6}$'),
  CONSTRAINT check_attempts_positive CHECK (attempts >= 0),
  CONSTRAINT check_expires_future CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_otp_sessions_user_id ON public.otp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_expires_at ON public.otp_sessions(expires_at);

CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_hash VARCHAR(64) NOT NULL,
  ip_hash VARCHAR(64) NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_device UNIQUE (user_id, device_hash)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ==========================================
-- 4. FEATURES (Ratings, Moderation, Escrow, Vouch)
-- ==========================================

-- Seller Ratings
CREATE TABLE IF NOT EXISTS public.seller_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL, 
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT CHECK (length(review) >= 10 AND length(review) <= 1000),
  response TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_ratings_seller ON public.seller_ratings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_ratings_buyer ON public.seller_ratings(buyer_id);

-- Seller Stats View
CREATE OR REPLACE VIEW public.seller_stats AS
SELECT 
  seller_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating), 2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
  MAX(created_at) as last_review_date
FROM public.seller_ratings
GROUP BY seller_id;

-- Moderation Queue
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('listing', 'message', 'review', 'profile')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_flagged BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_status ON public.moderation_queue(status);

-- Banned Words
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) UNIQUE NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  action VARCHAR(20) DEFAULT 'flag',
  added_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Reports
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.user_reports(reporter_id);

-- Transactions (Core for Escrow)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE, -- Assuming listings table
  amount DECIMAL(10, 2) NOT NULL,
  admin_fee DECIMAL(10, 2) NOT NULL,
  seller_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'escrow_held', 'completed', 'refunded', 'disputed')),
  payment_method TEXT NOT NULL,
  dispute_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  escrow_release_date TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Escrow Holds
CREATE TABLE IF NOT EXISTS public.escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'held',
  payment_reference VARCHAR(255),
  held_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  release_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_transaction ON public.escrow_holds(transaction_id);

-- Campus Vouches
CREATE TABLE IF NOT EXISTS public.vouches (
  voucher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (voucher_id, receiver_id),
  CONSTRAINT different_users CHECK (voucher_id != receiver_id)
);

-- ==========================================
-- 5. FUNCTION & TRIGGERS (Idempotent)
-- ==========================================

-- Sync phone verified
CREATE OR REPLACE FUNCTION public.sync_phone_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET phone_verified = (NEW.phone_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_phone_verified_trigger ON auth.users;
CREATE TRIGGER sync_phone_verified_trigger
  AFTER INSERT OR UPDATE OF phone_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_phone_verified();

-- Handle new user creation (v2)
CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, campus, phone, is_admin, phone_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'campus', ''),
    NEW.raw_user_meta_data->>'phone',
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
CREATE TRIGGER on_auth_user_created_v2
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_v2();

-- Update vouch count
CREATE OR REPLACE FUNCTION public.update_vouch_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.users 
    SET vouch_count = vouch_count + 1 
    WHERE id = NEW.receiver_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.users 
    SET vouch_count = vouch_count - 1 
    WHERE id = OLD.receiver_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vouch_change ON public.vouches;
CREATE TRIGGER on_vouch_change
AFTER INSERT OR DELETE ON public.vouches
FOR EACH ROW EXECUTE FUNCTION public.update_vouch_count();

-- ==========================================
-- 6. RLS POLICIES (Strictly Idempotent)
-- ==========================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS "Public view users" ON public.users;
CREATE POLICY "Public view users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.users;
CREATE POLICY "Users insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings
DROP POLICY IF EXISTS "Public view listings" ON public.listings;
CREATE POLICY "Public view listings" ON public.listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sellers create listings" ON public.listings;
CREATE POLICY "Sellers create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers update own listings" ON public.listings;
CREATE POLICY "Sellers update own listings" ON public.listings FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers delete own listings" ON public.listings;
CREATE POLICY "Sellers delete own listings" ON public.listings FOR DELETE USING (auth.uid() = seller_id);

-- Verification Requests
DROP POLICY IF EXISTS "Sellers view own requests" ON public.verification_requests;
CREATE POLICY "Sellers view own requests" ON public.verification_requests FOR SELECT USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Sellers create requests" ON public.verification_requests;
CREATE POLICY "Sellers create requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Vouches
DROP POLICY IF EXISTS "Public read vouches" ON public.vouches;
CREATE POLICY "Public read vouches" ON public.vouches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Verified users vouch" ON public.vouches;
CREATE POLICY "Verified users vouch" ON public.vouches FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = voucher_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND verification_status = 'verified'));

-- Storage
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('verification-documents', 'verification-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users upload own ID" ON storage.objects;
CREATE POLICY "Users upload own ID" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users view own ID" ON storage.objects;
CREATE POLICY "Users view own ID" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Admins view all IDs" ON storage.objects;
CREATE POLICY "Admins view all IDs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-documents' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins manage IDs" ON storage.objects;
CREATE POLICY "Admins manage IDs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'verification-documents' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
