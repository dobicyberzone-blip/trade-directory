import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET media by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // MediaLibrary model doesn't exist in schema yet
    // Return empty array for now

    return NextResponse.json({ media: [] }, { headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500, headers: corsHeaders }
    );
  }
}
