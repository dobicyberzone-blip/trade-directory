import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get total exporters (businesses)
    const totalExporters = await prisma.business.count();

    // Get verified exporters
    const verifiedExporters = await prisma.business.count({
      where: {
        verificationStatus: 'VERIFIED',
      },
    });

    // Get unique product categories
    const products = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });
    const productCategories = products.filter(p => p.category).length;

    // Get unique export markets (countries reached)
    const businesses = await prisma.business.findMany({
      select: {
        currentExportMarkets: true,
      },
      where: {
        currentExportMarkets: {
          not: null,
        },
      },
    });

    // Parse export markets and count unique countries
    const uniqueCountries = new Set<string>();
    businesses.forEach(business => {
      if (business.currentExportMarkets) {
        const markets = business.currentExportMarkets.split(',').map(m => m.trim());
        markets.forEach(market => {
          if (market) uniqueCountries.add(market);
        });
      }
    });

    const countriesReached = uniqueCountries.size;

    return NextResponse.json({
      totalExporters,
      verifiedExporters,
      productCategories,
      countriesReached,
    });
  } catch (error) {
    return NextResponse.json(
      {
        totalExporters: 0,
        verifiedExporters: 0,
        productCategories: 0,
        countriesReached: 0,
      },
      { status: 200 }
    );
  }
}
