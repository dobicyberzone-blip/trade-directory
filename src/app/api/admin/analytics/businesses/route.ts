/**
 * Admin Business Analytics API
 * Returns detailed business statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(request);
    
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get business statistics using parallel queries for better performance
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalBusinesses,
      verifiedBusinesses,
      pendingBusinesses,
      rejectedBusinesses,
      featuredBusinesses,
      businessesBySector,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({
        where: { verificationStatus: 'APPROVED' },
      }),
      prisma.business.count({
        where: { verificationStatus: 'PENDING' },
      }),
      prisma.business.count({
        where: { verificationStatus: 'REJECTED' },
      }),
      prisma.business.count({
        where: { featured: true },
      }),
      prisma.business.groupBy({
        by: ['sector'],
        _count: true,
        where: {
          sector: { not: '' },
        },
      }),
    ]);

    // Recent businesses (last 30 days) - separate due to date dependency
    const recentBusinesses = await prisma.business.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return NextResponse.json({
      stats: {
        total: totalBusinesses,
        verified: verifiedBusinesses,
        pending: pendingBusinesses,
        rejected: rejectedBusinesses,
        featured: featuredBusinesses,
        bySector: businessesBySector.reduce((acc, item) => {
          if (item.sector) {
            acc[item.sector] = item._count as number;
          }
          return acc;
        }, {} as Record<string, number>),
        recentBusinesses,
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch business analytics' },
      { status: 500 }
    );
  }
}



