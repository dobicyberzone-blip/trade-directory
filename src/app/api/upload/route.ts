import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const USE_CLOUDINARY = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Upload to Cloudinary with explicit resource_type.
 *
 * KEY FIX: PDFs must use resource_type=raw, images use resource_type=image.
 * Using "auto" causes Cloudinary to sometimes mis-classify PDFs and generate
 * URLs that break after CDN cache expiry or on re-fetch.
 *
 * The resource_type MUST be included in the signature params — omitting it
 * causes signature mismatches and silent fallback to wrong storage type.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const crypto = await import('crypto');
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'business-documents';

  // Determine correct resource_type — never use "auto" for signed uploads
  // "raw" for PDFs/documents, "image" for all image types
  const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';

  // ALL params that are sent must be included in the signature, sorted alphabetically
  const params: Record<string, string | number> = {
    folder,
    resource_type: resourceType,
    timestamp,
  };

  const paramString = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(paramString + CLOUDINARY_API_SECRET)
    .digest('hex');

  const formData = new FormData();
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { type: mimeType });
  formData.append('file', blob, filename);
  formData.append('api_key', CLOUDINARY_API_KEY!);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('resource_type', resourceType);
  formData.append('signature', signature);

  // Use the correct resource_type endpoint — critical for permanent storage
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  if (!data.secure_url) throw new Error('Cloudinary returned no URL');

  // For raw (PDF) resources, Cloudinary returns a URL without extension sometimes.
  // Ensure the URL ends with the correct extension so browsers handle it properly.
  let url: string = data.secure_url;
  if (resourceType === 'raw' && !url.endsWith('.pdf')) {
    url = `${url}.pdf`;
  }

  return url;
}

/**
 * Local fallback upload.
 * Images → base64 data URL (stored in DB, survives redeploys).
 * PDFs → local filesystem (only used when Cloudinary is unavailable).
 */
async function handleLocalUpload(buffer: Buffer, file: File): Promise<string> {
  const isImage = file.type.startsWith('image/');

  // Images always go to base64 — they persist in the DB and never disappear on redeploy
  if (isImage) {
    const base64 = buffer.toString('base64');
    return `data:${file.type};base64,${base64}`;
  }

  // PDFs: try persistent filesystem locations
  try {
    const persistentDir = existsSync('/data') ? '/data/uploads/business-documents' : null;
    const uploadDir =
      process.env.UPLOAD_DIR ||
      persistentDir ||
      join(process.cwd(), 'uploads', 'business-documents');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    return `/api/files/business-documents/${filename}`;
  } catch {
    // Last resort: base64 for PDFs too
    const base64 = buffer.toString('base64');
    return `data:${file.type};base64,${base64}`;
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400, headers: corsHeaders }
      );
    }

    const file = formData.get('file') as File | null;
    const mode = formData.get('mode') as string | null;

    if (mode === 'url') {
      const url = formData.get('url') as string;
      if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400, headers: corsHeaders });
      }
      return NextResponse.json(
        { url, filename: url.split('/').pop() || 'file', size: 0, type: 'url' },
        { headers: corsHeaders }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', availableKeys: Array.from(formData.keys()) },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size: 10MB for PDFs, 5MB for images
    const isPdf = file.type === 'application/pdf';
    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isPdf ? '10MB for PDFs' : '5MB for images'}.` },
        { status: 400, headers: corsHeaders }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not supported: ${file.type}. Allowed: JPG, PNG, WEBP, PDF` },
        { status: 400, headers: corsHeaders }
      );
    }

    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch (bufferError) {
      return NextResponse.json(
        { error: 'Failed to read file', details: bufferError instanceof Error ? bufferError.message : 'Unknown' },
        { status: 500, headers: corsHeaders }
      );
    }

    const buffer = Buffer.from(bytes);
    let publicUrl: string;

    if (USE_CLOUDINARY) {
      try {
        publicUrl = await uploadToCloudinary(buffer, file.name, file.type);
        console.log(`[upload] Cloudinary OK (${file.type}): ${publicUrl}`);
      } catch (err1) {
        console.error('[upload] Cloudinary attempt 1 failed:', err1);
        try {
          await new Promise(r => setTimeout(r, 1500));
          publicUrl = await uploadToCloudinary(buffer, file.name, file.type);
          console.log(`[upload] Cloudinary retry OK: ${publicUrl}`);
        } catch (err2) {
          console.error('[upload] Cloudinary retry failed, using local fallback:', err2);
          publicUrl = await handleLocalUpload(buffer, file);
          console.log(`[upload] Local fallback: ${publicUrl.substring(0, 80)}`);
        }
      }
    } else {
      console.warn('[upload] Cloudinary not configured — using local fallback. Set CLOUDINARY_* env vars.');
      publicUrl = await handleLocalUpload(buffer, file);
    }

    return NextResponse.json(
      { url: publicUrl, filename: file.name, size: file.size, type: file.type },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400, headers: corsHeaders });
    }

    const filename = fileUrl.split('/').pop();
    if (!filename) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400, headers: corsHeaders });
    }

    const filepath = join(
      process.env.UPLOAD_DIR || join(process.cwd(), 'uploads', 'business-documents'),
      filename
    );
    if (existsSync(filepath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filepath);
    }

    return NextResponse.json({ message: 'File deleted successfully' }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500, headers: corsHeaders });
  }
}
