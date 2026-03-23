import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST - Feature/Unfeature a business
export const POST = requirePermission(
  Permission.BUSINESS_FEATURE,
  async (request, _context) => {
    try {
      const body = await request.json();
      const { id, featured } = body;

      if (!id || typeof featured !== 'boolean') {
        return NextResponse.json(
          { error: 'Business ID and featured status are required' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check if business exists and is verified
      const existingBusiness = await prisma.business.findUnique({
        where: { id },
      });

      if (!existingBusiness) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // FIXED: Use 'VERIFIED' instead of 'APPROVED' to match the schema
      if (existingBusiness.verificationStatus !== 'VERIFIED') {
        return NextResponse.json(
          { error: 'Only verified businesses can be featured' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Update business
      const business = await prisma.business.update({
        where: { id },
        data: {
          featured,
          featuredAt: featured ? new Date() : null,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create notification for business owner
      await prisma.notification.create({
        data: {
          userId: business.ownerId,
          title: featured ? 'Business Featured' : 'Business Unfeatured',
          message: featured
            ? `Congratulations! Your business "${business.name}" has been featured on the homepage.`
            : `Your business "${business.name}" is no longer featured on the homepage.`,
          type: 'BUSINESS_VERIFICATION',
          urgency: 'MEDIUM',
        },
      });

      return NextResponse.json(
        {
          business,
          message: `Business ${featured ? 'featured' : 'unfeatured'} successfully`,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('[Feature Business] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update featured status' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
