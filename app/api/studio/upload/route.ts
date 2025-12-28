import { NextRequest, NextResponse } from 'next/server';
import { generateMagicToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic'; // Tells Vercel: "This is a Server, not a Static page"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, school } = body;

    if (!phone || !school) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    const token = await generateMagicToken(phone, school);
    const origin = new URL(req.url).origin;
    
    return NextResponse.json({ 
      link: `${origin}/studio?key=${token}`,
      token 
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error', details: err.message }, { status: 500 });
  }
}