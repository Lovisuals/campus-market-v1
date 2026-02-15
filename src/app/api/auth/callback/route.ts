import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { checkIsAdmin } from '@/lib/admin';
import crypto from 'crypto';

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
        const user = data.session.user;
        const deviceHash = requestUrl.searchParams.get('device');

        // 1. Fetch user data
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, phone, is_admin, phone_verified')
          .eq('id', user.id)
          .single();

        // 2. Admin Recognition & Device Secret Logic
        const isAdmin = checkIsAdmin(userData?.email, userData?.phone, userData?.is_admin);

        let redirectSuffix = "";
        if (isAdmin && deviceHash) {
          const secret = crypto.randomBytes(32).toString('hex');

          // Register/Update device secret
          // Note: We'll use the IP from the request if possible, 
          // but for now we'll match on user_id + device_hash
          await supabase
            .from('user_devices')
            .upsert({
              user_id: user.id,
              device_hash: deviceHash,
              device_secret: secret,
              last_login: new Date().toISOString()
            }, { onConflict: 'user_id, device_hash' });

          redirectSuffix = `?setup_admin=${secret}`;
        }

        // 3. Normal Redirect Logic
        if (!userData?.phone || !userData?.phone_verified) {
          return NextResponse.redirect(new URL(`/complete-profile${redirectSuffix}`, request.url));
        }

        return NextResponse.redirect(new URL(`${next}${redirectSuffix}`, request.url));
      }

      console.error('Auth error:', error);
    } catch (err) {
      console.error('Callback error:', err);
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
