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
  phone_verified = true,
  updated_at = NOW()
WHERE email = 'mail.lovisuals@gmail.com';

-- Option 2: If user doesn't exist in users table yet, insert them
INSERT INTO users (id, email, full_name, campus, is_admin, phone_verified)
VALUES (
  '6bc89d9b-1f32-4164-8dff-a89a05442b52',
  'mail.lovisuals@gmail.com',
  'Campus Market Admin',
  'Admin Campus',
  true,
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  is_admin = true,
  phone_verified = true;

-- Verify admin was created
SELECT 
  id,
  email,
  full_name,
  is_admin,
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
