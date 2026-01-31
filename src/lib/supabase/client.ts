import { createBrowserClient } from '@supabase/ssr';

// 🛡️ The Sovereign Singleton Instance
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // If the client already exists, just return it. Don't make a new one.
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build-time';

  // Warn in development if using placeholder values
  if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    console.warn(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Using placeholder values. Please ensure these are set in your environment before deployment."
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseKey);
  
  return client;
}