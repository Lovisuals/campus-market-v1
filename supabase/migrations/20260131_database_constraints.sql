-- Enhanced database constraints for data integrity

-- Users table constraints
ALTER TABLE users 
  ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  ADD CONSTRAINT check_phone_format CHECK (phone IS NULL OR phone ~* '^(\+234|0)[789]\d{9}$'),
  ADD CONSTRAINT check_full_name_length CHECK (length(full_name) >= 2 AND length(full_name) <= 100);

-- Listings table constraints
ALTER TABLE listings
  ADD CONSTRAINT check_price_positive CHECK (price > 0),
  ADD CONSTRAINT check_price_reasonable CHECK (price <= 10000000),
  ADD CONSTRAINT check_title_length CHECK (length(title) >= 5 AND length(title) <= 200),
  ADD CONSTRAINT check_description_length CHECK (length(description) >= 20 AND length(description) <= 5000),
  ADD CONSTRAINT check_valid_status CHECK (status IN ('active', 'sold', 'pending', 'deleted'));

-- Add unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(lower(email));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_campus ON listings(campus);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);

-- Messages table constraints
ALTER TABLE messages
  ADD CONSTRAINT check_content_not_empty CHECK (length(trim(content)) > 0),
  ADD CONSTRAINT check_content_length CHECK (length(content) <= 2000);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Transactions table constraints
ALTER TABLE transactions
  ADD CONSTRAINT check_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT check_valid_transaction_status CHECK (status IN ('pending', 'completed', 'cancelled', 'disputed', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_listing ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- OTP sessions constraints
ALTER TABLE otp_sessions
  ADD CONSTRAINT check_otp_length CHECK (length(code) = 6),
  ADD CONSTRAINT check_otp_expires_future CHECK (expires_at > created_at);

CREATE INDEX IF NOT EXISTS idx_otp_user_code ON otp_sessions(user_id, code) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_sessions(expires_at) WHERE used = false;

-- User devices constraints  
ALTER TABLE user_devices
  ADD CONSTRAINT check_ip_hash_format CHECK (length(ip_hash) = 64),
  ADD CONSTRAINT check_device_hash_format CHECK (device_hash IS NULL OR length(device_hash) = 64);

CREATE INDEX IF NOT EXISTS idx_user_devices_lookup ON user_devices(user_id, device_hash, ip_hash);

-- Escrow accounts constraints
ALTER TABLE escrow_accounts
  ADD CONSTRAINT check_escrow_balance_non_negative CHECK (balance >= 0),
  ADD CONSTRAINT check_escrow_hold_non_negative CHECK (hold_amount >= 0);

-- Add cascading deletes
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;
ALTER TABLE listings ADD CONSTRAINT listings_seller_id_fkey 
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_devices DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;
ALTER TABLE user_devices ADD CONSTRAINT user_devices_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add audit trigger for sensitive changes
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, details, ip_address, created_at)
    VALUES (
      NEW.id,
      'user_update',
      jsonb_build_object(
        'old_email', OLD.email,
        'new_email', NEW.email,
        'old_phone', OLD.phone,
        'new_phone', NEW.phone,
        'old_phone_verified', OLD.phone_verified,
        'new_phone_verified', NEW.phone_verified
      ),
      NULL,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_changes_audit ON users;
CREATE TRIGGER user_changes_audit
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email 
    OR OLD.phone IS DISTINCT FROM NEW.phone
    OR OLD.phone_verified IS DISTINCT FROM NEW.phone_verified)
  EXECUTE FUNCTION log_user_changes();
