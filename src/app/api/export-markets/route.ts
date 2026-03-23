import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch active export markets (public endpoint for exporters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '';

    const where: any = { isActive: true };

    if (region) {
      where.region = region;
    }

    const markets = await prisma.exportMarket.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ markets });
  } catch (error) {

    // Return empty array instead of error to prevent UI from breaking
    return NextResponse.json({ 
      markets: [],
      error: 'Database temporarily unavailable. Using cached data.' 
    });
  }
}
