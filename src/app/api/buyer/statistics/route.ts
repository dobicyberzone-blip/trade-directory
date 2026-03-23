import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user || !user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Fetch favorites
    const totalFavorites = await prisma.favorite.count({
      where: { userId }
    });
    
    const favoritesLastMonth = await prisma.favorite.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } }
    });
    
    const favoritesPreviousMonth = await prisma.favorite.count({
      where: { userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });
    
    // Fetch searches
    const totalSearches = await prisma.search.count({
      where: { userId }
    });
    
    const searchesLastMonth = await prisma.search.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } }
    });
    
    const searchesPreviousMonth = await prisma.search.count({
      where: { userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });
    
    // Fetch inquiries
    const totalInquiries = await prisma.inquiry.count({
      where: { buyerId: userId }
    });
    
    const inquiriesLastMonth = await prisma.inquiry.count({
      where: { buyerId: userId, createdAt: { gte: thirtyDaysAgo } }
    });
    
    const inquiriesPreviousMonth = await prisma.inquiry.count({
      where: { buyerId: userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });
    
    // Fetch profile views
    const businessesViewed = await prisma.profileView.count({
      where: { viewerId: userId }
    });
    
    const viewsLastMonth = await prisma.profileView.count({
      where: { viewerId: userId, viewedAt: { gte: thirtyDaysAgo } }
    });
    
    const viewsPreviousMonth = await prisma.profileView.count({
      where: { viewerId: userId, viewedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });
    
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    const activeConversations = await prisma.inquiry.count({
      where: { buyerId: userId, response: { not: null } }
    });
    
    const inquiriesWithResponses = await prisma.inquiry.count({
      where: { buyerId: userId, response: { not: null } }
    });
    
    const responseRate = totalInquiries > 0 
      ? Math.round((inquiriesWithResponses / totalInquiries) * 100) 
      : 0;
    
    const inquiriesWithResponseTime = await prisma.inquiry.findMany({
      where: { buyerId: userId, respondedAt: { not: null } },
      select: { createdAt: true, respondedAt: true }
    });
    
    let totalResponseTimeHours = 0;
    let responseCount = 0;
    
    inquiriesWithResponseTime.forEach((inquiry) => {
      if (inquiry.respondedAt) {
        const timeDiff = inquiry.respondedAt.getTime() - inquiry.createdAt.getTime();
        totalResponseTimeHours += timeDiff / (1000 * 60 * 60);
        responseCount++;
      }
    });
    
    const avgHours = responseCount > 0 ? Math.round(totalResponseTimeHours / responseCount) : 0;
    const avgResponseTime = avgHours + 'h';
    
    // Monthly data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const inquiries = await prisma.inquiry.count({
        where: { buyerId: userId, createdAt: { gte: monthStart, lte: monthEnd } }
      });
      
      const favorites = await prisma.favorite.count({
        where: { userId, createdAt: { gte: monthStart, lte: monthEnd } }
      });
      
      const searches = await prisma.search.count({
        where: { userId, createdAt: { gte: monthStart, lte: monthEnd } }
      });
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        searches,
        inquiries,
        favorites
      });
    }
    
    // Category data
    const favoriteBusinesses = await prisma.favorite.findMany({
      where: { userId },
      include: { business: { select: { sector: true } } }
    });
    
    const inquiryBusinesses = await prisma.inquiry.findMany({
      where: { buyerId: userId },
      include: { business: { select: { sector: true } } }
    });
    
    const categoryMap = new Map<string, number>();
    
    favoriteBusinesses.forEach((fav) => {
      const sector = fav.business.sector || 'Other';
      categoryMap.set(sector, (categoryMap.get(sector) || 0) + 1);
    });
    
    inquiryBusinesses.forEach((inq) => {
      const sector = inq.business.sector || 'Other';
      categoryMap.set(sector, (categoryMap.get(sector) || 0) + 1);
    });
    
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    return NextResponse.json({
      statistics: {
        totalSearches,
        totalFavorites,
        totalInquiries,
        businessesViewed,
        searchGrowth: calculateGrowth(searchesLastMonth, searchesPreviousMonth),
        favoriteGrowth: calculateGrowth(favoritesLastMonth, favoritesPreviousMonth),
        inquiryGrowth: calculateGrowth(inquiriesLastMonth, inquiriesPreviousMonth),
        viewsGrowth: calculateGrowth(viewsLastMonth, viewsPreviousMonth),
        activeConversations,
        responseRate,
        avgResponseTime
      },
      monthlyData,
      categoryData
    });
  } catch (error) {
    console.error('[Buyer Statistics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buyer statistics' },
      { status: 500 }
    );
  }
}
