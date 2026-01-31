-- Content moderation system

CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('listing', 'message', 'review', 'profile')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_flagged BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moderation_status ON moderation_queue(status);
CREATE INDEX idx_moderation_severity ON moderation_queue(severity);
CREATE INDEX idx_moderation_content_type ON moderation_queue(content_type, content_id);
CREATE INDEX idx_moderation_created_at ON moderation_queue(created_at DESC);

-- Bad words/phrases for auto-flagging
CREATE TABLE IF NOT EXISTS banned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word VARCHAR(100) UNIQUE NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action VARCHAR(20) DEFAULT 'flag' CHECK (action IN ('flag', 'block', 'shadowban')),
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert common banned words
INSERT INTO banned_words (word, severity, action) VALUES
  ('scam', 'high', 'flag'),
  ('fraud', 'high', 'flag'),
  ('fake', 'medium', 'flag'),
  ('stolen', 'critical', 'block'),
  ('hack', 'high', 'flag'),
  ('cheat', 'medium', 'flag'),
  ('bitcoin', 'medium', 'flag'),
  ('get rich quick', 'high', 'flag'),
  ('ponzi', 'critical', 'block'),
  ('mlm', 'high', 'flag'),
  ('pyramid scheme', 'critical', 'block')
ON CONFLICT (word) DO NOTHING;

-- User reports
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reported_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'spam', 'inappropriate', 'fraud', 'harassment', 'fake_item', 
    'counterfeit', 'stolen', 'other'
  )),
  description TEXT NOT NULL CHECK (length(description) >= 20 AND length(description) <= 1000),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (reported_user_id IS NOT NULL) OR 
    (reported_listing_id IS NOT NULL) OR 
    (reported_message_id IS NOT NULL)
  )
);

CREATE INDEX idx_reports_reporter ON user_reports(reporter_id);
CREATE INDEX idx_reports_status ON user_reports(status);
CREATE INDEX idx_reports_created_at ON user_reports(created_at DESC);

-- User strikes and bans
CREATE TABLE IF NOT EXISTS user_strikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('warning', 'minor', 'major', 'critical')),
  issued_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_strikes_user ON user_strikes(user_id);
CREATE INDEX idx_strikes_created_at ON user_strikes(created_at DESC);

-- Add ban status to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS strike_count INT DEFAULT 0;

-- Function to auto-ban users with too many strikes
CREATE OR REPLACE FUNCTION check_user_strikes()
RETURNS TRIGGER AS $$
DECLARE
  total_strikes INT;
BEGIN
  SELECT COUNT(*) INTO total_strikes
  FROM user_strikes
  WHERE user_id = NEW.user_id 
    AND (expires_at IS NULL OR expires_at > NOW());

  UPDATE users SET strike_count = total_strikes WHERE id = NEW.user_id;

  IF total_strikes >= 3 THEN
    UPDATE users 
    SET 
      is_banned = true,
      ban_reason = 'Multiple policy violations',
      banned_at = NOW(),
      banned_until = NOW() + INTERVAL '30 days'
    WHERE id = NEW.user_id AND is_banned = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_strike_check ON user_strikes;
CREATE TRIGGER user_strike_check
  AFTER INSERT ON user_strikes
  FOR EACH ROW
  EXECUTE FUNCTION check_user_strikes();

-- RLS Policies
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to moderation" ON moderation_queue
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to reports" ON user_reports
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to strikes" ON user_strikes
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to banned words" ON banned_words
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Users can create reports
CREATE POLICY "Users can create reports" ON user_reports
  FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports" ON user_reports
  FOR SELECT
  USING (reporter_id = auth.uid());
