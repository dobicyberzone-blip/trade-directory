import { NextRequest, NextResponse } from 'next/server';
import { join, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  jfif: 'image/jpeg',
};

// Resolve the uploads directory — persistent location outside public/ so builds don't wipe it
function resolveUploadsDir(): string {
  if (process.env.UPLOAD_DIR) {
    // UPLOAD_DIR points to business-documents directly, go one level up
    return resolve(join(process.env.UPLOAD_DIR, '..'));
  }
  const candidates = [
    join(process.cwd(), 'uploads'),           // new persistent location
    join(process.cwd(), 'public', 'uploads'), // legacy location
    '/app/uploads',
    '/app/public/uploads',
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return join(process.cwd(), 'uploads');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    // path may start with 'uploads/' (from legacy /uploads/ rewrites) — strip it
    const segments = path[0] === 'uploads' ? path.slice(1) : path;
    const relativePath = segments.join('/');

    const uploadsDir = resolveUploadsDir();
    const filePath = resolve(join(uploadsDir, relativePath));

    // Security: prevent path traversal
    if (!filePath.startsWith(resolve(uploadsDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!existsSync(filePath)) {
      console.error(`[files] Not found: ${filePath} (cwd: ${process.cwd()}, uploadsDir: ${uploadsDir})`);
      return NextResponse.json(
        { error: 'File not found', path: filePath, cwd: process.cwd(), uploadsDir },
        { status: 404 }
      );
    }

    const fileBuffer = readFileSync(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
