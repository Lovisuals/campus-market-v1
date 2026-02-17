import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyOtp } from '@/lib/otp-service';
import { otpRequestLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d+$/, 'OTP must be 6 digits'),
  deviceFingerprint: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifyOtpSchema.parse(body);

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `verify-otp:${validated.userId}:${ip}`;
    const { success, reset } = await otpRequestLimit.limit(rateLimitKey);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many verification attempts. Please try again later.',
          retryAfter: new Date(reset).toISOString(),
        },
        { status: 429 }
      );
    }

    // Verify OTP
    const supabase = await createClient();
    const result = await verifyOtp(
      validated.userId,
      validated.code,
      validated.deviceFingerprint,
      ip,
      supabase
    );

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Update user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', validated.userId);

    if (updateError) {
      console.error('Failed to update user verification status:', updateError);
      return NextResponse.json(
        { error: 'Verification successful but failed to update status' },
        { status: 500 }
      );
    }

    // Store trusted device
    await supabase.from('trusted_devices').insert({
      user_id: validated.userId,
      device_hash: validated.deviceFingerprint,
      ip_hash: ip,
      last_used: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
