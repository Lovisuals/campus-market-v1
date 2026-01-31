# Quick Migration Guide - user_devices Table

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Click on your project: **vimovhpweucvperwhydzi**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

## Step 2: Copy and Paste This SQL

```sql
-- Create user_devices table for IP tracking and device fingerprinting
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64) NOT NULL,
  phone VARCHAR(20),
  device_hash VARCHAR(64),
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_ip_hash ON user_devices(ip_hash);
CREATE INDEX IF NOT EXISTS idx_user_devices_phone ON user_devices(phone);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own devices
DROP POLICY IF EXISTS "Users can view own devices" ON user_devices;
CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own devices
DROP POLICY IF EXISTS "Users can insert own devices" ON user_devices;
CREATE POLICY "Users can insert own devices"
  ON user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own devices
DROP POLICY IF EXISTS "Users can update own devices" ON user_devices;
CREATE POLICY "Users can update own devices"
  ON user_devices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admin can view all devices
DROP POLICY IF EXISTS "Admin can view all devices" ON user_devices;
CREATE POLICY "Admin can view all devices"
  ON user_devices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );
```

## Step 3: Run the Query

1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for execution
3. You should see: **"Success. No rows returned"**

## Step 4: Verify the Table

Run this verification query:

```sql
-- Check if table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_devices'
ORDER BY ordinal_position;
```

Expected output:
```
column_name    | data_type                   | is_nullable
---------------|----------------------------|-------------
id             | uuid                        | NO
user_id        | uuid                        | NO
ip_hash        | character varying          | NO
phone          | character varying          | YES
device_hash    | character varying          | YES
last_used_at   | timestamp without time zone| YES
created_at     | timestamp without time zone| YES
```

## Step 5: Test the Table

```sql
-- This should return empty (no errors)
SELECT * FROM user_devices LIMIT 1;
```

## What This Table Does

The `user_devices` table tracks:
- **user_id**: Which user owns this device
- **ip_hash**: Hashed IP address for security
- **phone**: User's phone number (for quick lookup)
- **device_hash**: Hashed browser fingerprint
- **last_used_at**: When this device was last used
- **created_at**: When this device was first registered

This enables:
- IP-based security monitoring
- Device tracking for fraud prevention
- Multi-device login management
- Security audits

## If You Get Errors

**Error: "relation 'users' does not exist"**
- The main users table is missing
- Run the complete-schema.sql migration first

**Error: "permission denied"**
- You need admin access to the database
- Contact your Supabase project admin

**Error: "policy already exists"**
- Safe to ignore - the `DROP POLICY IF EXISTS` handles this
- Rerun the entire script

## Done!

After successful migration, the complete-profile page will automatically start storing device tracking data when users complete their profile.
