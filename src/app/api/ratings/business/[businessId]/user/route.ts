import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/ratings/business/[businessId]/user
 * Get the current user's rating for a specific business
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { businessId } = await params;

    // Get the user's rating for this business
    const rating = await prisma.rating.findUnique({
      where: {
        userId_businessId: {
          userId: user.userId,
          businessId,
        },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!rating) {
      return NextResponse.json(
        { rating: null, hasRated: false },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { rating, hasRated: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
      { status: 500, headers: corsHeaders }
    );
  }
}
