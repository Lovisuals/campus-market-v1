-- Security & Auth Tables

-- OTP Sessions table for phone verification
CREATE TABLE IF NOT EXISTS otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  device_hash VARCHAR(64) NOT NULL,
  ip_hash VARCHAR(64) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, device_hash, used)
);

CREATE INDEX IF NOT EXISTS idx_otp_user_device ON otp_sessions(user_id, device_hash, used);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_sessions(expires_at);

-- Enable RLS for OTP sessions
ALTER TABLE otp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own OTP sessions"
  ON otp_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage OTP sessions"
  ON otp_sessions FOR ALL
  USING (true);

-- Financial & Transaction Tables

-- Posts/Listings with approval workflow
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  campus TEXT,
  images TEXT[],
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'active', 'sold', 'rejected')),
  rejected_reason TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_seller_id ON posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_campus ON posts(campus);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved posts" ON posts FOR SELECT
  USING (status = 'approved' OR auth.uid() = seller_id OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Sellers can create posts" ON posts FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own posts" ON posts FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage posts" ON posts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Approval queue for admins
CREATE TABLE IF NOT EXISTS approval_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'awaiting_review' CHECK (status IN ('awaiting_review', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_approval_queue_post_id ON approval_queue(post_id);

ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all approvals" ON approval_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage approvals" ON approval_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  admin_fee DECIMAL(10, 2) NOT NULL,
  seller_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'escrow_held', 'completed', 'refunded', 'disputed')),
  payment_method TEXT NOT NULL,
  dispute_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  escrow_release_date TIMESTAMP,
  
  CHECK (seller_amount = amount - admin_fee)
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "System can create transactions" ON transactions FOR INSERT
  USING (true);

CREATE POLICY "System can update transactions" ON transactions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Escrow accounts
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  held_by TEXT NOT NULL,
  status TEXT DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  held_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  release_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_transaction_id ON escrow_accounts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_accounts(status);

ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all escrow" ON escrow_accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "System can manage escrow" ON escrow_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  reason TEXT NOT NULL,
  resolution TEXT,
  opened_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties and admins can view disputes" ON disputes FOR SELECT
  USING (auth.uid() = opened_by OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true) OR
         EXISTS (SELECT 1 FROM transactions WHERE id = transaction_id AND 
                (auth.uid() = buyer_id OR auth.uid() = seller_id)));

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'processing', 'completed', 'failed')),
  scheduled_for TIMESTAMP,
  processed_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own payouts" ON payouts FOR SELECT
  USING (auth.uid() = seller_id OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Messaging & Communication Tables

-- Chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CHECK (user1_id < user2_id)
);

CREATE INDEX IF NOT EXISTS idx_chats_user1 ON chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2 ON chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chats" ON chats FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chats" ON chats FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their chats" ON chats FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages with encryption support
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  iv TEXT,
  auth_tag TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages" ON messages FOR SELECT
  USING (auth.uid() IN (
    SELECT user1_id FROM chats WHERE id = chat_id UNION
    SELECT user2_id FROM chats WHERE id = chat_id
  ));

CREATE POLICY "Users can create messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their messages" ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Audit Logging

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
