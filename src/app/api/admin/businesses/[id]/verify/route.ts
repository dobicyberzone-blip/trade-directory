/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PUT - Update business verification status
export const PUT = requirePermission(
  Permission.BUSINESS_VERIFY,
  async (request, { params }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { status } = body;

      if (!status || !['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be VERIFIED, REJECTED, or PENDING' },
          { status: 400, headers: corsHeaders }
        );
      }

      const business = await prisma.business.update({
        where: { id },
        data: { verificationStatus: status },
      });

      return NextResponse.json(
        { business, message: `Business ${status.toLowerCase()} successfully` },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('[Business Verify] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update business status' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
