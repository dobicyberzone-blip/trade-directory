import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// DELETE /api/businesses/[id]/certifications/[certificationId] - Delete a certification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; certificationId: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const certificationId = resolvedParams.certificationId;

    // Verify the business belongs to the user (unless admin)
    if (user.role !== 'ADMIN') {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true },
      });

      if (!business || business.ownerId !== user.userId) {
        return NextResponse.json(
          { error: 'Unauthorized to delete certifications from this business' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Delete the certification
    await prisma.businessCertification.delete({
      where: {
        id: certificationId,
        businessId, // Ensure it belongs to the specified business
      },
    });

    return NextResponse.json(
      { message: 'Certification deleted successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete certification' },
      { status: 500, headers: corsHeaders }
    );
  }
}
