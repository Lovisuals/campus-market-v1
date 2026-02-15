-- Phase 20: Site Alerts for Live Ticker

CREATE TABLE IF NOT EXISTS public.site_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    link_url TEXT,
    color_theme TEXT DEFAULT 'teal' CHECK (color_theme IN ('teal', 'red', 'gold', 'blue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_alerts ENABLE ROW LEVEL SECURITY;

-- Everyone can read active alerts
DROP POLICY IF EXISTS "Anyone can read active alerts" ON public.site_alerts;
CREATE POLICY "Anyone can read active alerts" 
ON public.site_alerts FOR SELECT 
USING (is_active = true);

-- Only admins can manage alerts
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.site_alerts;
CREATE POLICY "Admins can manage alerts" 
ON public.site_alerts FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Real-time setup
ALTER TABLE public.site_alerts REPLICA IDENTITY FULL;
-- Note: Remember to enable 'site_alerts' in Supabase Replication dashboard if not using self-hosted
