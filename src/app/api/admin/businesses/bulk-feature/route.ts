import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; role: string };
    if ((decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// POST - Bulk feature/unfeature businesses
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { ids, featured } = body;

    if (!Array.isArray(ids) || ids.length === 0 || typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Business IDs array and featured status are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if all businesses exist and are approved
    const businesses = await prisma.business.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (businesses.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more businesses not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const unapprovedBusinesses = businesses.filter(b => b.verificationStatus !== 'APPROVED');
    if (unapprovedBusinesses.length > 0) {
      return NextResponse.json(
        { error: 'Only approved businesses can be featured' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update all businesses
    await prisma.business.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        featured,
        featuredAt: featured ? new Date() : null,
      },
    });

    // Create notifications for all business owners
    const notifications = businesses.map(business => ({
      userId: business.ownerId,
      title: featured ? 'Business Featured' : 'Business Unfeatured',
      message: featured
        ? `Congratulations! Your business "${business.name}" has been featured on the homepage.`
        : `Your business "${business.name}" is no longer featured on the homepage.`,
      type: 'BUSINESS_VERIFICATION' as const,
      urgency: 'MEDIUM' as const,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    return NextResponse.json(
      {
        count: businesses.length,
        message: `${businesses.length} business(es) ${featured ? 'featured' : 'unfeatured'} successfully`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500, headers: corsHeaders }
    );
  }
}



