import { NextRequest, NextResponse } from 'next/server';

// CMS Media Library - Public endpoint
// Returns empty array for now (media library feature not implemented yet)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  // Return empty media array
  // The frontend will fall back to default images
  return NextResponse.json({ 
    media: [],
    message: 'Media library not configured. Using fallback images.'
  });
}
