import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { isValidRole, isValidSubRole } from '@/lib/rbac/permissions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/user/profile-visibility
 * Get current user's profile visibility settings
 */
export async function GET(req: NextRequest) {
  try {
    const tokenPayload = await verifyToken(req);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subRole: true,
        profileVisible: true,
        visibleToRoles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      user: {
        ...user,
        visibleToRoles: user.visibleToRoles ? JSON.parse(user.visibleToRoles) : null,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching profile visibility:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile visibility settings' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PATCH /api/user/profile-visibility
 * Update current user's profile visibility settings
 */
export async function PATCH(req: NextRequest) {
  try {
    const tokenPayload = await verifyToken(req);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { profileVisible, visibleToRoles, subRole } = body;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Validate and update fields
    const updateData: Record<string, unknown> = {};

    // Handle profileVisible
    if (typeof profileVisible === 'boolean') {
      updateData.profileVisible = profileVisible;
    }

    // Handle visibleToRoles
    if (visibleToRoles !== undefined) {
      if (!Array.isArray(visibleToRoles)) {
        return NextResponse.json(
          { error: 'visibleToRoles must be an array' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Validate all roles in the array
      const invalidRoles = visibleToRoles.filter((role: string) => !isValidRole(role));
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { error: `Invalid roles: ${invalidRoles.join(', ')}` },
          { status: 400, headers: corsHeaders }
        );
      }
      
      updateData.visibleToRoles = JSON.stringify(visibleToRoles);
    }

    // Handle subRole
    if (subRole !== undefined) {
      if (subRole === null) {
        updateData.subRole = null;
      } else if (!isValidSubRole(subRole)) {
        return NextResponse.json(
          { error: `Invalid subRole: ${subRole}` },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.subRole = subRole;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: tokenPayload.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        subRole: true,
        profileVisible: true,
        visibleToRoles: true,
      },
    });

    return NextResponse.json({
      message: 'Profile visibility updated successfully',
      user: {
        ...updatedUser,
        visibleToRoles: updatedUser.visibleToRoles 
          ? JSON.parse(updatedUser.visibleToRoles) 
          : null,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error updating profile visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update profile visibility settings' },
      { status: 500, headers: corsHeaders }
    );
  }
}
