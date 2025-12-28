import { NextResponse } from 'next/server';
import { generateMagicToken } from '../../../src/lib/jwt';

export const dynamic = 'force-dynamic';

async function handle(request) {
  try {
    // If it's a GET request, just show a status page
    if (request.method === 'GET') {
      return NextResponse.json({ status: "Endpoint is active. Use POST to generate." });
    }

    const body = await request.json();
    if (!body.phone) {
      return NextResponse.json({ error: 'Phone missing' }, { status: 400 });
    }

    const token = await generateMagicToken(body.phone, body.school || 'UNILAG');
    const origin = new URL(request.url).origin;
    
    return NextResponse.json({ 
      success: true, 
      link: `${origin}/studio?key=${token}` 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { handle as GET, handle as POST };
