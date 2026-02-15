-- Create AI Usage Logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    window_date DATE DEFAULT CURRENT_DATE NOT NULL,
    
    -- Usage Counts
    morning_count INT DEFAULT 0,   -- 5 AM - 12 PM
    afternoon_count INT DEFAULT 0, -- 12 PM - 6 PM
    evening_count INT DEFAULT 0,   -- 6 PM - 5 AM
    
    last_query_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per day
    UNIQUE(user_id, window_date)
);

-- RLS Policies
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" 
ON ai_usage_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Only service role can update usage (via API)
