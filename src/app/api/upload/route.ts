import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { uploadToRustFS } from '@/lib/rustfs';

const USE_RUSTFS = !!(
  process.env.RUSTFS_ENDPOINT_URL &&
  process.env.RUSTFS_ACCESS_KEY_ID &&
  process.env.RUSTFS_SECRET_ACCESS_KEY
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Local fallback upload.
 * Images → base64 data URL (stored in DB, survives redeploys).
 * PDFs → local filesystem.
 */
async function handleLocalUpload(buffer: Buffer, file: File): Promise<string> {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    const base64 = buffer.toString('base64');
    return `data:${file.type};base64,${base64}`;
  }

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

    if (USE_RUSTFS) {
      try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 12);
        const ext = file.name.split('.').pop() || 'bin';
        const key = `business-documents/${timestamp}-${random}.${ext}`;

        publicUrl = await uploadToRustFS(buffer, key, file.type);
        console.log(`[upload] RustFS OK: ${publicUrl}`);
      } catch (err) {
        console.error('[upload] RustFS failed, using local fallback:', err);
        publicUrl = await handleLocalUpload(buffer, file);
      }
    } else {
      console.warn('[upload] RustFS not configured — using local fallback. Set RUSTFS_* env vars.');
      publicUrl = await handleLocalUpload(buffer, file);
    }

    return NextResponse.json(
      { url: publicUrl, filename: file.name, size: file.size, type: file.type },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Handle RustFS URLs
    if (USE_RUSTFS && fileUrl.includes(process.env.RUSTFS_BUCKET || 'trade-directory')) {
      const { deleteFromRustFS, urlToKey } = await import('@/lib/rustfs');
      const key = urlToKey(fileUrl);
      if (key) {
        await deleteFromRustFS(key);
        return NextResponse.json({ message: 'File deleted successfully' }, { headers: corsHeaders });
      }
    }

    // Handle local files
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
