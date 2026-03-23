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

// GET - Get profile views analytics
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
        views: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          recentViews: [],
        },
      }, { status: 200, headers: corsHeaders });
    }

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get view counts
    const [totalViews, todayViews, weekViews, monthViews] = await Promise.all([
      prisma.profileView.count({
        where: { businessId: business.id },
      }),
      prisma.profileView.count({
        where: {
          businessId: business.id,
          viewedAt: { gte: todayStart },
        },
      }),
      prisma.profileView.count({
        where: {
          businessId: business.id,
          viewedAt: { gte: weekStart },
        },
      }),
      prisma.profileView.count({
        where: {
          businessId: business.id,
          viewedAt: { gte: monthStart },
        },
      }),
    ]);

    // Get recent views with details
    const recentViews = await prisma.profileView.findMany({
      where: { businessId: business.id },
      include: {
        viewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            country: true,
            role: true,
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: 20,
    });

    // Get views by day for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const viewsByDay = await prisma.profileView.groupBy({
      by: ['viewedAt'],
      where: {
        businessId: business.id,
        viewedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Format views by day
    const viewsTimeline = viewsByDay.map(item => ({
      date: item.viewedAt.toISOString().split('T')[0],
      count: item._count,
    }));

    return NextResponse.json({
      views: {
        total: totalViews,
        today: todayViews,
        thisWeek: weekViews,
        thisMonth: monthViews,
        recentViews: recentViews.map(view => ({
          id: view.id,
          viewedAt: view.viewedAt,
          viewer: view.viewer ? {
            name: `${view.viewer.firstName} ${view.viewer.lastName}`,
            company: view.viewer.company,
            country: view.viewer.country,
            role: view.viewer.role,
          } : null,
        })),
        timeline: viewsTimeline,
      },
    }, { status: 200, headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
