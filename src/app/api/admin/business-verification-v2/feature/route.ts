import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, featured } = body;

    if (!id || typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Business ID and featured status are required' },
        { status: 400 }
      );
    }

    // Update Business.featured field
    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: {
        featured,
        featuredAt: featured ? new Date() : null,
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

    // Notify business owner
    await prisma.notification.create({
      data: {
        userId: updatedBusiness.ownerId,
        title: featured ? 'Business Featured' : 'Business Unfeatured',
        message: featured
          ? `Congratulations! Your business "${updatedBusiness.name}" has been featured on the homepage.`
          : `Your business "${updatedBusiness.name}" is no longer featured on the homepage.`,
        type: 'BUSINESS_VERIFICATION',
        urgency: 'MEDIUM',
      },
    });

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
