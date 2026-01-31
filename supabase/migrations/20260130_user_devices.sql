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
