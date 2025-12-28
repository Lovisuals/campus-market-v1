import { NextResponse } from 'next/server';
import { generateMagicToken } from '../../../src/lib/jwt';

// FORCE dynamic mode to prevent static HTML generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handle(request) {
  try {
    // If it's just a browser check (GET)
    if (request.method === 'GET') {
      return NextResponse.json({ status: "API Route is Active" });
    }

    // If it's our actual data request (POST)
    const body = await request.json();
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

// Export the same function for both methods to stop 405s
export { handle as GET, handle as POST };
