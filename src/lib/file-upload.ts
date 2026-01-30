import sharp from 'sharp';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/client';

interface UploadValidation {
  valid: boolean;
  error?: string;
  filename?: string;
}

export async function validateAndProcessProfileImage(
  file: File,
  userId: string
): Promise<UploadValidation> {
  const MAX_SIZE = 5 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File exceeds 5MB limit' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP allowed' };
  }

  try {
    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Invalid image data' };
    }

    if (metadata.width < 100 || metadata.height < 100) {
      return { valid: false, error: 'Image must be at least 100x100px' };
    }

    const processed = await sharp(imageBuffer)
      .rotate()
      .resize(400, 400, { fit: 'cover' })
      .toFormat('webp', { quality: 80 })
      .toBuffer();

    const filename = `${userId}_${crypto.randomBytes(8).toString('hex')}.webp`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from('profile_images')
      .upload(`${userId}/${filename}`, processed, {
        contentType: 'image/webp',
        upsert: false
      });

    if (uploadError) {
      return { valid: false, error: 'Upload failed' };
    }

    return { valid: true, filename };
  } catch (err) {
    return { valid: false, error: 'Image processing failed' };
  }
}
