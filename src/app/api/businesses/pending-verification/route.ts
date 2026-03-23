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

// GET /api/businesses/pending-verification - Get businesses needing verification (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get businesses that need verification
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { verificationStatus: 'PENDING' },
          { needsVerification: true },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            verified: true,
          },
        },
        certifications: true,
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            products: true,
            certifications: true,
            ratings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { businesses },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch businesses needing verification' },
      { status: 500, headers: corsHeaders }
    );
  }
}
