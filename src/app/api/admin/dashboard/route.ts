/**
 * Admin Dashboard Statistics API
 * Returns overview statistics for admin dashboard
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
    
    if (!decoded || decoded.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get statistics using parallel queries for better performance
    const [
      totalUsers,
      totalBusinesses,
      totalProducts,
      pendingBusinesses,
      unverifiedProducts,
      totalInquiries,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.product.count(),
      prisma.business.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.product.count({ where: { verified: false } }),
      prisma.inquiry.count(),
    ]);

    // Get user breakdown by role - parallel with other queries
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Get recent activity (last 30 days) - all in parallel
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsers, recentBusinesses, recentProducts] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.business.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.product.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        overview: {
          totalUsers,
          totalBusinesses,
          totalProducts,
          totalInquiries,
        },
        pending: {
          pendingBusinesses,
          unverifiedProducts,
        },
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recentActivity: {
          newUsers: recentUsers,
          newBusinesses: recentBusinesses,
          newProducts: recentProducts,
        },
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

