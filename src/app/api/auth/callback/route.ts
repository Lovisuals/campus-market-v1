import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has completed profile
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('phone, phone_verified')
          .eq('id', user.id)
          .single();

        // Redirect to complete-profile if phone not set
        if (!userData?.phone || !userData?.phone_verified) {
          return NextResponse.redirect(new URL('/complete-profile', request.url));
        }
      }
      
      // Otherwise go to market
      return NextResponse.redirect(new URL('/market', request.url));
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
