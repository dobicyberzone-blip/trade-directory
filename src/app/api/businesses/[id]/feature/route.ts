import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { featured } = body;

    if (typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid featured value' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update business featured status
    const business = await prisma.business.update({
      where: { id },
      data: {
        featured,
        featuredAt: featured ? new Date() : null,
        featuredBy: featured ? user.userId : null,
      },
    });

    return NextResponse.json(
      {
        message: `Business ${featured ? 'featured' : 'unfeatured'} successfully`,
        business,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}
