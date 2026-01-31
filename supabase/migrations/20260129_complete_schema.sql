-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  campus TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  campus TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  seller_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_campus ON listings(campus);
CREATE INDEX IF NOT EXISTS idx_listings_is_verified ON listings(is_verified);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_seller_id ON verification_requests(seller_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (public can read)
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for listings (public can read verified, sellers can manage own)
CREATE POLICY "Public can view listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Sellers can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own listings" ON listings FOR DELETE USING (auth.uid() = seller_id);
CREATE POLICY "Admins can delete any listing" ON listings FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- RLS Policies for verification_requests (sellers view own, admins view all)
CREATE POLICY "Sellers can view own requests" ON verification_requests FOR SELECT USING (
  auth.uid() = seller_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Sellers can create requests" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Admins can update requests" ON verification_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
