import { NextResponse } from 'next/server';
import { generateMagicToken } from '../../../lib/jwt';

// This is the most important line - it forces Vercel to create a Server Function
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, school } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    const token = await generateMagicToken(phone, school || 'UNILAG');
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ 
      success: true, 
      link: `${origin}/studio?key=${token}` 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}

// Keeping GET helps us debug if the route is even reachable
export async function GET() {
  return NextResponse.json({ status: "API is active and serving POST requests" });
}
