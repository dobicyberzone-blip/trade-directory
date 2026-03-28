/**
 * Admin Individual Business Management API
 * PATCH operations for featured status
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';
import prisma from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit-logger';
import { sendBusinessVerificationApprovedEmail, sendBusinessVerificationRejectedEmail } from '@/lib/email-templates';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const updateBusinessSchema = z.object({
  featured: z.boolean().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  verificationStatus: z.enum(['VERIFIED', 'REJECTED', 'PENDING', 'UNDER_REVIEW']).optional(),
});

// PATCH /api/admin/businesses/[id] - Update business
// FIXED: Use BUSINESS_EDIT instead of BUSINESS_FEATURE since we allow editing name, description, verificationStatus
export const PATCH = requirePermission(
  Permission.BUSINESS_EDIT,
  async (request, _context) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const businessId = pathParts[pathParts.length - 1];
      
      if (!businessId) {
        return NextResponse.json(
          { error: 'Business ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      const body = await request.json();
      const validatedData = updateBusinessSchema.parse(body);

      // Check if business exists
      const existingBusiness = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!existingBusiness) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      
      if (validatedData.featured !== undefined) {
        updateData.featured = validatedData.featured;
        if (validatedData.featured) {
          updateData.featuredAt = new Date();
          updateData.featuredBy = request.user?.userId;
        } else {
          updateData.featuredAt = null;
          updateData.featuredBy = null;
        }
      }
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.description) updateData.description = validatedData.description;
      if (validatedData.verificationStatus) {
        updateData.verificationStatus = validatedData.verificationStatus;
        // Unfeature on rejection or pending — must be re-verified and re-featured by admin
        if (['REJECTED', 'PENDING'].includes(validatedData.verificationStatus)) {
          updateData.featured = false;
          updateData.featuredAt = null;
          updateData.featuredBy = null;
        }
      }

      // Update business
      const updatedBusiness = await prisma.business.update({
        where: { id: businessId },
        data: updateData,
        include: {
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Send email notification if verification status changed
      if (validatedData.verificationStatus && validatedData.verificationStatus !== existingBusiness.verificationStatus) {
        const owner = updatedBusiness.owner;
        
        if (validatedData.verificationStatus === 'VERIFIED') {
          // Send approval email
          void sendBusinessVerificationApprovedEmail(
            owner.email,
            owner.firstName,
            updatedBusiness.name
          ).catch(err => console.error('[Business Verification] Failed to send approval email:', err));
        } else if (validatedData.verificationStatus === 'REJECTED') {
          // Send rejection email with reason
          const reason = body.rejectionReason || 'Please review your business information and documents';
          void sendBusinessVerificationRejectedEmail(
            owner.email,
            owner.firstName,
            updatedBusiness.name,
            reason
          ).catch(err => console.error('[Business Verification] Failed to send rejection email:', err));
        }
      }

      await logAuditAction({
        userId: request.user?.userId || 'unknown',
        action: 'BUSINESS_UPDATED',
        resourceType: 'BUSINESS',
        resourceId: businessId,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        message: 'Business updated successfully',
        business: updatedBusiness,
      }, { headers: corsHeaders });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update business' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// GET /api/admin/businesses/[id] - Get business details
export const GET = requirePermission(
  Permission.BUSINESS_VIEW,
  async (request, _context) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const businessId = pathParts[pathParts.length - 1];
      
      if (!businessId) {
        return NextResponse.json(
          { error: 'Business ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          products: {
            take: 10,
            select: {
              id: true,
              name: true,
              category: true,
              verified: true,
            },
          },
          certifications: {
            select: {
              id: true,
              name: true,
              issuer: true,
              validUntil: true,
            },
          },
          _count: {
            select: {
              products: true,
              favorites: true,
              ratings: true,
            },
          },
        },
      });

      if (!business) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      await logAuditAction({
        userId: request.user?.userId || 'unknown',
        action: 'BUSINESS_VIEWED',
        resourceType: 'BUSINESS',
        resourceId: businessId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ business }, { headers: corsHeaders });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch business' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
