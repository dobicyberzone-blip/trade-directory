/**
 * Upload diagnostics — admin only
 * GET /api/admin/upload-diagnostics
 * Tests Cloudinary connectivity and reports local upload paths.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET(req: NextRequest) {
  const token = await verifyToken(req);
  if (!token || (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const hasCloudinary = !!(cloudName && apiKey && apiSecret);

  // Test Cloudinary ping
  let cloudinaryStatus = 'not configured';
  if (hasCloudinary) {
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`);
      const data = await res.json();
      cloudinaryStatus = data.status === 'ok' ? 'reachable' : `unexpected: ${JSON.stringify(data)}`;
    } catch (e: any) {
      cloudinaryStatus = `unreachable: ${e.message}`;
    }
  }

  // Check local paths
  const paths = [
    process.env.UPLOAD_DIR,
    '/data/uploads/business-documents',
    '/app/uploads/business-documents',
    '/app/assets/business-documents',
    join(process.cwd(), 'uploads', 'business-documents'),
    join(process.cwd(), 'public', 'uploads', 'business-documents'),
    join(process.cwd(), 'assets', 'business-documents'),
  ].filter(Boolean) as string[];

  const localPaths = paths.map(p => ({ path: p, exists: existsSync(p) }));

  return NextResponse.json({
    cloudinary: { configured: hasCloudinary, cloudName, status: cloudinaryStatus },
    localPaths,
    cwd: process.cwd(),
    uploadDir: process.env.UPLOAD_DIR || null,
  });
}
