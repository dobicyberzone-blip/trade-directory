/**
 * Admin Users API Route
 * 
 * Endpoints:
 * - GET: List users with pagination, sorting, filtering
 * - POST: Create new user
 * - PUT: Update user
 * - DELETE: Delete user
 * 
 * Features:
 * - Server-side pagination
 * - Column sorting
 * - Search and filtering
 * - Audit logging
 * - Role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';
import bcrypt from 'bcryptjs';
import { requirePermission, requireSuperAdmin } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';
import { verifyToken } from '@/lib/auth-utils';

// GET: List users with pagination, sorting, filtering
export const GET = requirePermission(
  Permission.USER_VIEW,
  async (request, _context) => {
    try {
      const { searchParams } = new URL(request.url);
      
      // Pagination
      const page = parseInt(searchParams.get('page') || '0');
      const pageSize = parseInt(searchParams.get('pageSize') || '25');
      const skip = page * pageSize;

      // Sorting
      const sortField = searchParams.get('sortField') || 'createdAt';
      const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

      // Search
      const search = searchParams.get('search') || '';

      // Filters
      const role = searchParams.get('role');
      const isVerified = searchParams.get('isVerified');
      const emailVerified = searchParams.get('emailVerified');

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (isVerified !== null && isVerified !== undefined) {
        where.isVerified = isVerified === 'true';
      }

      if (emailVerified !== null && emailVerified !== undefined) {
        where.emailVerified = emailVerified === 'true';
      }

      // Fetch data
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortField]: sortOrder },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isSuperAdmin: true,
            isVerified: true,
            emailVerified: true,
            suspended: true,
            phoneNumber: true,
            phoneVerified: true,
            location: true,
            company: true,
            position: true,
            profileImage: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            business: {
              select: {
                id: true,
                name: true,
                verificationStatus: true,
              }
            }
          },
        }),
        prisma.user.count({ where }),
      ]);

      return NextResponse.json({
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.error('[API Error] /api/admin/users GET:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
);

// POST: Create new user
export const POST = requirePermission(
  Permission.USER_CREATE,
  async (request, _context) => {
    try {
      const body = await request.json();
      const { email, password, firstName, lastName, role, phoneNumber, location, company, position } = body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Normal Admin cannot create Super Admin or Admin accounts
      const token = await verifyToken(request);
      const isSuperAdmin = token?.isSuperAdmin === true;
      if (!isSuperAdmin && (role === 'SUPER_ADMIN' || role === 'ADMIN')) {
        return NextResponse.json(
          { error: 'Forbidden — cannot assign admin roles' },
          { status: 403 }
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || 'BUYER',
          phoneNumber,
          location,
          company,
          position,
          isVerified: true, // Admin-created users are auto-verified
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          emailVerified: true,
          phoneNumber: true,
          location: true,
          company: true,
          position: true,
          profileImage: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Audit log
      await AuditLogger.logCreate(
        'User',
        newUser.id,
        newUser,
        request.user?.userId || 'unknown',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      return NextResponse.json({ data: newUser }, { status: 201 });
    } catch (error) {

      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  }
);

// PUT: Update user
export const PUT = requirePermission(
  Permission.USER_EDIT,
  async (request, _context) => {
    try {
      const body = await request.json();
      const { id, ...updates } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Normal Admin cannot change roles or isSuperAdmin flag
      const token = await verifyToken(request);
      const isSuperAdmin = token?.isSuperAdmin === true;
      if (!isSuperAdmin) {
        delete updates.role;
        delete updates.isSuperAdmin;
      }

      // Normal Admin cannot edit Super Admin accounts
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { isSuperAdmin: true } });
      if (!isSuperAdmin && targetUser?.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Forbidden — cannot modify Super Admin accounts' },
          { status: 403 }
        );
      }

      // Get current user data for audit
      const currentUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 12);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          emailVerified: true,
          phoneNumber: true,
          phoneVerified: true,
          location: true,
          company: true,
          position: true,
          profileImage: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Audit log
      await AuditLogger.logUpdate(
        'User',
        id,
        currentUser,
        updatedUser,
        request.user?.userId || 'unknown',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      return NextResponse.json({ data: updatedUser });
    } catch (error) {

      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  }
);

// DELETE: Delete user — Super Admin only
export const DELETE = requireSuperAdmin(
  async (request, _context) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Get user data for audit
      const userToDelete = await prisma.user.findUnique({
        where: { id },
      });

      if (!userToDelete) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Cannot delete another Super Admin
      if (userToDelete.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Forbidden — cannot delete Super Admin accounts' },
          { status: 403 }
        );
      }

      // Delete user
      await prisma.user.delete({
        where: { id },
      });

      // Audit log - FIXED: Use safe null check instead of non-null assertion
      const userId = request.user?.userId;
      await AuditLogger.logDelete(
        'User',
        id,
        userToDelete,
        userId || 'unknown',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {

      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  }
);
