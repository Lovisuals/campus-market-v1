import * as Sentry from '@sentry/nextjs';

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB for all files combined

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ValidatedFile {
  file: File;
  type: 'image' | 'document';
  size: number;
  mimeType: string;
}

/**
 * Validate a single file upload
 */
export function validateFile(
  file: File,
  type: 'image' | 'document' = 'image'
): FileValidationResult {
  const warnings: string[] = [];

  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${formatBytes(maxSize)}`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check MIME type
  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    return { valid: false, error: 'File has no extension' };
  }

  const mimeExtensionMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
  };

  const expectedExtensions = mimeExtensionMap[file.type];
  if (expectedExtensions && !expectedExtensions.includes(extension)) {
    warnings.push(`File extension "${extension}" doesn't match MIME type "${file.type}"`);
  }

  // Warn about uncommon file names
  if (file.name.length > 100) {
    warnings.push('File name is very long');
  }

  if (/[^\x00-\x7F]/.test(file.name)) {
    warnings.push('File name contains special characters');
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  type: 'image' | 'document' = 'image',
  maxFiles: number = 10
): FileValidationResult {
  if (!files || files.length === 0) {
    return { valid: false, error: 'No files provided' };
  }

  if (files.length > maxFiles) {
    return { valid: false, error: `Maximum ${maxFiles} files allowed` };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
    return {
      valid: false,
      error: `Total upload size too large. Maximum: ${formatBytes(MAX_TOTAL_UPLOAD_SIZE)}`
    };
  }

  const allWarnings: string[] = [];

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const result = validateFile(files[i], type);
    if (!result.valid) {
      return { valid: false, error: `File ${i + 1}: ${result.error}` };
    }
    if (result.warnings) {
      allWarnings.push(...result.warnings.map(w => `File ${i + 1}: ${w}`));
    }
  }

  return {
    valid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined
  };
}

/**
 * Read file as data URL for preview
 */
export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image if needed (client-side)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        file.type,
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadToStorage(
  file: File,
  bucket: string,
  path: string,
  supabase: any
): Promise<{ url: string; path: string }> {
  try {
    // Validate file first
    const validation = validateFile(file, bucket === 'listing-images' ? 'image' : 'document');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Log warnings to Sentry
    if (validation.warnings) {
      Sentry.captureMessage('File upload warnings', {
        level: 'warning',
        extra: { warnings: validation.warnings, fileName: file.name }
      });
    }

    // Compress images before upload
    let fileToUpload: File | Blob = file;
    if (bucket === 'listing-images' && file.size > 1024 * 1024) {
      // Compress images larger than 1MB
      try {
        fileToUpload = await compressImage(file);
      } catch (error) {
        console.warn('Image compression failed, uploading original:', error);
      }
    }

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
  } catch (error) {
    Sentry.captureException(error, {
      extra: { fileName: file.name, fileSize: file.size, bucket, path }
    });
    throw error;
  }
}

/**
 * Delete file from storage
 */
export async function deleteFromStorage(
  bucket: string,
  path: string,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { bucket, path }
    });
    throw error;
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate unique file path
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  prefix: string = 'uploads'
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop();
  return `${prefix}/${userId}/${timestamp}-${randomStr}.${extension}`;
}
