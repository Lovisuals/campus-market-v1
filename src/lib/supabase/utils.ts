export const hasEnvVars = () => {
  const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined && process.env.NEXT_PUBLIC_SUPABASE_URL !== "";
  const hasSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "";
  
  return hasSupabaseUrl && hasSupabaseAnonKey;
};