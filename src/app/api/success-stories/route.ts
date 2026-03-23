import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { sendSuccessStorySubmittedEmail } from '@/lib/email-templates';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Fetch success stories (public for featured, all for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const approved = searchParams.get('approved');
    
    // Check if user is admin
    let isAdmin = false;
    try {
      const tokenPayload = await verifyToken(request);
      if (tokenPayload) {
        const user = await prisma.user.findUnique({
          where: { id: tokenPayload.userId },
          select: { role: true },
        });
        isAdmin = user?.role === 'ADMIN';
      }
    } catch {
      // Not authenticated, continue as public user
    }

    const where: any = {};
    
    // Public users only see approved stories
    if (!isAdmin) {
      where.isApproved = true;
    }
    
    // Filter by featured - for home page, must be both approved AND featured
    if (featured === 'true') {
      where.isFeatured = true;
      // Ensure featured stories are also approved for public display
      if (!isAdmin) {
        where.isApproved = true;
      }
    }
    
    // Filter by approved status (admin only)
    if (isAdmin && approved !== null) {
      where.isApproved = approved === 'true';
    }

    const stories = await prisma.successStory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(
      { stories },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch success stories' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Create new success story (authenticated users)
export async function POST(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const {
      title,
      story,
      companyName,
      buyerName,
      buyerTitle,
      exporterName,
      productCategory,
      exportValue,
      exportDestination,
      imageUrl,
    } = body;

    // Validate required fields
    if (!title || !story || !companyName || !buyerName || !exporterName || !productCategory || !exportDestination) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    const successStory = await prisma.successStory.create({
      data: {
        title,
        story,
        companyName,
        buyerName,
        buyerTitle,
        exporterName,
        productCategory,
        exportValue,
        exportDestination,
        imageUrl,
        userId: tokenPayload.userId,
        isApproved: false,
        isFeatured: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send confirmation email (async, don't wait)
    if (successStory.user) {
      void sendSuccessStorySubmittedEmail(
        successStory.user.email,
        successStory.user.firstName,
        title
      ).catch(err => console.error('[Success Story] Failed to send email:', err));
    }

    return NextResponse.json(
      {
        message: 'Success story submitted successfully. It will be reviewed by admin.',
        story: successStory,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create success story' },
      { status: 500, headers: corsHeaders }
    );
  }
}
