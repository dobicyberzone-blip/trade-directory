/**
 * Business Verification API v2 - Production Ready
 * Correctly mapped to Prisma Business schema
 * Includes enhanced verification decision logic with field validation
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendBusinessVerificationApprovedEmail, sendBusinessVerificationRejectedEmail, sendBusinessSuspendedEmail } from '@/lib/email-templates';
import { verifyToken } from '@/lib/auth-utils';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { notifyAdminsVerificationCompleted } from '@/lib/admin-alerts';

// Verification validation criteria
const VERIFICATION_CRITERIA = {
  requiredDocuments: [
    'registrationCertificateUrl',
    'pinCertificateUrl',
  ],
  requiredFields: [
    'name',
    'registrationNumber',
    'kraPin',
    'contactEmail',
    'sector',
    'physicalAddress',
    'county',
    'town',
  ],
  optionalDocuments: [
    'kenyanNationalIdUrl',
    'incorporationCertificateUrl',
    'exportLicenseUrl',
  ],
};

/**
 * Validate business verification criteria
 * Returns validation result with missing items
 */
async function validateBusinessForVerification(businessId: string): Promise<{
  isValid: boolean;
  missingRequiredFields: string[];
  missingDocuments: string[];
  warnings: string[];
}> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      name: true,
      registrationNumber: true,
      kraPin: true,
      contactEmail: true,
      sector: true,
      physicalAddress: true,
      county: true,
      town: true,
      companyEmail: true,
      contactPhone: true,
      registrationCertificateUrl: true,
      pinCertificateUrl: true,
      kenyanNationalIdUrl: true,
      incorporationCertificateUrl: true,
      exportLicenseUrl: true,
      industry: true,
      legalStructure: true,
    },
  });

  if (!business) {
    return {
      isValid: false,
      missingRequiredFields: [],
      missingDocuments: [],
      warnings: ['Business not found'],
    };
  }

  const missingRequiredFields: string[] = [];
  const missingDocuments: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of VERIFICATION_CRITERIA.requiredFields) {
    const value = business[field as keyof typeof business];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingRequiredFields.push(field);
    }
  }

  // Check required documents
  for (const doc of VERIFICATION_CRITERIA.requiredDocuments) {
    const value = business[doc as keyof typeof business];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingDocuments.push(doc);
    }
  }

  // Add warnings for optional but recommended items
  for (const doc of VERIFICATION_CRITERIA.optionalDocuments) {
    const value = business[doc as keyof typeof business];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      warnings.push(`Missing optional document: ${doc.replace('Url', '')}`);
    }
  }

  // Validate KRA PIN format (Kenyan KRA PIN format: A0000000000)
  if (business.kraPin && !/^A\d{9,11}$/.test(business.kraPin)) {
    warnings.push('KRA PIN format may be invalid');
  }

  // Validate registration number format
  if (business.registrationNumber && business.registrationNumber.length < 5) {
    warnings.push('Registration number appears too short');
  }

  return {
    isValid: missingRequiredFields.length === 0 && missingDocuments.length === 0,
    missingRequiredFields,
    missingDocuments,
    warnings,
  };
}

