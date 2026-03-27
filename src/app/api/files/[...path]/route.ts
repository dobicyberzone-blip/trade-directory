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

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'jfif', 'svg']);

// 1x1 transparent PNG placeholder (served when file is missing on disk but exists in DB)
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f3f4f6"/>
  <text x="50%" y="45%" font-family="Arial" font-size="12" fill="#9ca3af" text-anchor="middle">File not</text>
  <text x="50%" y="58%" font-family="Arial" font-size="12" fill="#9ca3af" text-anchor="middle">found</text>
</svg>`;

// All candidate root directories to search for uploaded files
function getUploadRoots(): string[] {
  const roots: string[] = [];

  if (process.env.UPLOAD_DIR) {
    // UPLOAD_DIR may point to business-documents directly — add both it and its parent
    roots.push(resolve(join(process.env.UPLOAD_DIR, '..')));
    roots.push(resolve(process.env.UPLOAD_DIR));
  }

  roots.push(
    join(process.cwd(), 'uploads'),            // persistent location (preferred)
    join(process.cwd(), 'public', 'uploads'),  // legacy location
    '/app/uploads',
    '/app/public/uploads',
    '/data/uploads',                           // Docker volume mount (survives redeploys)
    '/var/uploads',
  );

  return roots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    // Strip leading 'uploads/' segment from legacy /uploads/ rewrites
    const segments = path[0] === 'uploads' ? path.slice(1) : path;
    const relativePath = segments.join('/');
    // Filename only — used as fallback when subdirectory isn't found
    const filename = segments[segments.length - 1];

    const roots = getUploadRoots();

    // Build candidate file paths to try in order:
    // 1. relativePath under each root (e.g. business-documents/file.pdf under /app/uploads)
    // 2. filename directly under each root (flat fallback)
    // 3. filename under known subdirectories of each root
    const subdirs = ['business-documents', 'chat', 'products', 'logos', 'certifications'];
    const candidates: string[] = [];

    for (const root of roots) {
      candidates.push(resolve(join(root, relativePath)));
    }
    for (const root of roots) {
      candidates.push(resolve(join(root, filename)));
      for (const sub of subdirs) {
        candidates.push(resolve(join(root, sub, filename)));
      }
    }

    // Find the first existing file, ensuring no path traversal
    for (const filePath of candidates) {
      // Security: must stay within one of the known roots
      const safe = roots.some(r => filePath.startsWith(resolve(r)));
      if (!safe) continue;

      if (existsSync(filePath)) {
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
      }
    }

    console.error(`[files] Not found: ${relativePath} (cwd: ${process.cwd()}, tried: ${candidates.slice(0, 4).join(', ')})`);

    // For image requests, return a placeholder SVG instead of JSON to avoid broken image icons
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (IMAGE_EXTENSIONS.has(ext)) {
      return new NextResponse(PLACEHOLDER_SVG, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300', // Short cache so real file can be served once available
          'X-File-Status': 'not-found',
        },
      });
    }

    return NextResponse.json(
      { error: 'File not found', path: relativePath, cwd: process.cwd() },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
