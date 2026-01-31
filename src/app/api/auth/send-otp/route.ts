import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@campusmarketp2p.com.ng';

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session/database (simplified for now - in production use database)
    // For now, we'll use Supabase's built-in email OTP instead
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: 'Campus Market P2P - Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #008069 0%, #006d59 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-code { font-size: 32px; font-weight: bold; color: #008069; text-align: center; padding: 20px; background: white; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📱 Campus Market P2P</h1>
                  <p>Your Verification Code</p>
                </div>
                <div class="content">
                  <p>Hello!</p>
                  <p>Your verification code is:</p>
                  <div class="otp-code">${otp}</div>
                  <p><strong>This code will expire in 5 minutes.</strong></p>
                  <p>If you didn't request this code, please ignore this email.</p>
                  <div class="footer">
                    <p>Campus Market P2P - Student Marketplace</p>
                    <p>This is an automated email, please do not reply.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to send email' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      otp: otp, // In production, don't return this - store in database
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
