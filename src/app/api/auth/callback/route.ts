import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/market';

  console.log('Callback received with code:', code);

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      console.log('Exchange result:', { hasData: !!data, error: error?.message });
      
      if (!error && data.session) {
        // Check if user has completed profile
        const { data: userData } = await supabase
          .from('users')
          .select('phone, phone_verified')
          .eq('id', data.session.user.id)
          .single();

        console.log('User data:', userData);

        // Redirect to complete-profile if phone not set
        if (!userData?.phone || !userData?.phone_verified) {
          return NextResponse.redirect(new URL('/complete-profile', request.url));
        }
        
        // Otherwise go to market
        return NextResponse.redirect(new URL(next, request.url));
      }
      
      console.error('Auth error:', error);
    } catch (err) {
      console.error('Callback error:', err);
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
