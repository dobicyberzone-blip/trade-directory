/**
 * Admin Analytics Overview API
 * GET operation for dashboard overview metrics
 */

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';
import prisma from '@/lib/prisma';
import { getCached, setCached } from '@/lib/query-cache';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/admin/analytics/overview - Dashboard overview metrics
export const GET = requirePermission(
  Permission.ANALYTICS_VIEW,
  async () => {
    try {
      // Check cache first (5 minute TTL for analytics)
      const cacheKey = 'analytics:overview';
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached, { headers: corsHeaders });
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get current period counts - all in parallel
      const [
        totalUsers,
        totalBusinesses,
        totalProducts,
        totalInquiries,
        activeUsers,
        verificationPending,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.product.count(),
        prisma.inquiry.count(),
        prisma.user.count({
          where: {
            updatedAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.business.count({
          where: { verificationStatus: 'PENDING' },
        }),
      ]);

      // Get previous period counts for growth calculation - all in parallel
      const [
        previousUsers,
        previousBusinesses,
        previousProducts,
        previousInquiries,
      ] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { lt: thirtyDaysAgo },
          },
        }),
        prisma.business.count({
          where: {
            createdAt: { lt: thirtyDaysAgo },
          },
        }),
        prisma.product.count({
          where: {
            createdAt: { lt: thirtyDaysAgo },
          },
        }),
        prisma.inquiry.count({
          where: {
            createdAt: { lt: thirtyDaysAgo },
          },
        }),
      ]);

      // Calculate growth percentages
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const usersGrowth = calculateGrowth(totalUsers, previousUsers);
      const businessesGrowth = calculateGrowth(totalBusinesses, previousBusinesses);
      const productsGrowth = calculateGrowth(totalProducts, previousProducts);
      const inquiriesGrowth = calculateGrowth(totalInquiries, previousInquiries);

      const response = {
        metrics: {
          totalUsers: {
            value: totalUsers,
            growth: usersGrowth,
          },
          totalBusinesses: {
            value: totalBusinesses,
            growth: businessesGrowth,
          },
          totalProducts: {
            value: totalProducts,
            growth: productsGrowth,
          },
          totalInquiries: {
            value: totalInquiries,
            growth: inquiriesGrowth,
          },
          activeUsers: {
            value: activeUsers,
            period: 'Last 30 days',
          },
          verificationPending: {
            value: verificationPending,
          },
        },
      };

      // Cache the response for 5 minutes
      setCached(cacheKey, response, 5 * 60 * 1000);

      return NextResponse.json(response, { headers: corsHeaders });
    } catch (error) {

      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
