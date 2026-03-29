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

/**
 * GET /api/auth/me
 * Get current authenticated user's information
 */
export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        partnerType: true,
        phoneNumber: true,
        phone: true,
        avatar: true,
        profileImage: true,
        location: true,
        bio: true,
        company: true,
        position: true,
        website: true,
        linkedIn: true,
        twitter: true,
        preferredOtpMethod: true,
        totpEnabled: true,
        emailVerified: true,
        phoneVerified: true,
        isVerified: true,
        suspended: true,
        createdAt: true,
        updatedAt: true,
        // RBAC fields
        profileVisible: true,
        visibleToRoles: true,
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Normalize legacy BUYER+partnerType users to PARTNER role
    const normalizedUser = (user.role === 'BUYER' && user.partnerType)
      ? { ...user, role: 'PARTNER' }
      : user;

    return NextResponse.json(
      { user: normalizedUser },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500, headers: corsHeaders }
    );
  }
}
