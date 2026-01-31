-- ========================================
-- APPLY ALL MIGRATIONS IN ORDER
-- Campus Market P2P Database Setup
-- ========================================
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Navigate to SQL Editor
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run" to execute
-- 6. Wait for "Success" message
-- 7. Verify with the test queries at the bottom
--
-- ⚠️ WARNING: This will modify your production database
-- ⚠️ Make sure to backup first if you have production data
-- ========================================

\echo 'Starting Campus Market P2P Database Setup...'

-- Check if we're in the right database
\echo 'Current database:'
SELECT current_database();

\echo ''
\echo '========================================';
\echo 'APPLYING MIGRATIONS';
\echo '========================================';

-- Migration 1: Phone Verified Column
\echo 'Migration 1: Adding phone_verified column...';
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added phone_verified column';
    ELSE
        RAISE NOTICE 'phone_verified column already exists';
    END IF;
END $$;

-- Migration 2: OTP and Security Tables
\echo 'Migration 2: Creating OTP and security tables...';

-- OTP Sessions Table
CREATE TABLE IF NOT EXISTS otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL CHECK (code ~ '^[0-9]{6}$'),
  device_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_sessions(expires_at);

-- Trusted Devices Table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_hash VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  ip_address INET,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_hash)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

\echo 'OTP and security tables created';

-- Migration 3: Enable RLS on Security Tables
\echo 'Migration 3: Enabling Row Level Security...';

ALTER TABLE otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- OTP Sessions Policies
DROP POLICY IF EXISTS "Users can view their own OTP sessions" ON otp_sessions;
CREATE POLICY "Users can view their own OTP sessions"
  ON otp_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own OTP sessions" ON otp_sessions;
CREATE POLICY "Users can insert their own OTP sessions"
  ON otp_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own OTP sessions" ON otp_sessions;
CREATE POLICY "Users can update their own OTP sessions"
  ON otp_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Trusted Devices Policies
DROP POLICY IF EXISTS "Users can view their own trusted devices" ON trusted_devices;
CREATE POLICY "Users can view their own trusted devices"
  ON trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trusted devices" ON trusted_devices;
CREATE POLICY "Users can insert their own trusted devices"
  ON trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trusted devices" ON trusted_devices;
CREATE POLICY "Users can update their own trusted devices"
  ON trusted_devices FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trusted devices" ON trusted_devices;
CREATE POLICY "Users can delete their own trusted devices"
  ON trusted_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Audit Logs Policies (Admin only)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

\echo 'RLS policies created for security tables';

-- Migration 4: Database Constraints
\echo 'Migration 4: Adding database constraints...';

-- Users table constraints
DO $$ 
BEGIN
    ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_email_format 
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_phone_format 
      CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Listings table constraints
DO $$ 
BEGIN
    ALTER TABLE listings ADD CONSTRAINT IF NOT EXISTS check_price_positive 
      CHECK (price IS NULL OR price > 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE listings ADD CONSTRAINT IF NOT EXISTS check_price_max 
      CHECK (price IS NULL OR price <= 100000000);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE listings ADD CONSTRAINT IF NOT EXISTS check_title_length 
      CHECK (char_length(title) >= 5 AND char_length(title) <= 200);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE listings ADD CONSTRAINT IF NOT EXISTS check_description_length 
      CHECK (char_length(description) >= 20 AND char_length(description) <= 5000);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Transactions table constraints
DO $$ 
BEGIN
    ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS check_base_price_positive 
      CHECK (base_price > 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS check_commission_non_negative 
      CHECK (commission_fee >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS check_no_self_transaction 
      CHECK (buyer_id != seller_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

\echo 'Database constraints added';

-- Migration 5: Enable RLS on Main Tables
\echo 'Migration 5: Enabling RLS on main tables...';

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Listings RLS Policies
DROP POLICY IF EXISTS "Anyone can view approved listings" ON listings;
CREATE POLICY "Anyone can view approved listings"
  ON listings FOR SELECT
  USING (is_approved = true OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can create listings" ON listings;
CREATE POLICY "Sellers can create listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update own listings" ON listings;
CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = seller_id);

-- Transactions RLS Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can create transactions" ON transactions;
CREATE POLICY "Buyers can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Transaction parties can update" ON transactions;
CREATE POLICY "Transaction parties can update"
  ON transactions FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages RLS Policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

\echo 'RLS enabled on all main tables';

\echo ''
\echo '========================================';
\echo 'VERIFICATION';
\echo '========================================';

-- Verify RLS is enabled
\echo 'Tables with RLS enabled:';
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Verify constraints exist
\echo ''
\echo 'Constraints on listings table:';
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'listings'::regclass
ORDER BY conname;

-- Verify new tables exist
\echo ''
\echo 'Security tables:';
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('otp_sessions', 'trusted_devices', 'audit_logs')
ORDER BY table_name;

\echo ''
\echo '========================================';
\echo 'MIGRATION COMPLETE!';
\echo '========================================';
\echo 'Next steps:';
\echo '1. Verify all tables show RLS enabled above';
\echo '2. Test signup flow with phone validation';
\echo '3. Test OTP email delivery';
\echo '4. Monitor Sentry for any errors';
\echo '========================================';
