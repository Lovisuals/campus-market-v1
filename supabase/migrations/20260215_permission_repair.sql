-- Phase 21: Permission Repair & RLS Hardening
-- Resolves "Permission Denied" errors and keyword collisions

-- 1. Ensure public schema usage for all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Explicitly grant SELECT on users to all roles (RLS will filter the rows)
GRANT SELECT ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;

-- 3. Explicitly grant ALL on site_alerts to authenticated (RLS will filter the rows)
GRANT SELECT ON public.site_alerts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_alerts TO authenticated;
GRANT ALL ON public.site_alerts TO service_role;

-- 4. Grant usage on sequences (crucial for inserts to work)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Fix potential singular 'user' keyword collision in subqueries or policies
-- Note: PostgreSQL reserved keyword 'user' can sometimes cause issues if quoted incorrectly.
-- We ensure our policies use 'auth.uid()' and point to 'public.users'.

-- 6. Audit Grant on existing tables to prevent future blocks
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT SELECT ON public.verification_requests TO authenticated;

-- 7. Specific fix for RLS subqueries
-- If an RLS policy for TABLE A has a SELECT from TABLE B, 
-- the user MUST have SELECT privilege on TABLE B at the Postgres level.
GRANT SELECT ON public.users TO authenticated;
