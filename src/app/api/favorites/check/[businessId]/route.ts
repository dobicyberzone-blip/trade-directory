import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/favorites/check/[businessId] - Check if business is favorited by current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const user = await verifyToken(request);
    
    // If no user is logged in, return not favorited
    if (!user) {
      return NextResponse.json(
        { isFavorited: false },
        { headers: corsHeaders }
      );
    }

    const { businessId } = await params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_businessId: {
          userId: user.userId,
          businessId,
        },
      },
    });

    return NextResponse.json(
      { isFavorited: !!favorite },
      { headers: corsHeaders }
    );
  } catch (error) {
    // Return false on error to avoid breaking the UI
    return NextResponse.json(
      { isFavorited: false },
      { headers: corsHeaders }
    );
  }
}
