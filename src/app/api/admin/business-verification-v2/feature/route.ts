import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { AuditLogger } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  // Auth + RBAC
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(tokenPayload.role as any, Permission.BUSINESS_VERIFY)) {
    return NextResponse.json({ error: 'Forbidden — requires BUSINESS_VERIFY permission' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, featured } = body;

    if (!id || typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Business ID and featured status are required' },
        { status: 400 }
      );
    }

    // Fetch current business state
    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        featured: true,
        featuredAt: true,
        verificationStatus: true,
        ownerId: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // ── CORE RULE: only VERIFIED businesses may be featured ──
    if (featured && business.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        {
          error: 'Only verified exporters can be featured.',
          detail: `"${business.name}" has verification status "${business.verificationStatus}". Complete the verification process before enabling featuring.`,
        },
        { status: 422 }
      );
    }

    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: {
        featured,
        featuredAt: featured ? new Date() : null,
        featuredBy: featured ? tokenPayload.userId : null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        featured: true,
        featuredAt: true,
        verificationStatus: true,
        ownerId: true,
      },
    });

    // Audit log
    void AuditLogger.logUpdate(
      'Business',
      id,
      { featured: business.featured, featuredAt: business.featuredAt },
      { featured: updatedBusiness.featured, featuredAt: updatedBusiness.featuredAt },
      tokenPayload.userId,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    ).catch(() => {});

    // Notify business owner
    void prisma.notification.create({
      data: {
        userId: updatedBusiness.ownerId,
        title: featured ? '🌟 Your Business is Now Featured' : 'Business Removed from Featured',
        message: featured
          ? `Congratulations! Your verified business "${updatedBusiness.name}" has been featured on the KEPROBA Trade Directory homepage.`
          : `Your business "${updatedBusiness.name}" has been removed from the featured section.`,
        type: 'BUSINESS_VERIFICATION',
        urgency: 'MEDIUM',
        link: '/dashboard/exporter',
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Business ${featured ? 'featured' : 'unfeatured'} successfully`,
      business: updatedBusiness,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update featured status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
