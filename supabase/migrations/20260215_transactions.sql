-- Create Transactions table for Payments
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    reference VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL, -- Stored in Naira (e.g., 500.00)
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
    purpose VARCHAR(50) NOT NULL, -- 'anonymous_post_fee', 'boost_listing', etc.
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Only service role can insert/update (via API/Webhooks)
-- But for initialization, we might insert from server action authenticated as user
CREATE POLICY "Users can insert their own transactions" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);
