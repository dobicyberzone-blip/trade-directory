/**
 * Dashboard Statistics API
 * Returns real-time counts for verified exporters, product categories, and countries reached
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get count of verified exporters (businesses with verificationStatus = 'VERIFIED')
    const verifiedExporters = await prisma.business.count({
      where: {
        verificationStatus: 'VERIFIED',
      },
    });

    // Get count of product categories
    const categories = await prisma.category.count();

    // Get count of countries reached (from unique export markets)
    const businessesWithExportMarkets = await prisma.business.findMany({
      where: {
        currentExportMarkets: {
          not: null,
        },
      },
      select: {
        currentExportMarkets: true,
      },
    });

    // Extract unique countries from export markets
    const uniqueCountries = new Set<string>();
    businessesWithExportMarkets.forEach((business) => {
      if (business.currentExportMarkets) {
        // Split by comma and clean up
        const markets = business.currentExportMarkets.split(',').map((m) => m.trim());
        markets.forEach((market) => {
          if (market) {
            uniqueCountries.add(market);
          }
        });
      }
    });

    const countriesReached = uniqueCountries.size;

    return NextResponse.json({
      verifiedExporters,
      categories,
      countriesReached,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
