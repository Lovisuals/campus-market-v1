import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOtp } from '@/lib/otp-service';
import { normalizePhoneNumber } from '@/lib/phone-validator';
import { otpRequestLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const requestOtpSchema = z.object({
  userId: z.string().uuid(),
  phoneNumber: z.string().min(10),
  deviceFingerprint: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestOtpSchema.parse(body);

    // Validate and normalize phone number
    const phoneValidation = normalizePhoneNumber(validated.phoneNumber, 'NG');
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error || 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `request-otp:${validated.userId}:${ip}`;
    const { success, reset } = await otpRequestLimit.limit(rateLimitKey);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many OTP requests. Please try again later.',
          retryAfter: new Date(reset).toISOString(),
        },
        { status: 429 }
      );
    }

    // Check if user exists
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone, phone_verified, email')
      .eq('id', validated.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if this is a new device
    const { data: trustedDevices } = await supabase
      .from('trusted_devices')
      .select('id')
      .eq('user_id', validated.userId)
      .eq('device_hash', validated.deviceFingerprint)
      .limit(1);

    const isNewDevice = !trustedDevices || trustedDevices.length === 0;

    // Only require OTP for new devices or unverified phones
    if (!isNewDevice && user.phone_verified) {
      return NextResponse.json({
        success: true,
        message: 'Device recognized, no OTP required',
        requiresOtp: false,
      });
    }

    // Generate OTP
    const { code, expiresIn } = await generateOtp(
      validated.userId,
      validated.deviceFingerprint,
      ip,
      supabase
    );

    // Send OTP via Resend email
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@campusmarketp2p.com.ng';

      if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
        console.log(`OTP for ${phoneValidation.normalized}: ${code}`);
      } else {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: user.email || validated.userId,
            subject: 'Campus Market - Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your Verification Code</h2>
                <p>Your Campus Market verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                  ${code}
                </div>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Resend API error:', data);
        }
      }

      // Also log for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`OTP for ${phoneValidation.normalized}: ${code}`);
      }
    } catch (smsError) {
      console.error('Failed to send OTP:', smsError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn,
      requiresOtp: true,
      // Include code in response for development only
      ...(process.env.NODE_ENV === 'development' && { code }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('OTP request error:', error);
    return NextResponse.json(
      { error: 'Failed to request OTP' },
      { status: 500 }
    );
  }
}
