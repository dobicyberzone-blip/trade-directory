import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { logAuditAction } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.userId },
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            products: {
              take: 3,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { success: true, favorites }, 
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_businessId: {
          userId: user.userId,
          businessId,
        },
      },
    });

    if (existing) {
      // Instead of returning error, return success with message
      return NextResponse.json(
        { 
          success: true, 
          message: 'Already in favorites',
          favorite: existing,
          alreadyExists: true
        },
        { status: 200, headers: corsHeaders }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.userId,
        businessId,
      },
      include: {
        business: true,
      },
    });

    // Track activity
    void logAuditAction({
      userId: user.userId,
      action: 'FAVORITE_ADDED',
      description: `Added business to favorites`,
      metadata: { businessId, businessName: favorite.business?.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    }).catch(() => {});

    return NextResponse.json(
      { 
        success: true, 
        favorite, 
        message: 'Added to favorites',
        alreadyExists: false
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Failed to add favorite' },
      { status: 500, headers: corsHeaders }
    );
  }
}
