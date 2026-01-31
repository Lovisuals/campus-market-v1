-- =====================================================
-- CREATE ADMIN USER SCRIPT
-- =====================================================
-- Run this script AFTER creating a user via Supabase Authentication
-- 
-- Steps:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Create a new user with email (e.g., admin@campusmarketp2p.com.ng)
-- 3. Copy the user's UUID
-- 4. Replace 'YOUR_USER_UUID_HERE' below with the actual UUID
-- 5. Run this script in SQL Editor
--
-- =====================================================

-- Option 1: Update existing auth user to admin
UPDATE users
SET 
  is_admin = true,
  is_verified = true,
  phone_verified = true,
  updated_at = NOW()
WHERE email = 'admin@campusmarketp2p.com.ng';

-- Option 2: If user doesn't exist in users table yet, insert them
-- (Replace 'YOUR_USER_UUID_HERE' with actual UUID from auth.users)
INSERT INTO users (id, email, full_name, campus, is_admin, is_verified, phone_verified)
VALUES (
  'YOUR_USER_UUID_HERE',  -- Get this from Authentication > Users
  'admin@campusmarketp2p.com.ng',
  'Campus Market Admin',
  'Admin Campus',
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  is_admin = true,
  is_verified = true,
  phone_verified = true;

-- Verify admin was created
SELECT 
  id,
  email,
  full_name,
  is_admin,
  is_verified,
  phone_verified,
  created_at
FROM users
WHERE is_admin = true;

-- =====================================================
-- ADMIN USER CREATED!
-- =====================================================
-- You can now login with this email at:
-- http://localhost:3000/login
-- 
-- Then access admin dashboard at:
-- http://localhost:3000/dashboard
-- =====================================================
