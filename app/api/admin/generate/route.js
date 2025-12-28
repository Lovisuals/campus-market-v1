import { NextResponse } from 'next/server';
import { generateMagicToken } from '../../../lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, school } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const token = await generateMagicToken(phone, school || 'UNILAG');
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ 
      success: true,
      link: `${origin}/studio?key=${token}`
    });
  } catch (error) {
    return NextResponse.json({ error: 'JWT_PROCESS_ERROR', details: error.message }, { status: 500 });
  }
}
