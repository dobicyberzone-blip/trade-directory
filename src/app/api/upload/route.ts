import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Cloudinary configuration (optional - set in .env for production)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const USE_CLOUDINARY = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to upload to Cloudinary using signed upload
async function uploadToCloudinary(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const crypto = await import('crypto');
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'business-documents';

  // Cloudinary signature: params sorted alphabetically, joined as key=value&key=value, then SHA-1 hash
  const params: Record<string, string | number> = { folder, timestamp };
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
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  if (!data.secure_url) throw new Error('Cloudinary returned no URL');
  return data.secure_url;
}

// Helper function to handle local upload (filesystem or base64)
async function handleLocalUpload(buffer: Buffer, file: File): Promise<string> {
  try {
    // Prefer /data/uploads (Docker persistent volume) over /app/uploads (wiped on redeploy)
    const persistentDir = existsSync('/data') ? '/data/uploads/business-documents' : null;
    const uploadDir = process.env.UPLOAD_DIR
      || persistentDir
      || join(process.cwd(), 'uploads', 'business-documents');
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
  } catch (fsError) {
    // Fallback to base64
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

    // If mode is URL, just return the URL
    if (mode === 'url') {
      const url = formData.get('url') as string;
      if (!url) {
        return NextResponse.json(
          { error: 'No URL provided' },
          { status: 400, headers: corsHeaders }
        );
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

    // Validate file size: 1MB for PDFs, 5MB for images
    const isPdf = file.type === 'application/pdf';
    const maxSize = isPdf ? 1 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size too large. Maximum size is ${isPdf ? '1MB for PDFs' : '5MB for images'}.` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not supported: ${file.type}. Allowed types: JPG, PNG, WEBP, PDF` },
        { status: 400, headers: corsHeaders }
      );
    }

    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch (bufferError) {
      return NextResponse.json(
        { error: 'Failed to read file data', details: bufferError instanceof Error ? bufferError.message : 'Unknown error' },
        { status: 500, headers: corsHeaders }
      );
    }

    const buffer = Buffer.from(bytes);
    let publicUrl: string;

    if (USE_CLOUDINARY) {
      try {
        publicUrl = await uploadToCloudinary(buffer, file.name, file.type);
        console.log(`[upload] Cloudinary OK: ${publicUrl}`);
      } catch (cloudinaryError) {
        console.error('[upload] Cloudinary failed, falling back to local:', cloudinaryError);
        publicUrl = await handleLocalUpload(buffer, file);
        console.log(`[upload] Local fallback: ${publicUrl}`);
      }
    } else {
      publicUrl = await handleLocalUpload(buffer, file);
    }

    return NextResponse.json(
      { url: publicUrl, filename: file.name, size: file.size, type: file.type },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name || 'Unknown',
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
      return NextResponse.json(
        { error: 'No file URL provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    const filename = fileUrl.split('/').pop();
    if (!filename) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400, headers: corsHeaders }
      );
    }

    const filepath = join(
      process.env.UPLOAD_DIR || join(process.cwd(), 'uploads', 'business-documents'),
      filename
    );
    if (existsSync(filepath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filepath);
    }

    return NextResponse.json(
      { message: 'File deleted successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500, headers: corsHeaders }
    );
  }
}
