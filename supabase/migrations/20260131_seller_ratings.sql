-- Seller ratings and reviews system

CREATE TABLE IF NOT EXISTS seller_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT CHECK (length(review) >= 10 AND length(review) <= 1000),
  response TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transaction_id)
);

CREATE INDEX idx_seller_ratings_seller ON seller_ratings(seller_id);
CREATE INDEX idx_seller_ratings_buyer ON seller_ratings(buyer_id);
CREATE INDEX idx_seller_ratings_transaction ON seller_ratings(transaction_id);
CREATE INDEX idx_seller_ratings_created_at ON seller_ratings(created_at DESC);

-- Create view for seller statistics
CREATE OR REPLACE VIEW seller_stats AS
SELECT 
  seller_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating), 2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
  MAX(created_at) as last_review_date
FROM seller_ratings
GROUP BY seller_id;

-- Add rating badge to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_badge VARCHAR(20);

-- Function to update rating badge
CREATE OR REPLACE FUNCTION update_rating_badge()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INT;
BEGIN
  SELECT average_rating, total_reviews 
  INTO avg_rating, review_count
  FROM seller_stats 
  WHERE seller_id = NEW.seller_id;

  IF review_count >= 50 AND avg_rating >= 4.8 THEN
    UPDATE users SET rating_badge = 'platinum' WHERE id = NEW.seller_id;
  ELSIF review_count >= 25 AND avg_rating >= 4.5 THEN
    UPDATE users SET rating_badge = 'gold' WHERE id = NEW.seller_id;
  ELSIF review_count >= 10 AND avg_rating >= 4.0 THEN
    UPDATE users SET rating_badge = 'silver' WHERE id = NEW.seller_id;
  ELSIF review_count >= 5 AND avg_rating >= 3.5 THEN
    UPDATE users SET rating_badge = 'bronze' WHERE id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rating_badge_update ON seller_ratings;
CREATE TRIGGER rating_badge_update
  AFTER INSERT OR UPDATE ON seller_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_rating_badge();

-- RLS Policies
ALTER TABLE seller_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON seller_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Buyers can create ratings for their completed transactions" ON seller_ratings
  FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid() AND
    transaction_id IN (
      SELECT id FROM transactions 
      WHERE buyer_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Buyers can update their own ratings" ON seller_ratings
  FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can respond to their ratings" ON seller_ratings
  FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (
    seller_id = auth.uid() AND
    response IS NOT NULL AND
    (OLD.response IS NULL OR OLD.response = response)
  );
