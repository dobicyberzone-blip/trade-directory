/**
 * Admin Individual User Management API
 * GET, PUT, DELETE operations for specific users
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';
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

const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR', 'VIEWER', 'ADMIN', 'EXPORTER', 'BUYER']).optional(),
  phoneNumber: z.string().optional(),
  isVerified: z.boolean().optional(),
});

// GET /api/admin/users/[id] - Get user details
export const GET = requirePermission(
  Permission.USER_VIEW,
  async (request, _context) => {
    try {
      const userId = request.url.split('/').pop();
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
          business: {
            select: {
              id: true,
              name: true,
              sector: true,
              verificationStatus: true,
            },
          },
          products: {
            select: {
              id: true,
              name: true,
              category: true,
            },
            take: 10,
          },
          inquiries: {
            select: {
              id: true,
              message: true,
              createdAt: true,
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      await logAuditAction({
        userId: request.user?.userId || 'unknown',
        action: 'USER_VIEWED',
        resourceType: 'USER',
        resourceId: userId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ user: targetUser }, { headers: corsHeaders });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// PUT /api/admin/users/[id] - Update user
export const PUT = requirePermission(
  Permission.USER_EDIT,
  async (request, _context) => {
    try {
      const userId = request.url.split('/').pop();
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      const body = await request.json();
      const validatedData = updateUserSchema.parse(body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // If email is being changed, check if new email is available
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: validatedData.email },
        });

        if (emailTaken) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 400, headers: corsHeaders }
          );
        }
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      
      if (validatedData.firstName) updateData.firstName = validatedData.firstName;
      if (validatedData.lastName) updateData.lastName = validatedData.lastName;
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.role) updateData.role = validatedData.role;
      if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber;
      if (validatedData.isVerified !== undefined) updateData.isVerified = validatedData.isVerified;
      
      // Hash password if provided
      if (validatedData.password) {
        updateData.password = await bcrypt.hash(validatedData.password, 12);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          phoneNumber: true,
          updatedAt: true,
        },
      });

      await logAuditAction({
        userId: request.user?.userId || 'unknown',
        action: 'USER_UPDATED',
        resourceType: 'USER',
        resourceId: userId,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        message: 'User updated successfully',
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
        { error: 'Failed to update user' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// PATCH /api/admin/users/[id] - Update user (alias for PUT)
export const PATCH = requirePermission(
  Permission.USER_EDIT,
  async (request, _context) => {
    try {
      const userId = request.url.split('/').pop();
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      const body = await request.json();
      const validatedData = updateUserSchema.parse(body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // If email is being changed, check if new email is available
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: validatedData.email },
        });

        if (emailTaken) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 400, headers: corsHeaders }
          );
        }
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      
      if (validatedData.firstName) updateData.firstName = validatedData.firstName;
      if (validatedData.lastName) updateData.lastName = validatedData.lastName;
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.role) updateData.role = validatedData.role;
      if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber;
      if (validatedData.isVerified !== undefined) updateData.isVerified = validatedData.isVerified;
      
      // Hash password if provided
      if (validatedData.password) {
        updateData.password = await bcrypt.hash(validatedData.password, 12);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          phoneNumber: true,
          updatedAt: true,
        },
      });

      await logAuditAction({
        userId: request.user?.userId || 'unknown',
        action: 'USER_UPDATED',
        resourceType: 'USER',
        resourceId: userId,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        message: 'User updated successfully',
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
        { error: 'Failed to update user' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// DELETE /api/admin/users/[id] - Delete user
export const DELETE = requirePermission(
  Permission.USER_DELETE,
  async (request, _context) => {
    try {
      const userId = request.url.split('/').pop();
      
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
          role: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Prevent deleting yourself
      if (userId === request.user?.userId) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      await logAuditAction({
        userId: request.user?.userId || 'unknown',
        action: 'USER_DELETED',
        resourceType: 'USER',
        resourceId: userId,
        changes: {
          email: existingUser.email,
          role: existingUser.role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        message: 'User deleted successfully',
      }, { headers: corsHeaders });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
