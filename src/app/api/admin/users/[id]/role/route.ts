/**
 * Admin User Role Management API
 * PUT operation to change user role
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';
import prisma from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const changeRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR', 'VIEWER', 'ADMIN', 'EXPORTER', 'BUYER']),
});

// PUT /api/admin/users/[id]/role - Change user role
export const PUT = requirePermission(
  Permission.USER_MANAGE_ROLES,
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

      const body = await request.json();
      const { role } = changeRoleSchema.parse(body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Prevent changing your own role
      if (userId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      await logAuditAction({
        userId: user.userId,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'USER',
        resourceId: userId,
        changes: {
          email: existingUser.email,
          previousRole: existingUser.role,
          newRole: role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        message: 'User role updated successfully',
        user: updatedUser,
      }, { headers: corsHeaders });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Failed to change user role' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// PATCH /api/admin/users/[id]/role - Change user role (alias for PUT)
export const PATCH = requirePermission(
  Permission.USER_MANAGE_ROLES,
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

      const body = await request.json();
      const { role } = changeRoleSchema.parse(body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Prevent changing your own role
      if (userId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      await logAuditAction({
        userId: user.userId,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'USER',
        resourceId: userId,
        changes: {
          email: existingUser.email,
          previousRole: existingUser.role,
          newRole: role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        message: 'User role updated successfully',
        user: updatedUser,
      }, { headers: corsHeaders });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Failed to change user role' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
