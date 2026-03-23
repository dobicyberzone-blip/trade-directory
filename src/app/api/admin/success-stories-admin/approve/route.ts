/**
 * Success Story Approval API
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Story ID and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'unapprove') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "unapprove"' },
        { status: 400 }
      );
    }

    const isApproved = action === 'approve';

    // Update SuccessStory.isApproved field
    const updatedStory = await prisma.successStory.update({
      where: { id },
      data: {
        isApproved,
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
      message: `Success story ${isApproved ? 'approved' : 'unapproved'} successfully`,
      story: updatedStory,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update approval status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
