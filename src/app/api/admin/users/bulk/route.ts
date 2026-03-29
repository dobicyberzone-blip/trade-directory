/**
 * Admin Users Bulk Operations API
 * 
 * Endpoints:
 * - POST /bulk-delete: Delete multiple users
 * - POST /bulk-update: Update multiple users
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';

// Helper to get user from token
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}

// Helper to check admin access
async function checkAdminAccess(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 403 }
    );
  }
  return user;
}

// POST: Bulk operations
export async function POST(request: NextRequest) {
  try {
    const user = await checkAdminAccess(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { action, ids, updates } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Action and IDs are required.' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'delete':
        // Delete multiple users
        result = await prisma.user.deleteMany({
          where: {
            id: { in: ids },
          },
        });

        // Audit log
        await AuditLogger.logBulkDelete(
          'User',
          ids,
          user.id,
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );

        return NextResponse.json({
          message: `Successfully deleted ${result.count} users`,
          count: result.count,
        });

      case 'update':
        if (!updates) {
          return NextResponse.json(
            { error: 'Updates object is required for bulk update' },
            { status: 400 }
          );
        }

        // Update multiple users
        result = await prisma.user.updateMany({
          where: {
            id: { in: ids },
          },
          data: updates,
        });

        // Audit log
        await AuditLogger.logBulkUpdate(
          'User',
          ids,
          updates,
          user.id,
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );

        return NextResponse.json({
          message: `Successfully updated ${result.count} users`,
          count: result.count,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: delete, update' },
          { status: 400 }
        );
    }
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

