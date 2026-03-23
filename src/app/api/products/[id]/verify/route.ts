import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PATCH /api/products/[id]/verify - Verify or reject a product (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be VERIFIED or REJECTED' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get product with business and owner info
    const existingProduct = await prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update product verification status
    const product = await prisma.product.update({
      where: { id: resolvedParams.id },
      data: {
        verified: status === 'VERIFIED',
        verificationNotes: notes || null,
        updatedAt: new Date(),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create notification for product owner
    const notificationMessage = status === 'VERIFIED'
      ? `Your product "${product.name}" has been verified and is now visible in the directory!`
      : `Your product "${product.name}" verification was rejected. ${notes || 'Please review and resubmit.'}`;

    await prisma.notification.create({
      data: {
        userId: existingProduct.business.ownerId,
        title: status === 'VERIFIED' ? 'Product Verified' : 'Product Verification Rejected',
        message: notificationMessage,
        type: 'PRODUCT_INQUIRY',
        urgency: status === 'VERIFIED' ? 'LOW' : 'MEDIUM',
        read: false,
      },
    });

    return NextResponse.json(
      {
        product,
        message: `Product ${status === 'VERIFIED' ? 'verified' : 'rejected'} successfully`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify product' },
      { status: 500, headers: corsHeaders }
    );
  }
}
