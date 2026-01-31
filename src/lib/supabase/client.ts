import { createBrowserClient } from '@supabase/ssr';

// 🛡️ The Sovereign Singleton Instance
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // If the client already exists, just return it. Don't make a new one.
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Please ensure these are set in your environment before deployment."
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseKey);
  
  return client;
}