import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PUT - Update success story (admin only for approval/featuring)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: corsHeaders }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { isApproved, isFeatured } = body;

    const successStory = await prisma.successStory.update({
      where: { id: resolvedParams.id },
      data: {
        isApproved: isApproved !== undefined ? isApproved : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Success story updated successfully',
        story: successStory,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update success story' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - Delete success story (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: corsHeaders }
      );
    }

    const resolvedParams = await params;
    await prisma.successStory.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json(
      { message: 'Success story deleted successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete success story' },
      { status: 500, headers: corsHeaders }
    );
  }
}
