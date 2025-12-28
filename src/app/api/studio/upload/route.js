import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
// FIX: Using absolute alias
import { verifyMagicToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    
    const decoded = await verifyMagicToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({ success: true, user: decoded });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
