/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

// POST - Bulk verify or reject businesses
export const POST = requirePermission(
  Permission.BUSINESS_VERIFY,
  async (request, _context) => {
    try {
      const body = await request.json();
      const { businessIds, action } = body;
      let { status } = body;

      // Map action to status if action is provided
      if (action) {
        const actionMap: Record<string, string> = {
          'VERIFY': 'VERIFIED',
          'REJECT': 'REJECTED',
          'PENDING': 'PENDING',
          'UNDER_REVIEW': 'UNDER_REVIEW'
        };
        status = actionMap[action.toUpperCase()] || action;
      }

      if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
        return NextResponse.json(
          { error: 'Business IDs are required' },
          { status: 400, headers: corsHeaders }
        );
      }

      if (!status || !['VERIFIED', 'REJECTED', 'PENDING', 'UNDER_REVIEW'].includes(status)) {
        return NextResponse.json(
          { error: 'Valid status is required (VERIFIED, REJECTED, PENDING, UNDER_REVIEW)' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Update all businesses
      const updateResults = await Promise.all(
        businessIds.map(async (businessId) => {
          try {
            const business = await prisma.business.update({
              where: { id: businessId },
              data: {
                verificationStatus: status,
                // Unfeature on rejection or pending — must be re-verified and re-featured
                ...(['REJECTED', 'PENDING'].includes(status) && { featured: false, featuredAt: null, featuredBy: null }),
              },
            });
            return { id: businessId, success: true, business };
          } catch (error) {
            return { id: businessId, success: false, error: 'Business not found' };
          }
        })
      );

      const successful = updateResults.filter(r => r.success).length;
      const failed = updateResults.filter(r => !r.success).length;

      return NextResponse.json(
        {
          message: `Successfully updated ${successful} business(es)`,
          successful,
          failed,
          results: updateResults,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('[Bulk Verify] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update businesses' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
