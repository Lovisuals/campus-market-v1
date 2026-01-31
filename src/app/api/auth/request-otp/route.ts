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
      .select('id, phone, phone_verified')
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
      ip
    );

    // Send OTP via SMS (using Twilio or similar)
    try {
      // TODO: Integrate with Twilio or other SMS provider
      // For now, log to console (DEVELOPMENT ONLY)
      console.log(`OTP for ${phoneValidation.normalized}: ${code}`);
      
      // In production, uncomment and configure:
      /*
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      await client.messages.create({
        body: `Your Campus Market verification code is: ${code}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneValidation.normalized
      });
      */
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
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
