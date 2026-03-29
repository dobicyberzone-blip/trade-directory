import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { getCached, setCached } from '@/lib/query-cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const decoded = await verifyToken(request);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (decoded.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check cache first (5 minutes cache for dashboard stats)
    const cacheKey = 'admin:dashboard:stats';
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: corsHeaders });
    }

    // Calculate date ranges
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all counts in parallel using optimized queries
    const [
      totalUsers,
      totalBusinesses,
      totalProducts,
      pendingVerifications,
      verifiedBusinesses,
      rejectedBusinesses,
      newUsersThisMonth,
      usersLastMonth,
      newBusinessesThisMonth,
      businessesLastMonth,
      newProductsThisMonth,
      productsLastMonth,
      pendingLastWeek,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.business.count(),
      prisma.product.count(),
      
      // Verification status counts
      prisma.business.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.business.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.business.count({ where: { verificationStatus: 'REJECTED' } }),
      
      // Current month counts
      prisma.user.count({ where: { createdAt: { gte: currentMonth } } }),
      prisma.user.count({ 
        where: { 
          createdAt: { gte: lastMonth, lt: currentMonth } 
        } 
      }),
      prisma.business.count({ where: { createdAt: { gte: currentMonth } } }),
      prisma.business.count({ 
        where: { 
          createdAt: { gte: lastMonth, lt: currentMonth } 
        } 
      }),
      prisma.product.count({ where: { createdAt: { gte: currentMonth } } }),
      prisma.product.count({ 
        where: { 
          createdAt: { gte: lastMonth, lt: currentMonth } 
        } 
      }),
      
      // Pending last week
      prisma.business.count({
        where: {
          verificationStatus: 'PENDING',
          createdAt: { lt: lastWeek }
        }
      }),
    ]);

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0 
      ? ((newUsersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : newUsersThisMonth > 0 ? 100 : 0;
    
    const businessGrowth = businessesLastMonth > 0 
      ? ((newBusinessesThisMonth - businessesLastMonth) / businessesLastMonth * 100).toFixed(1)
      : newBusinessesThisMonth > 0 ? 100 : 0;
    
    const productGrowth = productsLastMonth > 0 
      ? ((newProductsThisMonth - productsLastMonth) / productsLastMonth * 100).toFixed(1)
      : newProductsThisMonth > 0 ? 100 : 0;
    
    const pendingGrowth = pendingLastWeek > 0 
      ? ((pendingVerifications - pendingLastWeek) / pendingLastWeek * 100).toFixed(1)
      : pendingVerifications > 0 ? 100 : 0;

    // Fetch monthly data for charts (last 6 months) using raw query for better performance
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const monthlyBusinesses = await prisma.$queryRaw<Array<{month: string, count: bigint}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        COUNT(*)::bigint as count
      FROM businesses
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    const monthlyProducts = await prisma.$queryRaw<Array<{month: string, count: bigint}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        COUNT(*)::bigint as count
      FROM products
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    const monthlyUsers = await prisma.$queryRaw<Array<{month: string, count: bigint}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        COUNT(*)::bigint as count
      FROM users
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    // Fetch sector distribution using raw query
    const sectorData = await prisma.$queryRaw<Array<{sector: string, count: bigint}>>`
      SELECT 
        COALESCE(sector, 'Other') as sector,
        COUNT(*)::bigint as count
      FROM businesses
      WHERE sector IS NOT NULL
      GROUP BY sector
      ORDER BY count DESC
      LIMIT 10
    `;

    const response = {
      stats: {
        totalUsers,
        totalBusinesses,
        totalProducts,
        totalInquiries: 0,
        pendingVerifications,
        verifiedBusinesses,
        rejectedBusinesses,
        newUsersThisMonth,
        newBusinessesThisMonth,
        userGrowth: parseFloat(userGrowth as string),
        businessGrowth: parseFloat(businessGrowth as string),
        productGrowth: parseFloat(productGrowth as string),
        pendingGrowth: parseFloat(pendingGrowth as string),
        monthlyGrowth: parseFloat(businessGrowth as string),
        pageViews: 0, // Will be populated by analytics endpoint
        uniqueVisitors: 0,
        conversionRate: 0,
        activeUsers: 0,
        averageResponseTime: 0,
      },
      monthlyData: {
        businesses: monthlyBusinesses.map(m => ({ month: m.month, count: Number(m.count) })),
        products: monthlyProducts.map(m => ({ month: m.month, count: Number(m.count) })),
        users: monthlyUsers.map(m => ({ month: m.month, count: Number(m.count) })),
      },
      sectorData: sectorData.map(s => ({ sector: s.sector, count: Number(s.count) })),
    };

    // Cache for 5 minutes
    setCached(cacheKey, response, 5 * 60 * 1000);

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500, headers: corsHeaders }
    );
  }
}

