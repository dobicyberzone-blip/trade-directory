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

// PATCH /api/businesses/[id]/verify - Verify or reject a business (Admin only)
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
    const { status, notes, reason } = body;
    
    // Use notes or reason (for backward compatibility)
    const verificationNotes = notes || reason;

    // Validate status
    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be VERIFIED or REJECTED' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update business verification status
    const business = await prisma.business.update({
      where: { id: resolvedParams.id },
      data: {
        verificationStatus: status,
        needsVerification: false,
        // Unfeature on rejection — must be re-verified and re-featured by admin
        ...(status === 'REJECTED' && { featured: false, featuredAt: null, featuredBy: null }),
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        products: true,
        certifications: true,
      },
    });

    // Create notification for business owner
    const notificationMessage = status === 'VERIFIED'
      ? `Your business "${business.name}" has been verified and is now live on the directory!${verificationNotes ? ` Admin note: ${verificationNotes}` : ''}`
      : `Your business "${business.name}" verification was rejected. ${verificationNotes || 'Please review and resubmit.'}`;

    await prisma.notification.create({
      data: {
        userId: business.ownerId,
        title: status === 'VERIFIED' ? 'Business Verified ✓' : 'Business Verification Rejected',
        message: notificationMessage,
        type: 'BUSINESS_VERIFICATION',
        urgency: status === 'VERIFIED' ? 'MEDIUM' : 'HIGH',
        read: false,
      },
    });

    return NextResponse.json(
      {
        business,
        message: `Business ${status === 'VERIFIED' ? 'verified' : 'rejected'} successfully`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify business' },
      { status: 500, headers: corsHeaders }
    );
  }
}
