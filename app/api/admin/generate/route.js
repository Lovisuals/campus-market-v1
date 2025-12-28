import { NextResponse } from 'next/server';
// We use a safe relative path. 
// If your file is at lib/jwt.ts, this is the correct path:
import { generateMagicToken } from '../../../lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  console.log("API Start: Generate link requested");
  try {
    const body = await request.json();
    const { phone, school } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
    }

    const token = await generateMagicToken(phone, school || 'GENERAL');
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ 
      success: true,
      link: `${origin}/studio?key=${token}`,
      token 
    });
  } catch (error) {
    console.error('RUNTIME_ERROR:', error.message);
    return NextResponse.json({ 
      error: 'Execution Failed', 
      details: error.message 
    }, { status: 500 });
  }
}
