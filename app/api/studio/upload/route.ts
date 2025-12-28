import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyMagicToken } from '@/lib/jwt';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyMagicToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid Token' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const type = formData.get('type') as string;
    const school = formData.get('school') as string;

    if (!file || file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Invalid File (Max 15MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `campus-market/stories/${school}`,
          resource_type: 'video',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 480, crop: 'scale' },
            { duration: "15.0", crop: "limit" }
          ]
        },
        (error, result) => {
          if (error) reject(error); else resolve(result);
        }
      ).end(buffer);
    });

    const supabase = createClient(cookies());
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6); 

    let { data: contributor } = await supabase.from('contributors').select('id').eq('phone', user.phone).single();
    if (!contributor) {
        const { data: newContrib } = await supabase.from('contributors').insert([{ phone: user.phone, school: user.school }]).select().single();
        contributor = newContrib;
    }

    await supabase.from('videos').insert([{
        contributor_id: contributor.id,
        cloudinary_id: uploadResult.public_id,
        playback_url: uploadResult.secure_url,
        thumbnail_url: uploadResult.secure_url.replace('.mp4', '.jpg'),
        type, caption, school,
        expires_at: expiresAt.toISOString()
    }]);

    return NextResponse.json({ success: true, url: uploadResult.secure_url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
