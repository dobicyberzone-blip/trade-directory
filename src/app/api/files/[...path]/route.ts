import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    // path may start with 'uploads/' (from legacy /uploads/ rewrites) — strip it
    const segments = path[0] === 'uploads' ? path.slice(1) : path;
    const relativePath = segments.join('/');
    const filePath = join(process.cwd(), 'public', 'uploads', relativePath);

    // Security: prevent path traversal
    const uploadsRoot = join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsRoot)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!existsSync(filePath)) {
      console.error(`[files] Not found: ${filePath}`);
      return NextResponse.json({ error: 'File not found', path: filePath }, { status: 404 });
    }

    const fileBuffer = readFileSync(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': contentType === 'application/pdf' ? 'inline' : 'inline',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
