/**
 * Super Admin Business Delete API
 * DELETE /api/admin/businesses/[id]/delete
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { logAuditAction } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await verifyToken(request);
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Only super admins can delete businesses
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403, headers: corsHeaders });
    }

    const { id: businessId } = await params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404, headers: corsHeaders });
    }

    await prisma.business.delete({ where: { id: businessId } });

    await logAuditAction({
      userId: token.userId,
      action: 'BUSINESS_DELETED',
      resourceType: 'BUSINESS',
      resourceId: businessId,
      changes: { name: business.name, ownerId: business.ownerId },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Business deleted successfully' }, { headers: corsHeaders });
  } catch (error) {
    console.error('[Business Delete]', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500, headers: corsHeaders });
  }
}
