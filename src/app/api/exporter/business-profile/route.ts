import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { sendBusinessDetailsUpdatedEmail, sendBusinessSubmittedEmail } from '@/lib/email-templates';
import { notifyNewExporterProfile, notifyExporterProfileAmendment } from '@/lib/admin-alerts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Get current user's business profile
export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const business = await prisma.business.findUnique({
      where: { ownerId: tokenPayload.userId },
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
        certifications: true, // Get certifications directly without nested certification
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // One-time dedup: remove duplicate certifications (same name+issuer) left by the old autosave bug
    const seen = new Set<string>();
    const duplicateIds: string[] = [];
    for (const cert of business.certifications) {
      const key = `${cert.name}|${cert.issuer}`;
      if (seen.has(key)) {
        duplicateIds.push(cert.id);
      } else {
        seen.add(key);
      }
    }
    if (duplicateIds.length > 0) {
      await prisma.businessCertification.deleteMany({ where: { id: { in: duplicateIds } } });
      // Reload with deduped certs
      const deduped = await prisma.business.findUnique({
        where: { ownerId: tokenPayload.userId },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
          certifications: true,
        },
      });
      return NextResponse.json({ business: deduped }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { business },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch business profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Create new business profile
export async function POST(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user already has a business
    const existingBusiness = await prisma.business.findUnique({
      where: { ownerId: tokenPayload.userId },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'Business profile already exists' },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = await request.json();

    // Extract certifications if provided
    const { certifications, ...businessData } = data;

    // Check for duplicate business name (case-insensitive)
    if (businessData.name) {
      const nameTaken = await prisma.business.findFirst({
        where: { name: { equals: businessData.name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (nameTaken) {
        return NextResponse.json(
          { error: `A business named "${businessData.name}" is already registered. Please use a unique business name.` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Debug logging for the three fields of interest

    // Calculate profile completion
    const requiredFields = [
      'kenyanNationalId', 'name', 'logoUrl',
      'numberOfEmployees', 'kraPin', 'sector', 'businessUserOrganisation',
      'registrationCertificateUrl', 'pinCertificateUrl', 'exportLicense',
      'town', 'county', 'physicalAddress', 'contactPhone', 'companyEmail'
    ];

    const completedFields = requiredFields.filter(field => businessData[field]).length;
    const profileComplete = completedFields === requiredFields.length;

    const business = await prisma.business.create({
      data: {
        // Basic Details
        kenyanNationalId: businessData.kenyanNationalId,
        name: businessData.name,
        logoUrl: businessData.logoUrl,
        
        // Business Details
        businessPurpose: businessData.businessPurpose,
        typeOfBusiness: businessData.typeOfBusiness,
        serviceOffering: [businessData.goods, businessData.services].filter(Boolean).join(', ') || businessData.serviceOffering,
        dateOfIncorporation: businessData.dateOfIncorporation,
        legalStructure: businessData.legalStructure,
        numberOfEmployees: businessData.numberOfEmployees,
        companySize: businessData.companySize,
        registrationNumber: businessData.registrationNumber,
        exportLicense: businessData.exportLicense,
        kraPin: businessData.kraPin,
        sector: businessData.sector,
        industry: businessData.industry,
        businessUserOrganisation: businessData.businessUserOrganisation,
        shareholders: businessData.shareholders,
        managementTeam: businessData.managementTeam,
        primaryContactFirstName: businessData.primaryContactFirstName,
        primaryContactLastName: businessData.primaryContactLastName,
        
        // Documents
        registrationCertificateUrl: businessData.registrationCertificateUrl,
        pinCertificateUrl: businessData.pinCertificateUrl,
        kenyanNationalIdUrl: businessData.kenyanNationalIdUrl,
        incorporationCertificateUrl: businessData.incorporationCertificateUrl,
        exportLicenseUrl: businessData.exportLicenseUrl,
        otherDocuments: businessData.otherDocuments ?? null,
        documentsUploadedAt: new Date(),
        
        // Location & Contact
        licenceNumber: businessData.exportLicense || businessData.licenceNumber,
        town: businessData.town,
        county: businessData.county,
        location: `${businessData.town}, ${businessData.county}`,
        physicalAddress: businessData.physicalAddress,
        website: businessData.website,
        contactEmail: businessData.companyEmail,
        contactPhone: businessData.contactPhone,
        mobileNumber: businessData.mobileNumber,
        companyEmail: businessData.companyEmail,
        whatsappNumber: businessData.whatsappNumber,
        
        // Social Media
        twitterUrl: businessData.twitterUrl,
        instagramUrl: businessData.instagramUrl,
        facebookUrl: businessData.facebookUrl,
        linkedInUrl: businessData.linkedInUrl,
        youtubeUrl: businessData.youtubeUrl,
        tiktokUrl: businessData.tiktokUrl,
        pinterestUrl: businessData.pinterestUrl,
        snapchatUrl: businessData.snapchatUrl,
        telegramUrl: businessData.telegramUrl,
        
        // Location GPS
        coordinates: businessData.coordinates,
        
        // Company Capacity
        exportVolumePast3Years: businessData.exportVolumePast3Years,
        currentExportMarkets: Array.isArray(businessData.currentExportMarkets) 
          ? businessData.currentExportMarkets.join(', ')
          : businessData.currentExportMarkets,
        productionCapacityPast3: businessData.productionCapacityPast3,
        
        // Company Story
        companyStory: businessData.companyStory,
        
        // System fields
        ownerId: tokenPayload.userId,
        profileComplete,
        verificationStatus: 'PENDING',
        needsVerification: false,
        
        // Create certifications if provided
        certifications: certifications && Array.isArray(certifications) ? {
          create: certifications.map((cert: any) => ({
            name: cert.name,
            issuer: cert.issuer,
            imageUrl: cert.imageUrl,
            logoUrl: cert.logoUrl,
            validUntil: cert.validUntil ? new Date(cert.validUntil) : null,
          }))
        } : undefined,
      },
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
        certifications: true,
      },
    });

    // TradeDir.BR.03 — Send confirmation email to exporter on profile submission
    void sendBusinessSubmittedEmail(
      business.owner.email,
      business.owner.firstName,
      business.name
    ).catch(() => {});

    // Notify all admins — new business pending verification
    void notifyNewExporterProfile(
      business.id,
      business.name,
      business.owner.email,
      `${business.owner.firstName} ${business.owner.lastName}`
    ).catch(() => {});

    return NextResponse.json(
      { 
        business,
        message: 'Business profile created successfully'
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create business profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}
// Fields owned by the Exporter Registration flow — never updatable via business-profile API
// Only business name and registration number are truly immutable
const REGISTRATION_OWNED_FIELDS = [
  'name',
  'registrationNumber',
] as const;

export async function PUT(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { ownerId: tokenPayload.userId },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const data = await request.json();

    // Extract certifications if provided
    const { certifications, ...businessData } = data;

    // Strip any registration-owned fields from the update payload — they cannot be changed here
    for (const field of REGISTRATION_OWNED_FIELDS) {
      delete businessData[field];
    }

    // Debug logging for the three fields of interest

    // Canonical required fields — must match dashboard and form
    const editableRequiredFields = [
      'kenyanNationalId', 'logoUrl',
      'numberOfEmployees', 'kraPin',
      'registrationCertificateUrl', 'pinCertificateUrl', 'exportLicense',
    ];
    const regOwnedRequired = ['name', 'sector', 'town', 'county', 'physicalAddress', 'contactPhone', 'companyEmail'];
    const editableComplete = editableRequiredFields.filter(f => businessData[f] ?? existingBusiness[f as keyof typeof existingBusiness]).length;
    const regOwnedComplete = regOwnedRequired.filter(f => existingBusiness[f as keyof typeof existingBusiness]).length;
    const profileComplete = (editableComplete + regOwnedComplete) === (editableRequiredFields.length + regOwnedRequired.length);

    // If business was APPROVED/VERIFIED, any edit sends it back for re-verification
    const wasVerified = ['APPROVED', 'VERIFIED'].includes(existingBusiness.verificationStatus || '');
    const newVerificationStatus = wasVerified ? 'PENDING' : existingBusiness.verificationStatus;
    const needsVerification = wasVerified;

    // Handle certifications update — only when explicitly flagged to avoid duplication on autosave
    let certificationsToCreate: any[] = [];
    const shouldUpdateCertifications = 
      certifications !== undefined && 
      Array.isArray(certifications) && 
      businessData._certificationsUpdated === true;

    if (shouldUpdateCertifications) {
      // Delete all existing and replace with the new set
      await prisma.businessCertification.deleteMany({
        where: { businessId: existingBusiness.id },
      });
      
      certificationsToCreate = certifications.map((cert: any) => ({
        name: cert.name,
        issuer: cert.issuer,
        imageUrl: cert.imageUrl || '',
        logoUrl: cert.logoUrl || '',
        validUntil: cert.validUntil ? new Date(cert.validUntil) : null,
      }));
    }

    const business = await prisma.business.update({
      where: { ownerId: tokenPayload.userId },
      data: {
        // Basic Details (editable)
        kenyanNationalId: businessData.kenyanNationalId,
        logoUrl: businessData.logoUrl,
        
        // Business Details (editable only)
        typeOfBusiness: businessData.typeOfBusiness || businessData.legalStructure,
        legalStructure: businessData.legalStructure || businessData.typeOfBusiness,
        numberOfEmployees: businessData.numberOfEmployees,
        companySize: businessData.companySize,
        kraPin: businessData.kraPin,
        exportLicense: businessData.exportLicense,
        businessUserOrganisation: businessData.businessUserOrganisation,
        productHsCode: businessData.productHsCode,
        shareholders: businessData.shareholders,
        managementTeam: businessData.managementTeam,
        
        // Documents (editable)
        registrationCertificateUrl: businessData.registrationCertificateUrl,
        pinCertificateUrl: businessData.pinCertificateUrl,
        kenyanNationalIdUrl: businessData.kenyanNationalIdUrl,
        incorporationCertificateUrl: businessData.incorporationCertificateUrl,
        exportLicenseUrl: businessData.exportLicenseUrl,
        otherDocuments: businessData.otherDocuments ?? null,
        documentsUploadedAt: wasVerified ? new Date() : existingBusiness.documentsUploadedAt,
        
        // Location & Contact (editable only)
        licenceNumber: businessData.exportLicense || businessData.licenceNumber,
        website: businessData.website,
        mobileNumber: businessData.mobileNumber,
        whatsappNumber: businessData.whatsappNumber,
        
        // Social Media (editable)
        twitterUrl: businessData.twitterUrl,
        instagramUrl: businessData.instagramUrl,
        facebookUrl: businessData.facebookUrl,
        linkedInUrl: businessData.linkedInUrl,
        youtubeUrl: businessData.youtubeUrl,
        tiktokUrl: businessData.tiktokUrl,
        pinterestUrl: businessData.pinterestUrl,
        snapchatUrl: businessData.snapchatUrl,
        telegramUrl: businessData.telegramUrl,
        
        // Location GPS (editable)
        coordinates: businessData.coordinates,
        
        // Company Capacity (editable)
        exportVolumePast3Years: businessData.exportVolumePast3Years,
        currentExportMarkets: Array.isArray(businessData.currentExportMarkets) 
          ? businessData.currentExportMarkets.join(', ')
          : businessData.currentExportMarkets,
        productionCapacityPast3: businessData.productionCapacityPast3,
        
        // Company Story (editable)
        companyStory: businessData.companyStory,
        
        // System fields
        profileComplete,
        verificationStatus: newVerificationStatus,
        needsVerification: needsVerification,
        
        // Create new certifications if we have any
        ...(certificationsToCreate.length > 0 && {
          certifications: {
            create: certificationsToCreate
          }
        }),
      },
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
        certifications: true, // Get certifications directly
      },
    });

    const message = wasVerified
      ? 'Business profile updated successfully. Your profile will need to be re-verified by an admin.'
      : 'Business profile updated successfully';

    // Create notification if reverification is needed
    if (wasVerified) {
      await prisma.notification.create({
        data: {
          userId: tokenPayload.userId,
          title: 'Business Profile Requires Re-verification',
          message: `Your business "${business.name}" has been updated and requires admin re-verification before appearing in the directory.`,
          type: 'BUSINESS_VERIFICATION',
          urgency: 'MEDIUM',
        },
      });

      // Notify admins — amended profile needs re-verification
      void notifyExporterProfileAmendment(
        business.id,
        business.name,
        business.owner?.email || '',
        Object.keys(businessData).filter(k => businessData[k] !== undefined),
        `${business.owner?.firstName} ${business.owner?.lastName}`
      ).catch(() => {});
    }

    // Send business update email only on explicit final save (not autosave)
    if (business.owner && data._isFinalSave === true) {
      void sendBusinessDetailsUpdatedEmail(
        business.owner.email,
        business.owner.firstName,
        business.name,
        ['Business profile updated']
      ).catch(err => console.error('[Business Update] Failed to send email:', err));

      // In-app notification for every final save (re-verification notification already sent above if applicable)
      if (!wasVerified) {
        void prisma.notification.create({
          data: {
            userId: tokenPayload.userId,
            title: 'Business Profile Updated',
            message: `Your business profile "${business.name}" was updated successfully on ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}.`,
            type: 'PROFILE_UPDATE',
            urgency: 'LOW',
            link: '/dashboard/exporter/business-profile',
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json(
      { 
        business,
        message,
        requiresReverification: wasVerified
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}