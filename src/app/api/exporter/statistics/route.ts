/**
 * Exporter Statistics API
 * 
 * Provides real-time exporter activity statistics from database
 * Tracks: products, inquiries, profile views, favorites, ratings
 * Includes monthly trends and product performance
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to get user from token
function getUserFromToken(request: NextRequest): { userId: string; role: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Get month name from date
function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only exporters can access this endpoint
    if (user.role !== 'EXPORTER') {
      return NextResponse.json(
        { error: 'Only exporters can access this endpoint' },
        { status: 403 }
      );
    }

    const userId = user.userId;

    // Get exporter's business
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Fetch current statistics
    const [
      totalProducts,
      totalInquiries,
      totalProfileViews,
      totalFavorites,
      totalRatings,
    ] = await Promise.all([
      // Total products
      prisma.product.count({
        where: { businessId },
      }),

      // Total inquiries
      prisma.inquiry.count({
        where: { businessId },
      }),

      // Total profile views
      prisma.profileView.count({
        where: { businessId },
      }),

      // Total favorites
      prisma.favorite.count({
        where: { businessId },
      }),

      // Total ratings
      prisma.rating.count({
        where: { businessId },
      }),
    ]);

    // Calculate growth percentages (current month vs last month)
    const [
      currentMonthInquiries,
      lastMonthInquiries,
      currentMonthViews,
      lastMonthViews,
      currentMonthFavorites,
      lastMonthFavorites,
    ] = await Promise.all([
      prisma.inquiry.count({
        where: {
          businessId,
          createdAt: { gte: currentMonthStart },
        },
      }),
      prisma.inquiry.count({
        where: {
          businessId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      prisma.profileView.count({
        where: {
          businessId,
          createdAt: { gte: currentMonthStart },
        },
      }),
      prisma.profileView.count({
        where: {
          businessId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      prisma.favorite.count({
        where: {
          businessId,
          createdAt: { gte: currentMonthStart },
        },
      }),
      prisma.favorite.count({
        where: {
          businessId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const inquiryGrowth = calculateGrowth(currentMonthInquiries, lastMonthInquiries);
    const viewsGrowth = calculateGrowth(currentMonthViews, lastMonthViews);
    const favoritesGrowth = calculateGrowth(currentMonthFavorites, lastMonthFavorites);

    // Calculate average rating
    const ratings = await prisma.rating.findMany({
      where: { businessId },
      select: { rating: true },
    });
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Calculate response rate
    const respondedInquiries = await prisma.inquiry.count({
      where: {
        businessId,
        status: 'RESPONDED',
      },
    });
    const responseRate = totalInquiries > 0 
      ? Math.round((respondedInquiries / totalInquiries) * 100) 
      : 0;

    // Get monthly activity data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = getMonthName(monthStart);

      const [monthInquiries, monthViews, monthFavorites] = await Promise.all([
        prisma.inquiry.count({
          where: {
            businessId,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.profileView.count({
          where: {
            businessId,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.favorite.count({
          where: {
            businessId,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
      ]);

      monthlyData.push({
        month: monthName,
        inquiries: monthInquiries,
        views: monthViews,
        favorites: monthFavorites,
      });
    }

    // Get top performing products
    const products = await prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: {
            inquiries: true,
          },
        },
      },
      orderBy: {
        inquiries: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const topProducts = products.map(p => ({
      name: p.name,
      category: p.category,
      inquiries: p._count.inquiries,
    }));

    // Get inquiry sources (which products get most inquiries)
    const productInquiries = await prisma.inquiry.groupBy({
      by: ['productId'],
      where: { businessId },
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: 5,
    });

    const inquirySourceData = await Promise.all(
      productInquiries.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, category: true },
        });
        return {
          name: product?.name || 'Unknown',
          category: product?.category || 'Unknown',
          value: item._count.productId,
        };
      })
    );

    // Return statistics
    return NextResponse.json({
      statistics: {
        totalProducts,
        totalInquiries,
        totalProfileViews,
        totalFavorites,
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        responseRate,
        inquiryGrowth,
        viewsGrowth,
        favoritesGrowth,
      },
      monthlyData,
      topProducts,
      inquirySourceData,
    });
  } catch (error) {
    console.error('[Exporter Statistics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exporter statistics' },
      { status: 500 }
    );
  }
}
