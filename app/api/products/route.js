import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// helper to initialize Supabase only when needed
const getSafeSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // This returns null during build instead of throwing a fatal error
    return null;
  }
  return createClient(url, key);
};

export async function GET() {
  try {
    const supabase = getSafeSupabase();
    
    // Safety check: if keys are missing (like during a build), return a safe error
    if (!supabase) {
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
