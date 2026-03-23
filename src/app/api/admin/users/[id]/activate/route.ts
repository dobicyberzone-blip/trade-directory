/**
 * Admin User Activate API
 * POST operation to activate user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';
import prisma from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/admin/users/[id]/activate - Activate user account
export const POST = requirePermission(
  Permission.USER_SUSPEND,
  async (request, user) => {
    try {
      const pathParts = request.url.split('/');
      const userId = pathParts[pathParts.length - 2];
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          isVerified: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Activate user by setting isVerified to true
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
        },
      });

      await logAuditAction({
        userId: user.userId,
        action: 'USER_ACTIVATED',
        resourceType: 'USER',
        resourceId: userId,
        changes: {
          email: existingUser.email,
          previousStatus: existingUser.isVerified,
          newStatus: true,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        message: 'User activated successfully',
        user: updatedUser,
      }, { headers: corsHeaders });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to activate user' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
