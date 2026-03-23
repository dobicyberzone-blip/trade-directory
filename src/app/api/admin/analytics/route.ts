import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/analytics
 * Fetch analytics data for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'week'; // week, month

    // Calculate date range
    const now = new Date();
    const daysAgo = period === 'month' ? 30 : 7;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Fetch analytics data from database
    const [
      totalUsers,
      newUsers,
      totalBusinesses,
      newBusinesses,
      totalProducts,
      newProducts,
      totalInquiries,
      newInquiries,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.business.count(),
      prisma.business.count({ where: { createdAt: { gte: startDate } } }),
      prisma.product.count(),
      prisma.product.count({ where: { createdAt: { gte: startDate } } }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { createdAt: { gte: startDate } } }),
    ]);

    const analyticsData = {
      users: { total: totalUsers, new: newUsers },
      businesses: { total: totalBusinesses, new: newBusinesses },
      products: { total: totalProducts, new: newProducts },
      inquiries: { total: totalInquiries, new: newInquiries },
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
      },
      { status: 500 }
    );
  }
}
