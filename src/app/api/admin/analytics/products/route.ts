/**
 * Admin Product Analytics API
 * Returns detailed product statistics and analytics
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
    
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get product statistics using parallel queries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalProducts,
      verifiedProducts,
      unverifiedProducts,
      productsByCategory,
      recentProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: { verified: true },
      }),
      prisma.product.count({
        where: { verified: false },
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: true,
        where: {
          category: { not: '' },
        },
      }),
      prisma.product.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        total: totalProducts,
        verified: verifiedProducts,
        unverified: unverifiedProducts,
        byCategory: productsByCategory.reduce((acc, item) => {
          if (item.category) {
            acc[item.category] = item._count as number;
          }
          return acc;
        }, {} as Record<string, number>),
        recentProducts,
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}



