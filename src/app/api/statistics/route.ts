/**
 * Statistics API - Returns platform statistics for homepage
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all statistics in parallel for performance
    const [
      totalBusinesses,
      verifiedExporters,
      totalProducts,
      totalUsers,
      tradeInquiries,
      successStories,
      productCategories,
      exportMarkets,
    ] = await Promise.all([
      // Total businesses
      prisma.business.count(),
      
      // Verified exporters (VERIFIED status)
      prisma.business.count({
        where: { verificationStatus: 'VERIFIED' }
      }),
      
      // Total products
      prisma.product.count(),
      
      // Total users
      prisma.user.count(),
      
      // Trade inquiries
      prisma.inquiry.count(),
      
      // Success stories
      prisma.successStory.count({
        where: { isApproved: true }
      }),
      
      // Product categories (distinct)
      prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
      }),
      
      // Export markets
      prisma.exportMarket.count({
        where: { isActive: true }
      }),
    ]);

    const statistics = {
      totalBusinesses,
      totalExporters: totalBusinesses, // Alias
      verifiedExporters,
      productCategories: productCategories.length,
      countriesReached: exportMarkets,
      tradeInquiries,
      totalUsers,
      totalProducts,
      successStories,
    };

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {

    // Return fallback statistics on error
    return NextResponse.json({
      success: false,
      statistics: {
        totalExporters: 100,
        verifiedExporters: 50,
        productCategories: 25,
        countriesReached: 15,
        tradeInquiries: 200,
        totalUsers: 100,
        totalProducts: 150,
        totalBusinesses: 75,
        successStories: 10,
      },
    });
  }
}
