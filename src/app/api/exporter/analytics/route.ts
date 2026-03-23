import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Get exporter analytics
export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get business for this user
    const business = await prisma.business.findUnique({
      where: { ownerId: tokenPayload.userId },
      include: {
        products: true,
        ratings: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { 
          success: true, 
          data: {
            stats: {
              totalProducts: 0,
              totalInquiries: 0,
              respondedInquiries: 0,
              pendingInquiries: 0,
              productGrowth: 0,
              inquiryGrowth: 0,
              totalRatings: 0,
            },
            monthlyActivity: []
          }
        },
        { headers: corsHeaders }
      );
    }

    // Get inquiries count (through products)
    const productIds = business.products.map(p => p.id);
    
    const totalInquiries = await prisma.inquiry.count({
      where: { productId: { in: productIds } },
    });

    const respondedInquiries = await prisma.inquiry.count({
      where: { 
        productId: { in: productIds },
        status: { in: ['RESPONDED', 'CLOSED'] }
      },
    });

    const pendingInquiries = await prisma.inquiry.count({
      where: { 
        productId: { in: productIds },
        status: 'PENDING'
      },
    });

    // Get profile views count
    let totalProfileViews = 0;
    try {
      totalProfileViews = await prisma.profileView.count({
        where: { businessId: business.id },
      });
    } catch (error) {

      // Table will be available after running: npx prisma generate && npx prisma db push
    }

    // Calculate growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentProducts = await prisma.product.count({
      where: {
        businessId: business.id,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const previousProducts = await prisma.product.count({
      where: {
        businessId: business.id,
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    });

    const productGrowth = previousProducts > 0 
      ? Math.round(((recentProducts - previousProducts) / previousProducts) * 100)
      : recentProducts > 0 ? 100 : 0;

    const recentInquiries = await prisma.inquiry.count({
      where: {
        productId: { in: productIds },
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const previousInquiries = await prisma.inquiry.count({
      where: {
        productId: { in: productIds },
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    });

    const inquiryGrowth = previousInquiries > 0 
      ? Math.round(((recentInquiries - previousInquiries) / previousInquiries) * 100)
      : recentInquiries > 0 ? 100 : 0;

    // Get monthly activity for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyInquiries = productIds.length > 0 ? await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        COUNT(*)::int as count
      FROM "inquiries"
      WHERE "productId" = ANY(${productIds})
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    ` : [];

    const monthlyViews = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        COUNT(*)::int as count
      FROM "profile_views"
      WHERE "businessId" = ${business.id}
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `.catch(() => []);

    // Generate monthly activity data
    const monthlyActivity = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      
      const inquiryData = monthlyInquiries.find(m => m.month === monthName);
      const viewData = monthlyViews.find(m => m.month === monthName);
      
      monthlyActivity.push({
        month: monthName,
        inquiries: inquiryData?.count || 0,
        views: viewData?.count || 0,
      });
    }

    const stats = {
      totalProducts: business.products.length,
      totalInquiries,
      respondedInquiries,
      pendingInquiries,
      productGrowth,
      inquiryGrowth,
      totalRatings: business.ratings.length,
      profileViews: totalProfileViews,
    };

    return NextResponse.json(
      { 
        success: true, 
        data: {
          stats,
          monthlyActivity
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500, headers: corsHeaders }
    );
  }
}
