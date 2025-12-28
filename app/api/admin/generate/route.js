import { NextResponse } from 'next/server';
import { generateMagicToken } from '../../../lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  console.log("POST request received at /api/admin/generate");
  try {
    const body = await request.json();
    const { phone, school } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const token = await generateMagicToken(phone, school || 'UNILAG');
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ 
      success: true,
      link: `${origin}/studio?key=${token}`
    });
  } catch (error) {
    console.error("GENERATE_ERROR:", error);
    return NextResponse.json({ error: 'Internal Server Error', msg: error.message }, { status: 500 });
  }
}

// Add a GET handler just to test if the route is reachable at all
export async function GET() {
  return NextResponse.json({ message: "Generate endpoint is active. Use POST to generate a link." });
}
