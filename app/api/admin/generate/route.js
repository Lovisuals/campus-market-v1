import { NextResponse } from 'next/server';
import { generateMagicToken } from '../../../src/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  console.log("DEBUG: Request received");
  try {
    const body = await request.json();
    console.log("DEBUG: Body parsed", body);

    if (!body.phone) {
       return NextResponse.json({ error: "No phone number provided" }, { status: 400 });
    }

    const token = await generateMagicToken(body.phone, body.school || 'UNILAG');
    console.log("DEBUG: Token generated");

    const origin = new URL(request.url).origin;
    return NextResponse.json({ 
      success: true, 
      link: `${origin}/studio?key=${token}` 
    });
  } catch (error) {
    console.error("DEBUG: Crash caught", error.message);
    return NextResponse.json({ 
      error: "SERVER_CRASH", 
      message: error.message,
      stack: error.stack?.substring(0, 100) 
    }, { status: 500 });
  }
}
