/**
 * Admin User Analytics API
 * Returns detailed user statistics and analytics
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
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get user statistics using parallel queries for better performance
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { suspended: false },
      }),
      prisma.user.count({
        where: { suspended: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    // User growth over last 12 months - use raw query for proper date aggregation
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const userGrowth = await prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
      SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
      FROM users
      WHERE "createdAt" >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `;

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    return NextResponse.json({
      stats: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recentRegistrations,
        growth: userGrowth.map(m => ({
          month: m.month.toISOString(),
          count: Number(m.count),
        })),
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}
