import { NextResponse } from 'next/server';
import { generateMagicToken } from '../../../lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, school } = body;

    if (!phone || !school) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    const token = await generateMagicToken(phone, school);
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ 
      link: `${origin}/studio?key=${token}`,
      token 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