// GET: Fetch businesses for verification with correct schema mapping
export async function GET(request: NextRequest) {
  // RBAC: Check authentication and authorization
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(tokenPayload.role as any, Permission.BUSINESS_VIEW)) {
    return NextResponse.json({ error: 'Forbidden - Requires BUSINESS_VIEW permission' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sector = searchParams.get('sector') || '';
    const county = searchParams.get('county') || '';
    const featured = searchParams.get('featured') || '';
    const minRating = searchParams.get('minRating') || '';
    const publishedParam = searchParams.get('published');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by verificationStatus (correct schema field)
    if (status && status !== 'all') {
      where.verificationStatus = status;
    }

    // Advanced filters
    if (sector) {
      where.sector = sector;
    }

    if (county) {
      where.county = county;
    }

    if (featured) {
      where.featured = featured === 'true';
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (publishedParam !== null && publishedParam !== undefined && publishedParam !== '') {
      where.published = publishedParam === 'true';
    }

    // Get total count
    const total = await prisma.business.count({ where });

    // Optimized query - prevent N+1, include owner relation
    const businesses = await prisma.business.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sortField]: sortOrder },
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
        certifications: {
          select: {
            id: true,
            name: true,
            issuer: true,
            logoUrl: true,
            imageUrl: true,
            validUntil: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            products: true,
            certifications: true,
            ratings: true,
          },
        },
      },
    });

    // Calculate average rating for each business
    const businessesWithRating = businesses.map(business => {
      const ratings = business.ratings || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

      // Remove the ratings array and add calculated rating
      const { ratings: _, ...businessData } = business;
      
      return {
        ...businessData,
        rating: averageRating > 0 ? Number(averageRating.toFixed(1)) : null,
        totalRatings,
      };
    });

    return NextResponse.json({
      data: businessesWithRating,
      total,
      page,
      pageSize,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch businesses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH: Update business verification status
export async function PATCH(request: NextRequest) {
  // RBAC: Check authentication and authorization
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(tokenPayload.role as any, Permission.BUSINESS_VERIFY)) {
    return NextResponse.json({ error: 'Forbidden - Requires BUSINESS_VERIFY permission' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, action, notes, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Handle direct status update
    if (status && !action) {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'VERIFIED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: PENDING, APPROVED, REJECTED, VERIFIED' },
          { status: 400 }
        );
      }

      const updatedBusiness = await prisma.business.update({
        where: { id },
        data: {
          verificationStatus: status,
          needsVerification: status === 'PENDING',
          verificationNotes: notes || undefined,
          // Unfeature if sent back to PENDING or REJECTED — must be re-verified first
          ...((['PENDING', 'REJECTED'].includes(status)) && { featured: false, featuredAt: null, featuredBy: null }),
          updatedAt: new Date(),
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

      // Send suspension email if status is SUSPENDED
      if (status === 'SUSPENDED' && updatedBusiness.owner?.email) {
        void sendBusinessSuspendedEmail(
          updatedBusiness.owner.email,
          updatedBusiness.owner.firstName,
          updatedBusiness.name,
          notes
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Business status updated to ${status}`,
        business: updatedBusiness,
      });
    }

    // Handle approve/reject actions
    if (!action) {
      return NextResponse.json(
        { error: 'Action or status is required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'togglePublish', 'validate'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve", "reject", "togglePublish", or "validate"' },
        { status: 400 }
      );
    }

    // Handle validate action - check if business meets verification criteria
    if (action === 'validate') {
      const validation = await validateBusinessForVerification(id);
      return NextResponse.json({
        success: true,
        validation,
        message: validation.isValid
          ? 'Business meets all verification criteria'
          : 'Business does not meet verification criteria',
      });
    }

    // Handle togglePublish action
    if (action === 'togglePublish') {
      const { published } = body;
      const updatedBusiness = await prisma.business.update({
        where: { id },
        data: { published: published === true, updatedAt: new Date() },
        select: { id: true, name: true, published: true },
      });
      return NextResponse.json({
        success: true,
        message: updatedBusiness.published ? 'Business published successfully' : 'Business unpublished successfully',
        business: updatedBusiness,
      });
    }

    // Get current business
    const currentBusiness = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!currentBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Update verificationStatus (correct schema field)
    // VERIFIED = approved and shows badge in directory
    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';
    const updateData: any = {
      verificationStatus: newStatus,
      needsVerification: false,
      // Unfeature on rejection — must be re-verified and re-featured by admin
      ...(action === 'reject' && { featured: false, featuredAt: null, featuredBy: null }),
      updatedAt: new Date(),
    };

    // Validate before approval
    if (action === 'approve') {
      const validation = await validateBusinessForVerification(id);
      
      // Include validation results in response for admin awareness
      body.validation = validation;
      
      // If business doesn't meet criteria, add warning to notes but still allow approval
      // (admins may override in special cases)
      if (!validation.isValid) {
        const missingItems = [
          ...validation.missingRequiredFields.map(f => `Missing field: ${f}`),
          ...validation.missingDocuments.map(d => `Missing document: ${d.replace('Url', '')}`),
        ].join('; ');
        
        // Add validation warning to verification notes
        updateData.verificationNotes = notes
          ? `${notes}\n\n[Auto-validated] Issues found: ${missingItems}`
          : `[Auto-validated] Issues found: ${missingItems}`;
      } else if (validation.warnings.length > 0) {
        // Add warnings even if validation passed
        updateData.verificationNotes = notes
          ? `${notes}\n\n[Validation Warnings] ${validation.warnings.join('; ')}`
          : `[Validation Warnings] ${validation.warnings.join('; ')}`;
      } else if (notes) {
        updateData.verificationNotes = notes;
      }
    } else if (notes) {
      // For rejection, add notes if provided
      updateData.verificationNotes = notes;
    }

    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        certifications: true,
        _count: {
          select: {
            products: true,
            certifications: true,
            ratings: true,
          },
        },
      },
    });

    // Create notification for business owner
    await prisma.notification.create({
      data: {
        userId: currentBusiness.ownerId,
        title: action === 'approve' ? '🎉 Business Verified — Full Access Unlocked' : 'Business Verification Rejected',
        message: action === 'approve'
          ? `Congratulations, ${currentBusiness.owner?.firstName}! Your business "${currentBusiness.name}" has been verified on ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}. Your profile is now live in the Trade Directory and buyers can find and contact you directly.${notes ? ` Admin note: ${notes}` : ''}`
          : `Your business "${currentBusiness.name}" verification was not approved on ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}.${notes ? ` Reason: ${notes}` : ''} Please update your business details and resubmit.`,
        type: 'BUSINESS_VERIFICATION',
        urgency: action === 'approve' ? 'MEDIUM' : 'HIGH',
        link: action === 'reject' ? '/dashboard/exporter/business-profile' : '/dashboard/exporter',
      },
    });

    // TradeDir.Admin.04 / TradeDir.BR.04 — Send email on approval or rejection
    if (currentBusiness.owner?.email) {
      if (action === 'approve') {
        void sendBusinessVerificationApprovedEmail(
          currentBusiness.owner.email,
          currentBusiness.owner.firstName,
          currentBusiness.name
        ).catch(() => {});

        // Notify all admins — verification completed (fire-and-forget)
        void notifyAdminsVerificationCompleted(
          currentBusiness.id,
          currentBusiness.name,
          `${currentBusiness.owner.firstName} ${currentBusiness.owner.lastName}`.trim(),
          currentBusiness.owner.email,
          tokenPayload.userId,
          tokenPayload.email   // used as verifiedByAdminName fallback
        ).catch(() => {});
      } else {
        void sendBusinessVerificationRejectedEmail(
          currentBusiness.owner.email,
          currentBusiness.owner.firstName,
          currentBusiness.name,
          notes || 'Please review your submission and ensure all required documents are valid and complete.'
        ).catch(() => {});
      }
    }

    // Include validation results in response if approval action
    const response: any = {
      success: true,
      message: `Business ${action === 'approve' ? 'verified' : 'rejected'} successfully`,
      business: updatedBusiness,
    };

    // Add validation info to response for admin awareness
    if (action === 'approve' && body.validation) {
      response.validation = body.validation;
      response.validationPerformed = true;
    }

    return NextResponse.json(response);
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update business', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete business
export async function DELETE(request: NextRequest) {
  // RBAC: Check authentication and authorization
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(tokenPayload.role as any, Permission.BUSINESS_DELETE)) {
    return NextResponse.json({ error: 'Forbidden - Requires BUSINESS_DELETE permission' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    await prisma.business.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Business deleted successfully' 
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to delete business', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
