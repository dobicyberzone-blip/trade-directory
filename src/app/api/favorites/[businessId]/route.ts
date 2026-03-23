import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    // Verify authentication
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const resolvedParams = await params;
    const userId = tokenPayload.userId;

    // Delete the favorite
    await prisma.favorite.delete({
      where: {
        userId_businessId: {
          userId,
          businessId: resolvedParams.businessId,
        },
      },
    });

    // Track activity
    void logAuditAction({
      userId,
      action: 'FAVORITE_REMOVED',
      description: `Removed business from favorites`,
      metadata: { businessId: resolvedParams.businessId },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    }).catch(() => {});

    return NextResponse.json(
      { success: true, message: 'Removed from favorites' },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    // Handle case where favorite doesn't exist
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Favorite not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to remove favorite' },
      { status: 500, headers: corsHeaders }
    );
  }
}
