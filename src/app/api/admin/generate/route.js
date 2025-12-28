import { NextResponse } from 'next/server';
import { generateMagicToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

    const token = await generateMagicToken(body.phone, body.school || 'UNILAG');
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ 
      success: true, 
      link: `${origin}/studio?key=${token}` 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "API is ready" });
}
