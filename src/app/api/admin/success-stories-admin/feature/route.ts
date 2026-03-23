/**
 * Success Story Feature Toggle API
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, featured } = body;

    if (!id || typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Story ID and featured status are required' },
        { status: 400 }
      );
    }

    // Update SuccessStory.isFeatured field
    const updatedStory = await prisma.successStory.update({
      where: { id },
      data: {
        isFeatured: featured,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        isFeatured: true,
        isApproved: true,
        companyName: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Success story ${featured ? 'featured' : 'unfeatured'} successfully`,
      story: updatedStory,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update featured status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
