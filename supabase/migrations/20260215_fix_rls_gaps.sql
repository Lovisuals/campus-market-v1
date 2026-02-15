-- Phase 19: Fix Missing RLS Policies for Profile Completion & Security

-- 1. User Devices Policies
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own devices" ON public.user_devices;
CREATE POLICY "Users can insert own devices" 
ON public.user_devices FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own devices" ON public.user_devices;
CREATE POLICY "Users can view own devices" 
ON public.user_devices FOR SELECT 
USING (auth.uid() = user_id);

-- 2. OTP Sessions Policies
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own OTP sessions" ON public.otp_sessions;
CREATE POLICY "Users can view own OTP sessions" 
ON public.otp_sessions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own OTP sessions" ON public.otp_sessions;
CREATE POLICY "Users can insert own OTP sessions" 
ON public.otp_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own OTP sessions" ON public.otp_sessions;
CREATE POLICY "Users can update own OTP sessions" 
ON public.otp_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Trusted Devices Policies
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own trusted devices" ON public.trusted_devices;
CREATE POLICY "Users can manage own trusted devices" 
ON public.trusted_devices FOR ALL 
USING (auth.uid() = user_id);

-- 4. Audit Fix: Explicit Insert Policy for Users (Backup for trigger)
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
CREATE POLICY "Users can insert themselves" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. AI Usage Policies (Self-View)
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_daily_usage;
CREATE POLICY "Users can view own AI usage" 
ON public.ai_daily_usage FOR SELECT 
USING (auth.uid() = user_id);
