import { NextResponse } from 'next/server';
// Use the @ alias to find the lib regardless of folder depth
import { generateMagicToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const body = await request.json();
    const token = await generateMagicToken(body.phone, body.school || 'UNILAG');
    const origin = new URL(request.url).origin;
    return NextResponse.json({ success: true, link: `${origin}/studio?key=${token}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Route Active", timestamp: Date.now() });
}
