import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
// Fix: Use @ alias here too
import { verifyMagicToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const decoded = await verifyMagicToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ... (rest of your existing upload logic)
    return NextResponse.json({ success: true, message: "Authorized for upload" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
