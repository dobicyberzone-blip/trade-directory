import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') !== 'false';
    const includeCertifications = searchParams.get('includeCertifications') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const business = await prisma.business.findUnique({
      where: { id: resolvedParams.id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        products: includeProducts ? {
          take: limit,
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            price: true,
            unit: true,
            minOrder: true,
            availability: true,
            imageUrl: true, // This might contain base64, consider limiting
            createdAt: true,
            updatedAt: true,
          }
        } : false,
        certifications: includeCertifications ? {
          take: limit,
          select: {
            id: true,
            name: true,
            issuer: true,
            validUntil: true,
            imageUrl: true,
            logoUrl: true,
            createdAt: true,
          }
        } : false,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get rating statistics for this business
    const ratingStats = await prisma.rating.aggregate({
      where: { businessId: resolvedParams.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const businessWithRating = {
      ...business,
      averageRating: ratingStats._avg.rating ? Math.round(ratingStats._avg.rating * 10) / 10 : 0,
      totalRatings: ratingStats._count.rating || 0,
    };

    return NextResponse.json({ business: businessWithRating }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawData = await request.json();

    const existingBusiness = await prisma.business.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Filter to only allow valid Business fields to prevent Prisma errors
    const validFields = [
      'name', 'description', 'location', 'county', 'town', 'coordinates', 'sector',
      'contactEmail', 'contactPhone', 'companyEmail', 'mobileNumber', 'website', 'physicalAddress',
      'typeOfBusiness', 'businessUserOrganisation', 'companySize', 'numberOfEmployees',
      'registrationNumber', 'kraPin', 'taxId', 'exportLicense', 'licenceNumber', 'kenyanNationalId',
      'currentExportMarkets', 'companyStory', 'exportVolumePast3Years', 'productionCapacityPast3',
      'logoUrl', 'registrationCertificateUrl', 'pinCertificateUrl', 'exportLicenseUrl', 'taxCertificateUrl', 'verificationDocuments',
      'whatsappNumber', 'twitterUrl', 'instagramUrl',
      'verificationStatus', 'needsVerification', 'profileComplete', 'rating', 'featured'
    ];

    // Build filtered update data with only valid fields
    const body: Record<string, unknown> = {};
    const invalidFields: string[] = [];
    
    for (const field of Object.keys(rawData)) {
      if (validFields.includes(field)) {
        body[field] = rawData[field];
      } else {
        invalidFields.push(field);
      }
    }

    if (invalidFields.length > 0) {
    }

    const wasVerified = existingBusiness.verificationStatus === 'VERIFIED';

    // Check if any verification documents are being uploaded
    const hasDocuments = body.registrationCertificateUrl || body.pinCertificateUrl || 
                        body.exportLicenseUrl || body.taxCertificateUrl;

    const business = await prisma.business.update({
      where: { id: resolvedParams.id },
      data: {
        ...body,
        documentsUploadedAt: hasDocuments ? new Date() : existingBusiness.documentsUploadedAt,
        verificationStatus: wasVerified ? 'PENDING' : existingBusiness.verificationStatus,
        // Unfeature if sent back for re-verification — must be re-verified and re-featured by admin
        ...(wasVerified && { featured: false, featuredAt: null, featuredBy: null }),
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
        products: true,
        certifications: true,
      },
    });

    return NextResponse.json(
      {
        business,
        requiresReverification: wasVerified,
        message: wasVerified
          ? 'Business updated successfully. Your profile will need to be re-verified by an admin.'
          : 'Business updated successfully',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.business.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json(
      { message: 'Business deleted successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500, headers: corsHeaders }
    );
  }
}
