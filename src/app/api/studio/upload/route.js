import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyMagicToken } from '@/lib/jwt';

// Configure Cloudinary for Signature generation
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    
    const decoded = await verifyMagicToken(token);
    // 🔥 INTEGRITY FIX: Check if the decoded token belongs to an Admin
    if (!decoded || !decoded.is_admin) {
        return NextResponse.json({ error: 'Sovereign access required' }, { status: 403 });
    }

    // 👑 GENERATE SECURE SIGNATURE FOR 15s UPLOAD
    // This tells Cloudinary: "Only accept this video if it's trimmed to 15s"
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        eager: "du_15,c_fill,g_center", // Force 15s cut
        folder: "campus_gists",
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({ 
      success: true, 
      signature, 
      timestamp, 
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}