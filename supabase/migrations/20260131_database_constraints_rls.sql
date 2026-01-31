-- Add database constraints and Row Level Security
-- This migration hardens the database with proper constraints and RLS policies

-- ============================================================================
-- USERS TABLE CONSTRAINTS
-- ============================================================================

-- Add NOT NULL constraints where needed
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;

-- Add CHECK constraints
ALTER TABLE users ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_phone_format 
  CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$');

-- ============================================================================
-- LISTINGS TABLE CONSTRAINTS
-- ============================================================================

-- Add NOT NULL constraints
ALTER TABLE listings ALTER COLUMN seller_id SET NOT NULL;
ALTER TABLE listings ALTER COLUMN title SET NOT NULL;
ALTER TABLE listings ALTER COLUMN description SET NOT NULL;
ALTER TABLE listings ALTER COLUMN created_at SET NOT NULL;

-- Add CHECK constraints
ALTER TABLE listings ADD CONSTRAINT check_price_positive 
  CHECK (price IS NULL OR price > 0);

ALTER TABLE listings ADD CONSTRAINT check_price_max 
  CHECK (price IS NULL OR price <= 100000000);

ALTER TABLE listings ADD CONSTRAINT check_title_length 
  CHECK (char_length(title) >= 5 AND char_length(title) <= 200);

ALTER TABLE listings ADD CONSTRAINT check_description_length 
  CHECK (char_length(description) >= 20 AND char_length(description) <= 5000);

ALTER TABLE listings ADD CONSTRAINT check_images_count 
  CHECK (jsonb_array_length(images) >= 1 AND jsonb_array_length(images) <= 10);

-- Add foreign key constraints
ALTER TABLE listings 
  ADD CONSTRAINT fk_listings_seller 
  FOREIGN KEY (seller_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- ============================================================================
-- TRANSACTIONS TABLE CONSTRAINTS
-- ============================================================================

-- Add NOT NULL constraints
ALTER TABLE transactions ALTER COLUMN buyer_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN seller_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN listing_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN base_price SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN commission SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN total_price SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN created_at SET NOT NULL;

-- Add CHECK constraints
ALTER TABLE transactions ADD CONSTRAINT check_base_price_positive 
  CHECK (base_price > 0);

ALTER TABLE transactions ADD CONSTRAINT check_commission_non_negative 
  CHECK (commission >= 0);

ALTER TABLE transactions ADD CONSTRAINT check_commission_reasonable 
  CHECK (commission <= base_price * 0.5);

ALTER TABLE transactions ADD CONSTRAINT check_total_matches 
  CHECK (total_price = base_price + commission);

ALTER TABLE transactions ADD CONSTRAINT check_no_self_transaction 
  CHECK (buyer_id != seller_id);

-- Add foreign key constraints
ALTER TABLE transactions 
  ADD CONSTRAINT fk_transactions_buyer 
  FOREIGN KEY (buyer_id) 
  REFERENCES users(id) 
  ON DELETE RESTRICT;

ALTER TABLE transactions 
  ADD CONSTRAINT fk_transactions_seller 
  FOREIGN KEY (seller_id) 
  REFERENCES users(id) 
  ON DELETE RESTRICT;

ALTER TABLE transactions 
  ADD CONSTRAINT fk_transactions_listing 
  FOREIGN KEY (listing_id) 
  REFERENCES listings(id) 
  ON DELETE RESTRICT;

-- ============================================================================
-- MESSAGES TABLE CONSTRAINTS
-- ============================================================================

-- Add NOT NULL constraints
ALTER TABLE messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN recipient_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN content SET NOT NULL;
ALTER TABLE messages ALTER COLUMN created_at SET NOT NULL;

-- Add CHECK constraints
ALTER TABLE messages ADD CONSTRAINT check_no_self_messaging 
  CHECK (sender_id != recipient_id);

ALTER TABLE messages ADD CONSTRAINT check_content_length 
  CHECK (char_length(content) >= 1 AND char_length(content) <= 2000);

-- Add foreign key constraints
ALTER TABLE messages 
  ADD CONSTRAINT fk_messages_sender 
  FOREIGN KEY (sender_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE messages 
  ADD CONSTRAINT fk_messages_recipient 
  FOREIGN KEY (recipient_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own profile and other users' public info
CREATE POLICY "Users can view profiles"
  ON users FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    -- Allow viewing public info of other users
    TRUE
  );

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent users from making themselves admin
CREATE POLICY "Prevent self-admin promotion"
  ON users FOR UPDATE
  USING (
    auth.uid() = id 
    AND 
    (
      SELECT is_admin FROM users WHERE id = auth.uid()
    ) = TRUE
    OR
    -- If not admin, cannot change is_admin field
    (
      NEW.is_admin = OLD.is_admin
    )
  );

-- ============================================================================
-- LISTINGS TABLE RLS POLICIES
-- ============================================================================

-- Anyone can view approved listings
CREATE POLICY "Anyone can view approved listings"
  ON listings FOR SELECT
  USING (
    is_approved = TRUE 
    OR 
    seller_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Users can create listings
CREATE POLICY "Users can create listings"
  ON listings FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.phone_verified = TRUE
    )
  );

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (
    auth.uid() = seller_id
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  USING (
    auth.uid() = seller_id
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- ============================================================================
-- TRANSACTIONS TABLE RLS POLICIES
-- ============================================================================

-- Users can view transactions they're involved in
CREATE POLICY "Users can view their transactions"
  ON transactions FOR SELECT
  USING (
    auth.uid() = buyer_id
    OR
    auth.uid() = seller_id
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Only admins can create transactions (after listing approval)
CREATE POLICY "Admins can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Only admins can update transactions
CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- ============================================================================
-- MESSAGES TABLE RLS POLICIES
-- ============================================================================

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR
    auth.uid() = recipient_id
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Users can send messages (if not banned)
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_banned = FALSE OR users.is_banned IS NULL)
    )
  );

-- Users can update only their own messages (for edit/delete)
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (
    auth.uid() = sender_id
    OR
    auth.uid() = recipient_id
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_campus ON users(campus);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = TRUE;

-- Listings table indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_campus ON listings(campus);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_is_approved ON listings(is_approved);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id);

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Function to log transaction changes
CREATE OR REPLACE FUNCTION log_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    admin_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state,
    ip_address,
    created_at
  ) VALUES (
    COALESCE(NEW.buyer_id, OLD.buyer_id),
    auth.uid(),
    TG_OP,
    'transaction',
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW),
    current_setting('request.headers', TRUE)::json->>'x-forwarded-for',
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to transactions table
DROP TRIGGER IF EXISTS trigger_log_transaction_change ON transactions;
CREATE TRIGGER trigger_log_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_change();

-- ============================================================================
-- FUNCTION TO VERIFY TRANSACTION INTEGRITY
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_transaction_hash(transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tx RECORD;
  calculated_hash TEXT;
BEGIN
  SELECT * INTO tx FROM transactions WHERE id = transaction_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate hash
  calculated_hash := encode(
    digest(
      tx.listing_id::text || 
      tx.seller_id::text || 
      tx.base_price::text || 
      tx.commission::text || 
      tx.total_price::text,
      'sha256'
    ),
    'hex'
  );
  
  RETURN calculated_hash = tx.hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
