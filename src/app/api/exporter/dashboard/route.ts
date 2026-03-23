import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Get exporter dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.role !== 'EXPORTER') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Exporter role required.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get exporter's business
    const business = await prisma.business.findFirst({
      where: { ownerId: decoded.userId },
    });

    if (!business) {
      return NextResponse.json({
        stats: {
          totalProducts: 0,
          verifiedProducts: 0,
          totalInquiries: 0,
          pendingInquiries: 0,
          profileViews: 0,
          businessVerified: false,
        },
      }, { status: 200, headers: corsHeaders });
    }

    // Get statistics
    const [
      totalProducts,
      verifiedProducts,
      totalInquiries,
      pendingInquiries,
      profileViews,
    ] = await Promise.all([
      prisma.product.count({
        where: { businessId: business.id },
      }),
      prisma.product.count({
        where: { businessId: business.id, verified: true },
      }),
      prisma.inquiry.count({
        where: { businessId: business.id },
      }),
      prisma.inquiry.count({
        where: { businessId: business.id, status: 'PENDING' },
      }),
      prisma.profileView.count({
        where: { businessId: business.id },
      }),
    ]);

    // Get recent inquiries
    const recentInquiries = await prisma.inquiry.findMany({
      where: { businessId: business.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get top products by views
    const topProducts = await prisma.product.findMany({
      where: { businessId: business.id },
      orderBy: { views: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        views: true,
        verified: true,
      },
    });

    return NextResponse.json({
      stats: {
        totalProducts,
        verifiedProducts,
        totalInquiries,
        pendingInquiries,
        profileViews,
        businessVerified: business.verificationStatus === 'APPROVED',
        verificationStatus: business.verificationStatus,
      },
      recentInquiries,
      topProducts,
      business: {
        id: business.id,
        name: business.name,
        verificationStatus: business.verificationStatus,
        featured: business.featured,
      },
    }, { status: 200, headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
