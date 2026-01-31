-- Escrow system tables for secure payment handling

CREATE TABLE IF NOT EXISTS escrow_holds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
  payment_reference VARCHAR(255),
  held_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  release_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_escrow_transaction ON escrow_holds(transaction_id);
CREATE INDEX idx_escrow_status ON escrow_holds(status);

-- Function to create escrow hold when transaction is created
CREATE OR REPLACE FUNCTION create_escrow_hold()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO escrow_holds (transaction_id, amount, status)
  VALUES (NEW.id, NEW.amount, 'held');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_transaction_created ON transactions;
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.payment_method != 'cash')
  EXECUTE FUNCTION create_escrow_hold();

-- Function to release escrow when transaction is completed
CREATE OR REPLACE FUNCTION release_escrow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE escrow_holds
    SET 
      status = 'released',
      released_at = NOW(),
      release_method = 'buyer_confirmation',
      updated_at = NOW()
    WHERE transaction_id = NEW.id AND status = 'held';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_transaction_completed ON transactions;
CREATE TRIGGER on_transaction_completed
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION release_escrow();

-- RLS Policies
ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own escrow holds" ON escrow_holds
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all escrow holds" ON escrow_holds
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "System can create escrow holds" ON escrow_holds
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update escrow holds" ON escrow_holds
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
