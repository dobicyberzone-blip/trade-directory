import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {

    const user = await verifyToken(request);
    
    if (!user) {

      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {

      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size (max 5MB for base64 storage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {

      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {

      return NextResponse.json(
        { error: 'Invalid file type. Allowed: images, PDF, DOC, DOCX' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert file to base64 data URL (works in serverless)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Return data URL (can be used directly in img src or downloaded)
    return NextResponse.json(
      { 
        url: dataUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
        message: 'File uploaded successfully (stored as data URL)'
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
