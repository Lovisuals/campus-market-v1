import { createBrowserClient } from '@supabase/ssr';

// 🛡️ The Sovereign Singleton Instance
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // If the client already exists, just return it. Don't make a new one.
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vimovhpweucvperwhyzi.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc";

  client = createBrowserClient(supabaseUrl, supabaseKey);
  
  return client;
}