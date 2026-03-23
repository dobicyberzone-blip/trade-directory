import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PATCH - Update success story status (approve/feature)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { isApproved, isFeatured } = body;

    // Build update data
    const updateData: any = {};
    if (typeof isApproved === 'boolean') {
      updateData.isApproved = isApproved;
    }
    if (typeof isFeatured === 'boolean') {
      updateData.isFeatured = isFeatured;
      // If featuring, must also be approved
      if (isFeatured) {
        updateData.isApproved = true;
      }
    }

    const story = await prisma.successStory.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    let message = 'Success story updated';
    if (isFeatured) {
      message = 'Success story featured successfully';
    } else if (isApproved) {
      message = 'Success story approved successfully';
    } else if (isApproved === false) {
      message = 'Success story unapproved';
    }

    return NextResponse.json(
      { story, message },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update success story status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
