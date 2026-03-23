import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST - Track profile view
export async function POST(request: NextRequest) {
  try {
    const { businessId, source = 'directory' } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get viewer info (optional - user might not be logged in)
    let viewerId: string | null = null;
    try {
      const tokenPayload = await verifyToken(request);
      viewerId = tokenPayload?.userId || null;
    } catch {
      // User not logged in, that's okay
    }

    // Get IP and user agent
    const viewerIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const viewerUserAgent = request.headers.get('user-agent') || 'unknown';

    // Create profile view record
    await prisma.profileView.create({
      data: {
        businessId,
        viewerId,
        viewerIp,
        viewerUserAgent,
        source,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Profile view tracked' },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to track profile view' },
      { status: 500, headers: corsHeaders }
    );
  }
}
