import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = tokenPayload.userId;

    // Fetch actual inquiries sent by the buyer
    const inquiries = await prisma.inquiry.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch user activities
    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Fetch favorites
    const favorites = await prisma.favorite.findMany({
      where: { userId },
    });

    // Get business details for favorites
    const favoriteBusinessIds = favorites.map(f => f.businessId);
    const favoriteBusinesses = await prisma.business.findMany({
      where: { id: { in: favoriteBusinessIds } },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    const favoritesWithBusiness = favorites.map(f => {
      const business = favoriteBusinesses.find(b => b.id === f.businessId);
      return {
        ...f,
        business: business || null,
      };
    });

    // Fetch ratings given by user
    const ratings = await prisma.rating.findMany({
      where: { userId },
    });

    // Get business details for ratings
    const ratingBusinessIds = ratings.map(r => r.businessId);
    const ratingBusinesses = await prisma.business.findMany({
      where: { id: { in: ratingBusinessIds } },
      select: {
        id: true,
        name: true,
      },
    });

    const ratingsWithBusiness = ratings.map(r => {
      const business = ratingBusinesses.find(b => b.id === r.businessId);
      return {
        ...r,
        business: business || null,
      };
    });

    // Calculate time-based statistics
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count activities by type and time
    const inquirySentActivities = activities.filter(a => a.action === 'INQUIRY_SENT');
    const businessViewedActivities = activities.filter(a => a.action === 'BUSINESS_VIEWED');
    const searchActivities = activities.filter(a => a.action === 'SEARCH_PERFORMED');

    // Current month stats - use actual inquiries from Inquiry table
    const inquiriesThisMonth = inquiries.filter(
      i => new Date(i.createdAt) >= currentMonth
    ).length;
    
    const inquiriesLastMonth = inquiries.filter(
      i => new Date(i.createdAt) >= lastMonth && new Date(i.createdAt) < currentMonth
    ).length;

    const favoritesThisMonth = favoritesWithBusiness.filter(
      f => new Date(f.createdAt) >= currentMonth
    ).length;
    
    const favoritesLastMonth = favoritesWithBusiness.filter(
      f => new Date(f.createdAt) >= lastMonth && new Date(f.createdAt) < currentMonth
    ).length;

    // Calculate growth percentages
    const inquiryGrowth = inquiriesLastMonth > 0
      ? ((inquiriesThisMonth - inquiriesLastMonth) / inquiriesLastMonth * 100).toFixed(1)
      : inquiriesThisMonth > 0 ? 100 : 0;

    const supplierGrowth = favoritesLastMonth > 0
      ? ((favoritesThisMonth - favoritesLastMonth) / favoritesLastMonth * 100).toFixed(1)
      : favoritesThisMonth > 0 ? 100 : 0;

    // Generate monthly activity data for last 6 months
    const monthlyActivity = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      // Use actual inquiries from Inquiry table
      const monthInquiries = inquiries.filter(
        i => new Date(i.createdAt) >= monthStart && new Date(i.createdAt) < monthEnd
      ).length;
      
      const monthViews = businessViewedActivities.filter(
        a => new Date(a.createdAt) >= monthStart && new Date(a.createdAt) < monthEnd
      ).length;
      
      const monthSearches = searchActivities.filter(
        a => new Date(a.createdAt) >= monthStart && new Date(a.createdAt) < monthEnd
      ).length;

      monthlyActivity.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        inquiries: monthInquiries,
        views: monthViews,
        searches: monthSearches,
      });
    }

    // Generate daily activity for last 7 days
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Use actual inquiries from Inquiry table
      const dayInquiries = inquiries.filter(
        i => new Date(i.createdAt) >= dayStart && new Date(i.createdAt) <= dayEnd
      ).length;
      
      const dayViews = businessViewedActivities.filter(
        a => new Date(a.createdAt) >= dayStart && new Date(a.createdAt) <= dayEnd
      ).length;

      dailyActivity.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        inquiries: dayInquiries,
        views: dayViews,
      });
    }

    // Top viewed businesses
    const businessViews: { [key: string]: number } = {};
    businessViewedActivities.forEach(activity => {
      const metadata = activity.metadata as any;
      const businessId = metadata?.businessId;
      if (businessId && typeof businessId === 'string') {
        businessViews[businessId] = (businessViews[businessId] || 0) + 1;
      }
    });

    const topViewedBusinessIds = Object.entries(businessViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const topViewedBusinesses = await prisma.business.findMany({
      where: { id: { in: topViewedBusinessIds } },
      select: {
        id: true,
        name: true,
        sector: true,
      },
    });

    const topViewed = topViewedBusinesses.map(business => ({
      ...business,
      views: businessViews[business.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalInquiries: inquiries.length, // Use actual inquiries count
          savedSuppliers: favoritesWithBusiness.length,
          totalViews: businessViewedActivities.length,
          totalSearches: searchActivities.length,
          totalRatings: ratingsWithBusiness.length,
          inquiryGrowth: parseFloat(inquiryGrowth as string),
          supplierGrowth: parseFloat(supplierGrowth as string),
        },
        monthlyActivity,
        dailyActivity,
        topViewedBusinesses: topViewed,
        recentFavorites: favoritesWithBusiness.slice(0, 5).map(f => ({
          businessId: f.businessId,
          businessName: f.business?.name || 'Unknown',
          addedAt: f.createdAt,
        })),
        recentRatings: ratingsWithBusiness.slice(0, 5).map(r => ({
          businessName: r.business?.name || 'Unknown',
          rating: r.rating,
          createdAt: r.createdAt,
        })),
        recentInquiries: inquiries.slice(0, 5).map(i => ({
          productName: i.product?.name || 'Unknown',
          status: i.status,
          createdAt: i.createdAt,
        })),
      },
    });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
